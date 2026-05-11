import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock } from 'lucide-react';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const PRECIO = 200;

function fmt(v) { return `$${Number(v || 0).toFixed(2)}`; }

function StripeForm({ form, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying]   = useState(false);
  const [error,  setError]    = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');
    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout/gracias',
        payment_method_data: {
          billing_details: {
            name:  form.nombre,
            email: form.email,
            phone: form.telefono,
          },
        },
      },
    });
    if (stripeErr) { setError(stripeErr.message); setPaying(false); }
    else onSuccess();
  };

  return (
    <div>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p style={{ color: '#c0392b', fontSize: 13, marginTop: 10 }}>{error}</p>}
      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || paying}
        style={{
          marginTop: 20, width: '100%', background: '#B08968', color: '#fff',
          border: 'none', borderRadius: 10, padding: '16px', fontSize: 16,
          fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {paying ? 'Procesando…' : `Pagar ${fmt(PRECIO)} MXN`}
      </button>
    </div>
  );
}

export default function CursoVelasCheckout() {
  const navigate = useNavigate();
  const [form,         setForm]         = useState({ nombre: '', email: '', telefono: '' });
  const [clientSecret, setClientSecret] = useState('');
  const [loadingPI,    setLoadingPI]    = useState(false);
  const [piError,      setPiError]      = useState('');
  const [step,         setStep]         = useState('info');

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email) { alert('Completa nombre y correo.'); return; }
    // Guardar carrito abandonado
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, telefono: form.telefono, tipo: 'carrito_abandonado' }),
    }).catch(() => {});
    setLoadingPI(true); setPiError('');
    try {
      const res  = await fetch('/api/create-payment-intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: PRECIO * 100, currency: 'mxn', metadata: { email: form.email, nombre: form.nombre } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error del servidor');
      setClientSecret(json.clientSecret);
      setStep('pay');
    } catch (err) { setPiError(err.message); }
    finally { setLoadingPI(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F3EFE8', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px 80px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/cursos/velas-de-soya" style={{ color: '#B08968', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            ← Volver al curso
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#4A3F35', margin: '16px 0 4px', fontFamily: 'Georgia, serif' }}>
            Curso de Velas de Soya
          </h1>
          <p style={{ color: '#7A6A5A', fontSize: 14, margin: 0 }}>Pago único · Acceso de por vida</p>
        </div>

        {/* Resumen del producto */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 20, border: '1px solid #EDE0D4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 700, color: '#4A3F35', margin: '0 0 4px', fontSize: 15 }}>Curso de Velas de Soya</p>
            <p style={{ color: '#9E8E80', fontSize: 13, margin: 0, textDecoration: 'line-through' }}>$599</p>
          </div>
          <p style={{ fontWeight: 900, fontSize: 22, color: '#B08968', margin: 0 }}>$200 MXN</p>
        </div>

        {/* Card formulario */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', border: '1px solid #EDE0D4' }}>

          {step === 'info' && (
            <form onSubmit={handleContinue}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#4A3F35', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: 1 }}>
                Tus datos
              </h2>
              {[
                { name: 'nombre',    placeholder: 'Nombre completo',     type: 'text',  required: true },
                { name: 'email',     placeholder: 'Correo electrónico',  type: 'email', required: true },
                { name: 'telefono',  placeholder: 'Teléfono (opcional)', type: 'tel',   required: false },
              ].map(f => (
                <input
                  key={f.name}
                  name={f.name}
                  type={f.type}
                  placeholder={f.placeholder}
                  required={f.required}
                  value={form[f.name]}
                  onChange={handleChange}
                  style={{
                    display: 'block', width: '100%', marginBottom: 12, padding: '13px 14px',
                    border: '1.5px solid #D0C8BF', borderRadius: 8, fontSize: 14,
                    color: '#1A1A1A', background: '#FAFAFA', boxSizing: 'border-box',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
              ))}
              {piError && <p style={{ color: '#c0392b', fontSize: 13, margin: '0 0 12px' }}>{piError}</p>}
              <button type="submit" disabled={loadingPI} style={{
                width: '100%', marginTop: 8, background: '#B08968', color: '#fff',
                border: 'none', borderRadius: 10, padding: '16px', fontSize: 16,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {loadingPI ? 'Cargando…' : 'Continuar al pago'}
              </button>
            </form>
          )}

          {step === 'pay' && clientSecret && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#4A3F35', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Pago</h2>
                <button type="button" onClick={() => setStep('info')} style={{ background: 'none', border: 'none', color: '#B08968', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  ← Editar datos
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#7A6A5A', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                <Lock size={11} /> Transacción segura y encriptada por Stripe.
              </p>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: { colorPrimary: '#B08968', fontFamily: 'Poppins, sans-serif', borderRadius: '8px' },
                  },
                }}
              >
                <StripeForm form={form} onSuccess={() => navigate('/checkout/gracias')} />
              </Elements>
            </div>
          )}

          <p style={{ fontSize: 11, color: '#9E8E80', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
            7 días de garantía. Si no es lo que buscas, te reembolsamos el 100%.
          </p>
        </div>
      </div>
    </div>
  );
}
