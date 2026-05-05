import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CheckoutGracias() {
  useEffect(() => {
    if (window.fbq) window.fbq('track', 'Purchase', { currency: 'MXN', value: 0 });
  }, []);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
      <h1 style={{ color: '#4A3F35', fontSize: 28, marginBottom: 8 }}>¡Gracias por tu compra!</h1>
      <p style={{ color: '#7A6A5A', fontSize: 15, marginBottom: 32, maxWidth: 400 }}>
        Tu pago fue procesado exitosamente. Te enviaremos la confirmación y los detalles de envío por correo electrónico.
      </p>
      <Link to="/insumos" style={{ background: '#B08968', color: '#fff', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
        Seguir comprando
      </Link>
    </div>
  );
}
