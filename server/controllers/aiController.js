const axios = require('axios');
const db    = require('../config/db');

const callGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
  });
  return res.data.candidates[0].content.parts[0].text;
};

const getBuyerInsights = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.title, p.price, p.category, p.location,
             COALESCE(SUM(oi.quantity), 0) AS total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 20
    `);

    const prompt = `
You are an agricultural market analyst AI for AGRI-AI, an Indian farm-to-buyer platform.

Here is the current product data (top selling products):
${JSON.stringify(products, null, 2)}

Based on this data, provide a buyer with:
1. Top 3 best value products right now and why
2. Which products are in high demand (likely to go out of stock soon)
3. Which month each major category (vegetables, fruits, grains) is cheapest based on typical Indian agriculture cycles
4. One smart buying tip for today

Keep your response concise, friendly, and in simple English. Format with clear headings.
    `;

    const aiResponse = await callGemini(prompt);
    return res.status(200).json({ success: true, insights: aiResponse });
  } catch (err) {
    console.error('getBuyerInsights error:', err.message);
    return res.status(500).json({ success: false, message: 'AI service unavailable. Try again later.' });
  }
};

const getSellerSuggestions = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [myProducts] = await db.query(`
      SELECT p.title, p.price, p.category, p.location, p.stock,
             COALESCE(SUM(oi.quantity), 0) AS total_sold
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.seller_id = ?
      GROUP BY p.id
    `, [sellerId]);

    const [topDemand] = await db.query(`
      SELECT p.category, p.location, SUM(oi.quantity) AS demand
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.category, p.location
      ORDER BY demand DESC
      LIMIT 10
    `);

    const prompt = `
You are an agricultural business advisor AI for AGRI-AI, an Indian farm marketplace.

The seller's current products and performance:
${JSON.stringify(myProducts, null, 2)}

Top demand categories and locations on the platform:
${JSON.stringify(topDemand, null, 2)}

Provide the seller with:
1. Which of their products to prioritize restocking
2. Which new product categories are in high demand they should consider selling
3. Which locations have the highest demand for their product types
4. Specific pricing advice — are they priced too high or too low compared to market demand?
5. One actionable tip to increase their profit margin without losing customers

Be specific, practical, and concise. Format with clear numbered points.
    `;

    const aiResponse = await callGemini(prompt);
    return res.status(200).json({ success: true, suggestions: aiResponse });
  } catch (err) {
    console.error('getSellerSuggestions error:', err.message);
    return res.status(500).json({ success: false, message: 'AI service unavailable. Try again later.' });
  }
};

const getPricePrediction = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ success: false, message: 'Category is required.' });

    const [priceHistory] = await db.query(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month, AVG(oi.price) AS avg_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.category = ?
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `, [category]);

    const prompt = `
You are a price forecasting AI for AGRI-AI, an Indian agricultural marketplace.

Historical average prices for ${category} (monthly):
${JSON.stringify(priceHistory, null, 2)}

Based on this data and typical Indian agricultural seasonal patterns:
1. Predict the price trend for the next 3 months
2. What is the best month to buy ${category} at the lowest price?
3. What is the best month to sell ${category} for maximum profit?
4. Give a confidence percentage for your prediction

Be concise and format with clear sections.
    `;

    const aiResponse = await callGemini(prompt);
    return res.status(200).json({ success: true, category, priceHistory, prediction: aiResponse });
  } catch (err) {
    console.error('getPricePrediction error:', err.message);
    return res.status(500).json({ success: false, message: 'AI service unavailable.' });
  }
};

const chatAssistant = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

    const systemContext = `You are AGRI-AI Assistant, a helpful AI for an Indian agricultural marketplace. 
You help farmers sell their produce and buyers find fresh farm products at fair prices. 
You can answer questions about pricing, seasonal availability, farming tips, platform usage, and market trends.
Keep responses helpful, friendly, and concise.`;

    const conversationHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

    const prompt = `${systemContext}\n\nConversation so far:\n${conversationHistory}\n\nUser: ${message}\nAssistant:`;

    const aiResponse = await callGemini(prompt);
    return res.status(200).json({ success: true, reply: aiResponse });
  } catch (err) {
    console.error('chatAssistant error:', err.message);
    return res.status(500).json({ success: false, message: 'AI assistant unavailable. Try again later.' });
  }
};

module.exports = { getBuyerInsights, getSellerSuggestions, getPricePrediction, chatAssistant };