import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useElementos } from '../../../shared/context/ElementosContext';
import ElementosModal from '../../../shared/components/ElementosModal';
import '../../../App.css';

const FEATURES = [
  {
    icon: '⚗️',
    title: 'Elementos ilimitados',
    desc: 'Genera todas las recetas que quieras, sin esperar 24 horas ni comprar paquetes.',
  },
  {
    icon: '🚚',
    title: 'Envío gratis en todos tus pedidos',
    desc: 'Recibe tus insumos de Be Alquimist sin costo de envío en cada compra.',
  },
  {
    icon: '📚',
    title: 'Acceso a todos los cursos',
    desc: 'Aprende formulación avanzada, conservantes naturales, emulsiones y más con nuestras instructoras.',
  },
  {
    icon: '🏆',
    title: 'Insignia PRO en tu perfil',
    desc: 'Destaca en la comunidad de alquimistas con tu badge exclusivo de Alquimista PRO.',
  },
];

const FAQ = [
  {
    q: '¿Cuándo se cobra?',
    a: 'El primer cobro es inmediato al suscribirte. Los siguientes son cada 30 días de forma automática.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. Al cancelar conservas el acceso PRO hasta el final del período que ya pagaste.',
  },
  {
    q: '¿En qué moneda se cobra?',
    a: 'En pesos mexicanos (MXN). El cargo aparece como $149 MXN/mes en tu estado de cuenta.',
  },
];

export default function ProLanding() {
  const { isLoggedIn, esPro } = useElementos();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleCTA = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setShowModal(true);
  };

  return (
    <div className="pro-landing">
      {showModal && <ElementosModal onClose={() => setShowModal(false)} />}

      {/* NAV */}
      <nav className="pro-nav">
        <Link to="/" className="pro-nav-logo">Be Alquimist</Link>
        {isLoggedIn && (
          <Link to="/cuenta" className="pro-nav-link">Mi cuenta</Link>
        )}
      </nav>

      {/* HERO */}
      <section className="pro-hero">
        <span className="pro-hero-icon">⚗️</span>
        <h1 className="pro-hero-title">Alquimista PRO</h1>
        <p className="pro-hero-sub">El plan para quienes formulan en serio.</p>
        {esPro && (
          <div className="pro-already-badge">✓ Ya eres Alquimista PRO</div>
        )}
      </section>

      {/* FEATURES */}
      <section className="pro-features">
        {FEATURES.map((f, i) => (
          <div key={i} className="pro-feature-card">
            <span className="pro-feature-icon">{f.icon}</span>
            <div>
              <h3 className="pro-feature-title">{f.title}</h3>
              <p className="pro-feature-desc">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* PRICING */}
      <section className="pro-pricing">
        <div className="pro-pricing-card">
          <p className="pro-pricing-label">Suscripción mensual</p>
          <div className="pro-pricing-amount">
            <span className="pro-pricing-currency">$</span>
            <span className="pro-pricing-number">149</span>
            <span className="pro-pricing-period">MXN/mes</span>
          </div>
          <ul className="pro-pricing-list">
            {FEATURES.map((f, i) => (
              <li key={i}><span className="pro-check">✓</span>{f.title}</li>
            ))}
          </ul>
          {!esPro ? (
            <button className="pro-cta-btn" onClick={handleCTA}>
              {isLoggedIn ? 'Obtener Alquimista PRO' : 'Iniciar sesión para suscribirse'}
            </button>
          ) : (
            <Link to="/cuenta" className="pro-cta-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Administrar mi plan
            </Link>
          )}
          <p className="pro-pricing-fine">Sin contratos. Cancela cuando quieras.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="pro-faq">
        <h2 className="pro-faq-title">Preguntas frecuentes</h2>
        {FAQ.map((item, i) => (
          <div key={i} className="pro-faq-item">
            <button className="pro-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              {item.q}
              <span className="pro-faq-arrow">{openFaq === i ? '▲' : '▼'}</span>
            </button>
            {openFaq === i && <p className="pro-faq-a">{item.a}</p>}
          </div>
        ))}
      </section>

      <footer className="pro-footer">
        <Link to="/">← Volver al inicio</Link>
      </footer>
    </div>
  );
}
