import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, ShoppingBag } from 'lucide-react';
import { useCart } from '../../../shared/context/CartContext';
import '../../../App.css';

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche',
  'Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango',
  'Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco',
  'Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla',
  'Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora',
  'Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
];

function fmt(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

function OrderSummary({ cart, cartSubtotal, shipping, total, descuento, setDescuento }) {
  return (
    <>
      <div className="co-items">
        {cart.map((item, i) => (
          <div key={i} className="co-item">
            <div className="co-item-img-wrap">
              <img src={item.imagen} alt={item.nombre} />
              <span className="co-item-badge">{item.cantidad}</span>
            </div>
            <div className="co-item-info">
              <p className="co-item-name">{item.nombre}</p>
              <p className="co-item-variant">{item.presentacion}</p>
            </div>
            <span className="co-item-price">{fmt(item.precio * item.cantidad)}</span>
          </div>
        ))}
      </div>

      <div className="co-discount-row">
        <input
          type="text"
          placeholder="Código de descuento o tarjeta de regalo"
          value={descuento}
          onChange={e => setDescuento(e.target.value)}
          className="co-input co-discount-input"
        />
        <button type="button" className="co-apply-btn">Aplicar</button>
      </div>

      <div className="co-totals">
        <div className="co-total-line">
          <span>Subtotal</span>
          <span>{fmt(cartSubtotal)}</span>
        </div>
        <div className="co-total-line">
          <span>Envío</span>
          <span className={shipping === null ? 'co-muted' : ''}>
            {shipping !== null ? fmt(shipping) : 'Introducir la dirección de envío'}
          </span>
        </div>
        <div className="co-total-line co-total-final">
          <strong>Total</strong>
          <div className="co-total-amount">
            <small>MXN</small>
            <strong>{fmt(total)}</strong>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Checkout() {
  const { cart, cartSubtotal, cartCount } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', newsletter: true,
    pais: 'México',
    nombre: '', apellidos: '', direccion: '', apartamento: '',
    cp: '', ciudad: '', estado: 'Zacatecas', telefono: '',
    metodoPago: 'tarjeta',
    numeroTarjeta: '', vencimiento: '', cvv: '', titular: '',
    mismaDir: true,
    telefonoMovil: '',
  });
  const [descuento, setDescuento] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('¡Pedido realizado con éxito! Te enviaremos la confirmación por correo.');
    navigate('/');
  };

  const shipping = form.direccion.trim() ? 99 : null;
  const total = cartSubtotal + (shipping || 0);

  if (cart.length === 0) {
    return (
      <div className="co-empty">
        <ShoppingBag size={52} color="#B08968" />
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos para continuar con tu compra.</p>
        <Link to="/insumos" className="co-submit-btn">Explorar productos</Link>
      </div>
    );
  }

  return (
    <div className="co-page">

      {/* ── COLUMNA IZQUIERDA ── */}
      <div className="co-left">

        {/* Marca + breadcrumb */}
        <div className="co-brand-row">
          <Link to="/" className="co-logo">Be Alquimist</Link>
          <nav className="co-steps">
            <span className="co-step-muted">Carrito</span>
            <ChevronRight size={12} />
            <span className="co-step-active">Información</span>
            <ChevronRight size={12} />
            <span className="co-step-muted">Envío</span>
            <ChevronRight size={12} />
            <span className="co-step-muted">Pago</span>
          </nav>
        </div>

        {/* Resumen móvil (toggle) */}
        <button
          type="button"
          className="co-mobile-toggle"
          onClick={() => setSummaryOpen(p => !p)}
        >
          <span className="co-mobile-toggle-left">
            <ShoppingBag size={17} />
            {summaryOpen ? 'Ocultar' : 'Mostrar'} resumen de compra ({cartCount})
            <ChevronRight size={14} className={summaryOpen ? 'rotate-90' : ''} />
          </span>
          <strong>{fmt(total)}</strong>
        </button>

        {summaryOpen && (
          <div className="co-mobile-summary">
            <OrderSummary
              cart={cart} cartSubtotal={cartSubtotal}
              shipping={shipping} total={total}
              descuento={descuento} setDescuento={setDescuento}
            />
          </div>
        )}

        {/* Express checkout */}
        <div className="co-express-row">
          <button type="button" className="co-express co-express-shop">shop</button>
          <button type="button" className="co-express co-express-paypal">Pay<em>Pal</em></button>
          <button type="button" className="co-express co-express-gpay"><b>G</b> Pay</button>
        </div>
        <div className="co-or-divider"><span>O continúa y elige otro método de pago</span></div>

        <form onSubmit={handleSubmit} className="co-form">

          {/* Contacto */}
          <section className="co-section">
            <div className="co-section-head">
              <h2 className="co-section-title">Contacto</h2>
              <Link to="/login" className="co-link">Iniciar sesión</Link>
            </div>
            <div className="co-field">
              <input
                name="email" type="email" required
                placeholder="Correo electrónico"
                value={form.email} onChange={handleChange}
                className="co-input"
              />
            </div>
            <label className="co-check-row">
              <input type="checkbox" name="newsletter" checked={form.newsletter} onChange={handleChange} />
              <span>Enviarme novedades y ofertas por correo electrónico</span>
            </label>
          </section>

          {/* Entrega */}
          <section className="co-section">
            <h2 className="co-section-title">Entrega</h2>
            <div className="co-field co-field-labeled">
              <label>País / Región</label>
              <select name="pais" value={form.pais} onChange={handleChange} className="co-input co-select">
                <option>México</option>
                <option>Estados Unidos</option>
              </select>
            </div>
            <div className="co-field-row">
              <div className="co-field">
                <input name="nombre" type="text" placeholder="Nombre" value={form.nombre} onChange={handleChange} className="co-input" />
              </div>
              <div className="co-field">
                <input name="apellidos" type="text" placeholder="Apellidos" value={form.apellidos} onChange={handleChange} className="co-input" />
              </div>
            </div>
            <div className="co-field">
              <input name="direccion" type="text" placeholder="Dirección" value={form.direccion} onChange={handleChange} className="co-input" />
            </div>
            <div className="co-field">
              <input name="apartamento" type="text" placeholder="Casa, apartamento, etc. (opcional)" value={form.apartamento} onChange={handleChange} className="co-input" />
            </div>
            <div className="co-field-row co-row-3">
              <div className="co-field">
                <input name="cp" type="text" placeholder="Código postal" value={form.cp} onChange={handleChange} className="co-input" />
              </div>
              <div className="co-field">
                <input name="ciudad" type="text" placeholder="Ciudad" value={form.ciudad} onChange={handleChange} className="co-input" />
              </div>
              <div className="co-field co-field-labeled">
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange} className="co-input co-select">
                  {ESTADOS_MX.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div className="co-field co-field-icon">
              <input name="telefono" type="tel" placeholder="Teléfono" value={form.telefono} onChange={handleChange} className="co-input" />
              <span className="co-field-hint">?</span>
            </div>
          </section>

          {/* Métodos de envío */}
          <section className="co-section">
            <h2 className="co-section-title">Métodos de envío</h2>
            {!form.direccion.trim() ? (
              <div className="co-shipping-placeholder">
                <p>Ingresa tu dirección de envío para ver los métodos disponibles.</p>
              </div>
            ) : (
              <div className="co-options-list">
                <label className="co-option-row selected">
                  <div className="co-option-left">
                    <input type="radio" name="envio" defaultChecked readOnly />
                    <span>Envío estándar (3–5 días hábiles)</span>
                  </div>
                  <strong>$99.00 MXN</strong>
                </label>
              </div>
            )}
          </section>

          {/* Pago */}
          <section className="co-section">
            <h2 className="co-section-title">Pago</h2>
            <p className="co-secure-note">
              <Lock size={12} /> Todas las transacciones son seguras y están encriptadas.
            </p>

            <div className="co-options-list co-payment-list">
              {/* Tarjeta */}
              <label className={`co-option-row ${form.metodoPago === 'tarjeta' ? 'selected' : ''}`}>
                <div className="co-option-left">
                  <input type="radio" name="metodoPago" value="tarjeta" checked={form.metodoPago === 'tarjeta'} onChange={handleChange} />
                  <span>Tarjeta de crédito</span>
                </div>
                <div className="co-card-logos">
                  <span className="co-badge visa">VISA</span>
                  <span className="co-badge mc">MC</span>
                  <span className="co-badge amex">AMEX</span>
                </div>
              </label>

              {form.metodoPago === 'tarjeta' && (
                <div className="co-card-form">
                  <div className="co-field co-field-icon">
                    <input name="numeroTarjeta" type="text" placeholder="Número de tarjeta" value={form.numeroTarjeta} onChange={handleChange} className="co-input" maxLength={19} />
                    <Lock size={15} className="co-input-icon" />
                  </div>
                  <div className="co-field-row">
                    <div className="co-field">
                      <input name="vencimiento" type="text" placeholder="Fecha de vencimiento (MM / AA)" value={form.vencimiento} onChange={handleChange} className="co-input" maxLength={7} />
                    </div>
                    <div className="co-field co-field-icon">
                      <input name="cvv" type="text" placeholder="Código de seguridad" value={form.cvv} onChange={handleChange} className="co-input" maxLength={4} />
                      <span className="co-field-hint">?</span>
                    </div>
                  </div>
                  <div className="co-field">
                    <input name="titular" type="text" placeholder="Nombre del titular" value={form.titular} onChange={handleChange} className="co-input" />
                  </div>
                  <label className="co-check-row" style={{ marginTop: '10px' }}>
                    <input type="checkbox" name="mismaDir" checked={form.mismaDir} onChange={handleChange} />
                    <span>Usar la dirección de envío como dirección de facturación</span>
                  </label>
                </div>
              )}

              {/* PayPal */}
              <label className={`co-option-row ${form.metodoPago === 'paypal' ? 'selected' : ''}`}>
                <div className="co-option-left">
                  <input type="radio" name="metodoPago" value="paypal" checked={form.metodoPago === 'paypal'} onChange={handleChange} />
                  <span>PayPal</span>
                </div>
                <span className="co-badge paypal">PayPal</span>
              </label>

              {/* Mercado Pago */}
              <label className={`co-option-row ${form.metodoPago === 'mp' ? 'selected' : ''}`}>
                <div className="co-option-left">
                  <input type="radio" name="metodoPago" value="mp" checked={form.metodoPago === 'mp'} onChange={handleChange} />
                  <span>Mercado Pago</span>
                </div>
                <div className="co-card-logos">
                  <span className="co-badge mp">MP</span>
                  <span className="co-badge visa" style={{ fontSize: '8px' }}>VISA</span>
                  <span className="co-badge mc" style={{ fontSize: '8px' }}>MC</span>
                </div>
              </label>
            </div>
          </section>

          {/* Guardar info */}
          <section className="co-section co-save-section">
            <h3 className="co-save-title">Guardar mi información para pagar más rápido</h3>
            <div className="co-field">
              <input name="telefonoMovil" type="tel" placeholder="Teléfono móvil (opcional) +52" value={form.telefonoMovil} onChange={handleChange} className="co-input" />
            </div>
            <p className="co-terms-text">
              Si proporcionas tu número de teléfono, aceptas crear una cuenta de Shop conforme a los{' '}
              <a href="#!" className="co-link">Términos</a> y la{' '}
              <a href="#!" className="co-link">Política de privacidad</a> de Shop.
            </p>
          </section>

          <button type="submit" className="co-submit-btn">Pagar ahora</button>
        </form>
      </div>

      {/* ── COLUMNA DERECHA: Resumen ── */}
      <aside className="co-summary">
        <OrderSummary
          cart={cart} cartSubtotal={cartSubtotal}
          shipping={shipping} total={total}
          descuento={descuento} setDescuento={setDescuento}
        />
      </aside>
    </div>
  );
}
