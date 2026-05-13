import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useElementos } from '../context/ElementosContext';
import { supabase } from '../lib/supabaseClient';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const PAQUETES = [
  { id: '10',  label: '10 elementos',  precio: '$19 MXN',  monto: 1900, cantidad: 10 },
  { id: '20',  label: '20 elementos',  precio: '$29 MXN',  monto: 2900, cantidad: 20 },
  { id: '50',  label: '50 elementos',  precio: '$59 MXN',  monto: 5900, cantidad: 50 },
  { id: '100', label: '100 elementos', precio: '$99 MXN',  monto: 9900, cantidad: 100 },
];

const PRO_PKG = { id: 'pro', label: 'Alquimista PRO', precio: '$149 MXN/mes', monto: 14900, cantidad: 0 };

function PagoForm({ paquete, onSuccess, onCancel }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying,  setPaying]  = useState(false);
  const [ready,   setReady]   = useState(false);
  const [error,   setError]   = useState('');

  const handlePay = async () => {
    if (!stripe || !elements || !ready) return;
    setPaying(true);
    setError('');
    try {
      const { error: e } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      if (e) { setError(e.message); setPaying(false); }
      else   { onSuccess(); }
    } catch (e) {
      setError(e.message || 'Error al procesar el pago');
      setPaying(false);
    }
  };

  return (
    <div className="el-pago-wrap">
      <button className="el-back" onClick={onCancel}>← Volver</button>
      <h3 className="el-pago-title">{paquete.label}</h3>
      {!ready && <p style={{ fontSize: 13, color: '#999', margin: '12px 0' }}>Cargando formulario de pago…</p>}
      <PaymentElement options={{ layout: 'tabs' }} onReady={() => setReady(true)} />
      {error && <p className="el-pago-error">{error}</p>}
      <button className="el-pago-btn" onClick={handlePay} disabled={!stripe || !ready || paying}>
        {paying ? 'Procesando…' : `Pagar ${paquete.precio}`}
      </button>
    </div>
  );
}

export default function ElementosModal({ onClose, startWithPro = false }) {
  const { elementos, esPro, agregar, activarPro } = useElementos();
  const [pkg,          setPkg]          = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading,      setLoading]      = useState(startWithPro);

  const seleccionar = async (p) => {
    setLoading(true);
    setPkg(p);
    try {
      const body = { paquete: p.id };
      // Para PRO necesitamos el token del usuario para crear la suscripción
      if (p.id === 'pro') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Debes iniciar sesión para activar el plan PRO');
        body.token = session.access_token;
      }
      const res  = await fetch('/api/comprar-elementos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.alreadyActive) {
        await activarPro();
        onClose();
        return;
      }
      setClientSecret(json.clientSecret);
    } catch (e) {
      alert('Error al iniciar el pago: ' + e.message);
      setPkg(null);
    }
    setLoading(false);
  };

  const handleSuccess = async () => {
    if (pkg?.id === 'pro') await activarPro();
    else if (pkg)          await agregar(pkg.cantidad);
    onClose();
  };

  useEffect(() => {
    if (startWithPro) seleccionar(PRO_PKG);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="el-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="el-modal">
        <button className="el-close-btn" onClick={onClose}>✕</button>

        {!clientSecret ? (
          <>
            {/* Balance */}
            <div className="el-header">
              <span className="el-header-icon">⚗️</span>
              <h2 className="el-header-title">Tus elementos</h2>
              <div className={`el-balance ${esPro ? 'pro' : ''}`}>
                {esPro ? '∞' : elementos}
              </div>
              <p className="el-header-sub">
                {esPro
                  ? 'Eres Alquimista PRO — elementos ilimitados'
                  : 'Se recargan 3 elementos cada 24 horas'}
              </p>
            </div>

            {/* Paquetes */}
            <div className="el-section-title">Comprar más elementos</div>
            <div className="el-packages">
              {PAQUETES.map(p => (
                <button key={p.id} className="el-pkg-card" onClick={() => seleccionar(p)} disabled={loading}>
                  <span className="el-pkg-qty">{p.label}</span>
                  <span className="el-pkg-price">{p.precio}</span>
                </button>
              ))}
            </div>

            {/* PRO */}
            {!esPro && (
              <>
                <div className="el-section-title">Membresía</div>
                <button className="el-pro-card" onClick={() => seleccionar(PRO_PKG)} disabled={loading}>
                  <div className="el-pro-left">
                    <span className="el-pro-badge">PRO</span>
                    <div>
                      <strong>Alquimista PRO</strong>
                      <p>Elementos ilimitados + Calculadora de costos</p>
                    </div>
                  </div>
                  <span className="el-pro-price">$149/mes</span>
                </button>
              </>
            )}
          </>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'stripe', variables: { colorPrimary: '#B08968', fontFamily: 'Poppins, sans-serif' } },
            }}
          >
            <PagoForm paquete={pkg} onSuccess={handleSuccess} onCancel={() => { setClientSecret(''); setPkg(null); }} />
          </Elements>
        )}
      </div>
    </div>
  );
}
