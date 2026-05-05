import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function DistribuidorasGracias() {
  useEffect(() => {
    if (window.fbq) window.fbq('track', 'Lead', { content_name: 'distribuidora' });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif',
      padding: '40px 20px',
      textAlign: 'center',
      background: 'linear-gradient(160deg, #FAF7F2 0%, #F0E8DE 100%)',
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🌿</div>
      <h1 style={{ color: '#4A3F35', fontSize: 30, fontWeight: 800, marginBottom: 12 }}>
        ¡Bienvenida a la familia Be Alquimist!
      </h1>
      <p style={{ color: '#7A6A5A', fontSize: 16, marginBottom: 8, maxWidth: 440, lineHeight: 1.6 }}>
        Recibimos tu registro. Una de nuestras asesoras te contactará en menos de <strong>24 horas</strong> para darte los detalles de tu primer paquete.
      </p>
      <p style={{ color: '#B08968', fontSize: 14, marginBottom: 36, maxWidth: 380 }}>
        Mientras tanto, explora nuestro catálogo de más de 200 insumos naturales.
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/insumos"
          style={{ background: '#B08968', color: '#fff', padding: '13px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}
        >
          Ver catálogo
        </Link>
        <Link
          to="/"
          style={{ background: 'transparent', color: '#B08968', padding: '13px 28px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15, border: '2px solid #B08968' }}
        >
          Ir al chat IA →
        </Link>
      </div>
    </div>
  );
}
