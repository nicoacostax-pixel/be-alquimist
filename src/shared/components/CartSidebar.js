import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../context/CartContext';

function toCategoryPath(value = '') {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function formatMoney(value) {
  return `$ ${Number(value || 0).toFixed(2)}`;
}

function CartSidebar({ isOpen, onClose }) {
  const {
    cart,
    cartCount,
    cartSubtotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    getItemKey,
  } = useCart();
  const navigate = useNavigate();
  const [recommended, setRecommended] = useState([]);

  const cartIdSet = useMemo(() => new Set(cart.map((item) => item.id)), [cart]);

  useEffect(() => {
    if (!isOpen) return;

    const loadRecommended = async () => {
      const { data } = await supabase
        .from('productos')
        .select('id,nombre,categoria,slug,imagen_url,variantes')
        .order('created_at', { ascending: false })
        .limit(8);

      const filtered = (data || []).filter((item) => !cartIdSet.has(item.id)).slice(0, 2);
      setRecommended(filtered);
    };

    loadRecommended();
  }, [isOpen, cartIdSet]);

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={onClose}></div>}

      <aside className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-sidebar-header">
          <h3>CARRITO DE COMPRAS ({cartCount})</h3>
          <button className="cart-close-btn" onClick={onClose} aria-label="Cerrar carrito">
            <X size={30} />
          </button>
        </div>

        <div className="cart-sidebar-body">
          {cart.length === 0 ? (
            <p className="cart-empty-msg">Tu carrito está vacío.</p>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => {
                const itemKey = getItemKey(item);
                return (
                  <div key={itemKey} className="cart-item-row">
                    <div className="cart-item-image-wrap">
                      <img src={item.imagen} alt={item.nombre} />
                    </div>
                    <div className="cart-item-info">
                      <p className="cart-item-price">{formatMoney(item.precio)}</p>
                      <p className="cart-item-name">{item.nombre}</p>
                      <p className="cart-item-presentacion">{item.presentacion}</p>
                      <div className="cart-item-actions">
                        <button type="button" onClick={() => decreaseQuantity(itemKey)} aria-label="Disminuir">
                          <Minus size={16} />
                        </button>
                        <span>{item.cantidad}</span>
                        <button type="button" onClick={() => increaseQuantity(itemKey)} aria-label="Aumentar">
                          <Plus size={16} />
                        </button>
                        <button type="button" className="cart-remove-link" onClick={() => removeFromCart(itemKey)}>
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {recommended.length > 0 && (
            <div className="cart-recommended">
              <h4>También podría interesarte</h4>
              <div className="cart-recommended-grid">
                {recommended.map((item) => (
                  <Link
                    key={item.id}
                    to={`/insumos/${toCategoryPath(item.categoria)}/${item.slug}`}
                    className="cart-recommended-card"
                    onClick={onClose}
                  >
                    <img src={item.imagen_url} alt={item.nombre} />
                    <p>{formatMoney(item.variantes?.[0]?.precio)}</p>
                    <span>{item.nombre}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cart-sidebar-footer">
          <div className="cart-total-row">
            <span>Total</span>
            <strong>{formatMoney(cartSubtotal)}</strong>
          </div>
          <p>Impuestos incluidos. Costos de envío calculados al finalizar la compra.</p>
          <div className="cart-footer-buttons">
            <button type="button" className="cart-btn dark" onClick={onClose}>Seguir comprando</button>
            <button type="button" className="cart-btn light" onClick={() => { onClose(); navigate('/checkout'); }}>Finalizar compra</button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default CartSidebar;

