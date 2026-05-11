import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useElementos } from '../../../shared/context/ElementosContext';

function ProUpsell({ onDecline }) {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', background: '#F3EFE8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Confirmación mini */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 28, color: '#4A3F35',
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: '50%', background: '#43A047',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 800, flexShrink: 0,
          }}>✓</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#43A047' }}>
            ¡Pago completado! Te enviamos la confirmación por correo.
          </span>
        </div>

        {/* Card upsell */}
        <div style={{
          background: 'linear-gradient(145deg, #3D3228 0%, #5C4D42 100%)',
          borderRadius: 20, overflow: 'hidden', boxShadow: '0 12px 40px rgba(74,63,53,0.25)',
        }}>
          {/* Header */}
          <div style={{ padding: '28px 28px 0', position: 'relative' }}>
            <div style={{ position:'absolute', top:0, right:0, fontSize:110, opacity:0.06, lineHeight:1, userSelect:'none' }}>⚗️</div>
            <span style={{
              background: '#B08968', color: '#fff', fontSize: 11, fontWeight: 800,
              letterSpacing: 2, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase',
            }}>Oferta exclusiva</span>
            <h2 style={{ color: '#F5EDE3', fontSize: 24, fontWeight: 900, margin: '12px 0 6px', fontFamily: 'Georgia, serif', lineHeight: 1.2 }}>
              Una última cosa antes de irte 🌿
            </h2>
            <p style={{ color: '#C9B8A8', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
              Como acabas de hacer tu primera compra, tienes acceso especial a <strong style={{ color: '#F5EDE3' }}>Alquimista PRO</strong> — el plan que multiplica tu experiencia en Be Alquimist.
            </p>
          </div>

          {/* Beneficios */}
          <div style={{ padding: '0 28px 24px' }}>
            {[
              { icon: '⚗️', title: 'Recetas ilimitadas con IA', desc: 'Formula sin límites. Sin esperar 24 horas ni comprar paquetes extra.' },
              { icon: '📚', title: 'Acceso a todos los cursos', desc: 'Velas de soya, cosmética avanzada, conservantes naturales y los que vienen.' },
              { icon: '🚚', title: 'Envíos gratis todo el mes', desc: 'En cada pedido de insumos, sin importar el monto.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: 'rgba(176,137,104,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>{icon}</div>
                <div>
                  <div style={{ color: '#F5EDE3', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{title}</div>
                  <div style={{ color: '#A89080', fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Precio + CTA */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px 28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
              <span style={{ color: '#F5EDE3', fontSize: 32, fontWeight: 900 }}>$149</span>
              <span style={{ color: '#A89080', fontSize: 14 }}>MXN / mes</span>
              <span style={{ marginLeft: 'auto', background: 'rgba(176,137,104,0.3)', color: '#D4A87A', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                Sin contratos
              </span>
            </div>
            <button
              onClick={() => navigate('/pro')}
              style={{
                width: '100%', background: '#B08968', color: '#fff',
                border: 'none', borderRadius: 12, padding: '15px',
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 0.5, marginBottom: 10,
              }}
            >
              Quiero ser Alquimista PRO →
            </button>
            <button
              onClick={onDecline}
              style={{
                width: '100%', background: 'transparent', color: '#7A6A5A',
                border: 'none', padding: '8px', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              No gracias, ver mi pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutGracias() {
  const { esPro, isInitializing } = useElementos();
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    if (window.fbq) window.fbq('track', 'Purchase', { currency: 'MXN', value: 0 });
  }, []);

  useEffect(() => {
    if (!isInitializing) setShowUpsell(!esPro);
  }, [isInitializing, esPro]);

  if (isInitializing) return null;

  if (showUpsell) return <ProUpsell onDecline={() => setShowUpsell(false)} />;

  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif', padding: '40px 20px', textAlign: 'center',
    }}>
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
