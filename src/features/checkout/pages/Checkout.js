import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, ShoppingBag } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../../../shared/context/CartContext';
import { useElementos } from '../../../shared/context/ElementosContext';
import '../../../App.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche',
  'Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango',
  'Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco',
  'Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla',
  'Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora',
  'Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
];

function fmt(v) { return `$${Number(v || 0).toFixed(2)}`; }

const CUPONES = { '300DES': 300 };

function OrderSummary({ cart, cartSubtotal, shipping, total, couponDiscount }) {
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
      <div className="co-totals">
        <div className="co-total-line"><span>Subtotal</span><span>{fmt(cartSubtotal)}</span></div>
        {couponDiscount > 0 && (
          <div className="co-total-line" style={{ color: '#2e7d32' }}>
            <span>Descuento (300DES)</span><span>-{fmt(couponDiscount)}</span>
          </div>
        )}
        <div className="co-total-line">
          <span>Envío</span>
          <span className={shipping === 0 ? 'co-free-shipping' : shipping === null ? 'co-muted' : ''}>
            {shipping === 0 ? '🚚 Gratis' : shipping !== null ? fmt(shipping) : 'Introducir dirección de envío'}
          </span>
        </div>
        <div className="co-total-line co-total-final">
          <strong>Total</strong>
          <div className="co-total-amount"><small>MXN</small><strong>{fmt(total)}</strong></div>
        </div>
      </div>
    </>
  );
}

// ── Stripe payment form (inside Elements context) ──────────────────────────
function StripePayForm({ form, total, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying,  setPaying]  = useState(false);
  const [stripeError, setStripeError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setStripeError('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout/gracias',
        payment_method_data: {
          billing_details: {
            name:  `${form.nombre} ${form.apellidos}`.trim(),
            email: form.email,
            phone: form.telefono,
            address: {
              line1:       form.direccion,
              line2:       form.apartamento,
              city:        form.ciudad,
              state:       form.estado,
              postal_code: form.cp,
              country:     'MX',
            },
          },
        },
      },
    });

    if (error) {
      setStripeError(error.message);
      setPaying(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="co-stripe-wrap">
      <PaymentElement options={{ layout: 'tabs' }} />
      {stripeError && <p className="co-stripe-error">{stripeError}</p>}
      <button
        type="button"
        className="co-submit-btn"
        onClick={handlePay}
        disabled={!stripe || paying}
        style={{ marginTop: 20 }}
      >
        {paying ? 'Procesando…' : `Pagar ${fmt(total)} MXN`}
      </button>
    </div>
  );
}

// ── Main checkout ───────────────────────────────────────────────────────────
export default function Checkout() {
  const { cart, cartSubtotal, cartCount, clearCart } = useCart();
  const { esPro } = useElementos();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', newsletter: true,
    pais: 'México', nombre: '', apellidos: '',
    direccion: '', apartamento: '', cp: '', ciudad: '',
    estado: 'Ciudad de México', telefono: '',
  });
  const [descuento,      setDescuento]      = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg,      setCouponMsg]      = useState('');
  const [summaryOpen,    setSummaryOpen]    = useState(false);
  const [clientSecret,   setClientSecret]   = useState('');
  const [piError,        setPiError]        = useState('');
  const [loadingPI,      setLoadingPI]      = useState(false);
  const [step,           setStep]           = useState('info');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const hasKit = cart.some(i => i.sku === 'kit-velas-soya-estandar');
  const shipping = (esPro || hasKit || cartSubtotal >= 1999) ? 0 : form.direccion.trim() ? 99 : null;
  const total    = Math.max(0, cartSubtotal - couponDiscount + (shipping || 0));

  function onApplyCoupon() {
    const code = descuento.trim().toUpperCase();
    const disc = CUPONES[code];
    if (disc) {
      setCouponDiscount(disc);
      setCouponMsg(`✓ Cupón aplicado: -$${disc} de descuento`);
    } else {
      setCouponDiscount(0);
      setCouponMsg('Cupón inválido o expirado.');
    }
  }

  // Create PaymentIntent when moving to pay step
  async function handleContinueToPay(e) {
    e.preventDefault();
    if (!form.email || !form.nombre || !form.direccion || !form.cp || !form.ciudad) {
      alert('Completa todos los campos obligatorios.');
      return;
    }
    setLoadingPI(true);
    setPiError('');
    try {
      const res  = await fetch('/api/create-payment-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(total * 100), // pesos → centavos
          currency: 'mxn',
          metadata: { email: form.email, nombre: form.nombre },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error del servidor');
      setClientSecret(json.clientSecret);
      setStep('pay');
    } catch (err) {
      setPiError(err.message);
    } finally {
      setLoadingPI(false);
    }
  }

  function handleSuccess() {
    clearCart?.();
    navigate('/checkout/gracias');
  }

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
      {/* ── Left column ── */}
      <div className="co-left">

        <div className="co-brand-row">
          <Link to="/" className="co-logo">Be Alquimist</Link>
          <nav className="co-steps">
            <span className={step === 'info' ? 'co-step-active' : 'co-step-muted'}>Información</span>
            <ChevronRight size={12} />
            <span className={step === 'pay' ? 'co-step-active' : 'co-step-muted'}>Pago</span>
          </nav>
        </div>

        {/* Mobile summary toggle */}
        <button type="button" className="co-mobile-toggle" onClick={() => setSummaryOpen(p => !p)}>
          <span className="co-mobile-toggle-left">
            <ShoppingBag size={17} />
            {summaryOpen ? 'Ocultar' : 'Mostrar'} resumen ({cartCount})
            <ChevronRight size={14} className={summaryOpen ? 'rotate-90' : ''} />
          </span>
          <strong>{fmt(total)}</strong>
        </button>
        {summaryOpen && (
          <div className="co-mobile-summary">
            <OrderSummary cart={cart} cartSubtotal={cartSubtotal}
              shipping={shipping} total={total}
              couponDiscount={couponDiscount} />
          </div>
        )}

        {/* ── STEP 1: Info & shipping ── */}
        {step === 'info' && (
          <form onSubmit={handleContinueToPay} className="co-form">

            <section className="co-section">
              <div className="co-section-head">
                <h2 className="co-section-title">Contacto</h2>
                <Link to="/login" className="co-link">Iniciar sesión</Link>
              </div>
              <div className="co-field">
                <input name="email" type="email" required placeholder="Correo electrónico"
                  value={form.email} onChange={handleChange} className="co-input" />
              </div>
              <label className="co-check-row">
                <input type="checkbox" name="newsletter" checked={form.newsletter} onChange={handleChange} />
                <span>Enviarme novedades y ofertas por correo</span>
              </label>
            </section>

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
                  <input name="nombre" type="text" required placeholder="Nombre"
                    value={form.nombre} onChange={handleChange} className="co-input" />
                </div>
                <div className="co-field">
                  <input name="apellidos" type="text" placeholder="Apellidos"
                    value={form.apellidos} onChange={handleChange} className="co-input" />
                </div>
              </div>
              <div className="co-field">
                <input name="direccion" type="text" required placeholder="Dirección"
                  value={form.direccion} onChange={handleChange} className="co-input" />
              </div>
              <div className="co-field">
                <input name="apartamento" type="text" placeholder="Casa, apartamento, etc. (opcional)"
                  value={form.apartamento} onChange={handleChange} className="co-input" />
              </div>
              <div className="co-field-row co-row-3">
                <div className="co-field">
                  <input name="cp" type="text" required placeholder="Código postal"
                    value={form.cp} onChange={handleChange} className="co-input" />
                </div>
                <div className="co-field">
                  <input name="ciudad" type="text" required placeholder="Ciudad"
                    value={form.ciudad} onChange={handleChange} className="co-input" />
                </div>
                <div className="co-field co-field-labeled">
                  <label>Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange} className="co-input co-select">
                    {ESTADOS_MX.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div className="co-field">
                <input name="telefono" type="tel" placeholder="Teléfono"
                  value={form.telefono} onChange={handleChange} className="co-input" />
              </div>
            </section>

            <section className="co-section">
              <h2 className="co-section-title">Envío</h2>
              {!form.direccion.trim() ? (
                <div className="co-shipping-placeholder">
                  <p>Ingresa tu dirección para ver los métodos disponibles.</p>
                </div>
              ) : (
                <div className="co-options-list">
                  <label className="co-option-row selected">
                    <div className="co-option-left">
                      <input type="radio" name="envio" defaultChecked readOnly />
                      <span>Envío estándar (3–5 días hábiles)</span>
                    </div>
                    <strong className={shipping === 0 ? 'co-free-shipping' : ''}>{shipping === 0 ? '🚚 Gratis' : '$99.00 MXN'}</strong>
                  </label>
                </div>
              )}
            </section>

            <section className="co-section">
              <h2 className="co-section-title">Cupón de descuento</h2>
              <div className="co-discount-row" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                <input type="text" placeholder="Código de descuento" value={descuento}
                  onChange={e => setDescuento(e.target.value)} className="co-discount-input" />
                <button type="button" className="co-apply-btn" onClick={onApplyCoupon}>Aplicar</button>
              </div>
              {couponMsg && (
                <p style={{ fontSize: 12, margin: '8px 0 0', color: couponDiscount > 0 ? '#2e7d32' : '#c0392b', fontWeight: 600 }}>
                  {couponMsg}
                </p>
              )}
            </section>

            {piError && <p className="co-stripe-error">{piError}</p>}

            <button type="submit" className="co-submit-btn" disabled={loadingPI}>
              {loadingPI ? 'Cargando…' : 'Continuar al pago'}
            </button>
          </form>
        )}

        {/* ── STEP 2: Stripe payment ── */}
        {step === 'pay' && clientSecret && (
          <div className="co-form">
            <section className="co-section">
              <div className="co-section-head">
                <h2 className="co-section-title">Pago</h2>
                <button type="button" className="co-link" onClick={() => setStep('info')}>
                  ← Editar información
                </button>
              </div>
              <p className="co-secure-note"><Lock size={12} /> Transacción segura y encriptada por Stripe.</p>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#B08968',
                      fontFamily: 'Poppins, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <StripePayForm form={form} total={total} onSuccess={handleSuccess} />
              </Elements>
            </section>
          </div>
        )}
      </div>

      {/* ── Right column: summary ── */}
      <aside className="co-summary">
        <OrderSummary cart={cart} cartSubtotal={cartSubtotal}
          shipping={shipping} total={total}
          couponDiscount={couponDiscount} />
      </aside>
    </div>
  );
}
