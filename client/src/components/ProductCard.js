import React, { useState } from 'react';

export default function ProductCard({ product, onAddToCart, isInCart = false }) {
  const [adding,   setAdding]   = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    title, description, price, stock, category,
    image_url, location, seller_name, seller_location,
  } = product;

  const displayLocation = location || seller_location || '—';
  const isOutOfStock    = stock === 0;

  const handleAdd = async () => {
    if (isOutOfStock || adding) return;
    setAdding(true);
    await onAddToCart(product.id);
    setAdding(false);
  };

  const categoryColors = {
    Vegetables: { bg: '#dcfce7', color: '#16a34a' },
    Fruits:     { bg: '#fef3c7', color: '#d97706' },
    Grains:     { bg: '#dbeafe', color: '#2563eb' },
    Dairy:      { bg: '#f3e8ff', color: '#7c3aed' },
    Spices:     { bg: '#fee2e2', color: '#dc2626' },
    Other:      { bg: '#f3f4f6', color: '#374151' },
  };
  const catStyle = categoryColors[category] || categoryColors.Other;

  return (
    <div style={S.card}>
      <div style={S.imgWrap}>
        {image_url && !imgError
          ? <img src={image_url} alt={title} style={S.img} onError={() => setImgError(true)} />
          : <div style={S.imgPlaceholder}>
              {category === 'Vegetables' ? '🥦' : category === 'Fruits' ? '🥭' : category === 'Grains' ? '🌾' : category === 'Dairy' ? '🥛' : category === 'Spices' ? '🌶️' : '📦'}
            </div>
        }
        <span style={{ ...S.catBadge, background: catStyle.bg, color: catStyle.color }}>{category}</span>
        {isOutOfStock && <div style={S.outOfStockOverlay}>Out of Stock</div>}
      </div>

      <div style={S.body}>
        <div style={S.title}>{title}</div>
        <div style={S.desc}>{description || 'No description provided.'}</div>

        <div style={S.metaRow}>
          <span style={S.locationChip}>📍 {displayLocation}</span>
          <div style={S.priceBlock}>
            <span style={S.price}>₹{price}</span>
            <span style={S.priceUnit}>/kg</span>
          </div>
        </div>

        <div style={S.sellerRow}>
          <span style={S.sellerDot}>🌿</span>
          <span style={S.sellerName}>{seller_name}</span>
          <span style={S.stockInfo}>· {stock} kg left</span>
        </div>

        <button
          style={{
            ...S.addBtn,
            ...(isOutOfStock ? S.addBtnDisabled : isInCart ? S.addBtnInCart : {}),
          }}
          onClick={handleAdd}
          disabled={isOutOfStock || adding}
        >
          {isOutOfStock ? 'Out of Stock' : adding ? 'Adding...' : isInCart ? '✓ In Cart' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  );
}

const S = {
  card: {
    background: 'white', borderRadius: 18,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    fontFamily: "'Nunito','Segoe UI',sans-serif",
  },
  imgWrap: { position: 'relative', height: 160, background: '#f3f4f6', flexShrink: 0 },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 },
  catBadge: { position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: 0.5 },
  outOfStockOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: 1 },

  body: { padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  title: { fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.3 },
  desc: { fontSize: 12, color: '#6b7280', lineHeight: 1.55, minHeight: 36 },

  metaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  locationChip: { fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '4px 9px', borderRadius: 8 },
  priceBlock: { display: 'flex', alignItems: 'baseline', gap: 1 },
  price: { fontSize: 20, fontWeight: 800, color: '#22c55e' },
  priceUnit: { fontSize: 11, color: '#9ca3af', fontWeight: 400 },

  sellerRow: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' },
  sellerDot: { fontSize: 10 },
  sellerName: { fontWeight: 700, color: '#6b7280' },
  stockInfo: {},

  addBtn: { marginTop: 4, width: '100%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', borderRadius: 12, padding: '10px', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.2s, transform 0.15s' },
  addBtnDisabled: { background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' },
  addBtnInCart: { background: 'linear-gradient(135deg,#22c55e,#15803d)' },
};