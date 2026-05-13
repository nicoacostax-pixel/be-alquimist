import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../../../shared/lib/supabaseClient';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const inputSt = {
  border: '1.5px solid #E0D6CE', borderRadius: 10, padding: '13px 16px',
  fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none',
  color: '#1A1A1A', background: '#FAFAFA', width: '100%', boxSizing: 'border-box',
};

function PagoForm({ nombre, email, onSuccess, onBack }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [ready,  setReady]  = useState(false);
  const [paying, setPaying] = useState(false);
  const [error,  setError]  = useState('');

  const handlePay = async () => {
    if (!stripe || !elements || !ready) return;
    setPaying(true); setError('');
    try {
      const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + '/academia/confirmacion' },
        redirect: 'if_required',
      });
      if (stripeErr) { setError(stripeErr.message); setPaying(false); return; }

      const res = await fetch('/api/academia-post-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, paymentIntentId: paymentIntent.id }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Error al activar tu cuenta'); setPaying(false); return; }

      if (json.email && json.tempPassword) {
        await supabase.auth.signInWithPassword({ email: json.email, password: json.tempPassword });
      }
      if (window.fbq) window.fbq('track', 'Purchase', { currency: 'MXN', value: 149 });
      onSuccess();
    } catch (e) {
      setError(e.message || 'Error inesperado');
      setPaying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9A8A7A', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
        ← Volver
      </button>
      <div>
        <p style={{ fontSize: 13, color: '#7A6A5A', margin: '0 0 2px' }}>Inscripción Academia Be Alquimist</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#2C2318', margin: 0 }}>$149 MXN</p>
      </div>
      {!ready && <p style={{ fontSize: 13, color: '#999', margin: 0 }}>Cargando formulario de pago…</p>}
      <PaymentElement options={{ layout: 'tabs' }} onReady={() => setReady(true)} />
      {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
      <button
        onClick={handlePay}
        disabled={!ready || paying}
        style={{
          background: paying ? '#C4A882' : 'linear-gradient(135deg, #B08968, #8C6A4F)',
          color: '#fff', border: 'none', borderRadius: 10, padding: '14px',
          fontSize: 15, fontWeight: 800, fontFamily: 'Poppins, sans-serif',
          cursor: paying ? 'not-allowed' : 'pointer', width: '100%',
          boxShadow: '0 4px 16px rgba(176,137,104,0.35)',
        }}
      >
        {paying ? 'Procesando…' : 'Pagar $149 y acceder →'}
      </button>
      <p style={{ fontSize: 11, color: '#B0A09A', textAlign: 'center', margin: 0 }}>
        Pago seguro con Stripe · Acceso de por vida
      </p>
    </div>
  );
}

export default function AcademiaCheckoutModal({ onClose, onSuccess }) {
  const [step,         setStep]         = useState('info');
  const [form,         setForm]         = useState({ nombre: '', email: '' });
  const [clientSecret, setClientSecret] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const handleInfo = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) { setError('Completa todos los campos.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/academia-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre.trim(), email: form.email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Error al iniciar el pago'); setLoading(false); return; }
      setClientSecret(json.clientSecret);
      setStep('pago');
    } catch (e) {
      setError('Error de conexión. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9A8A7A' }}>✕</button>

        {step === 'info' && (
          <>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 900, color: '#2C2318', marginBottom: 4 }}>Únete a la Academia</h3>
            <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 20 }}>Acceso completo por $149 MXN</p>
            <form onSubmit={handleInfo} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Nombre completo *"
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                required
                style={inputSt}
              />
              <input
                placeholder="Correo electrónico *"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                style={inputSt}
              />
              {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #B08968, #8C6A4F)', color: '#fff',
                  border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 800,
                  fontFamily: 'Poppins, sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: 4, boxShadow: '0 4px 16px rgba(176,137,104,0.35)', width: '100%',
                }}
              >
                {loading ? 'Preparando pago…' : 'Continuar al pago →'}
              </button>
            </form>
          </>
        )}

        {step === 'pago' && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'stripe', variables: { colorPrimary: '#B08968', fontFamily: 'Poppins, sans-serif' } },
            }}
          >
            <PagoForm
              nombre={form.nombre}
              email={form.email}
              onSuccess={onSuccess}
              onBack={() => setStep('info')}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
