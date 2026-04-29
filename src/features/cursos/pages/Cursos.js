import React from 'react';
import { Link } from 'react-router-dom';
import { useElementos } from '../../../shared/context/ElementosContext';
import '../../../App.css';

const CURSOS = [
  {
    icon: '🧴',
    titulo: 'Emulsiones perfectas',
    desc: 'Aprende a formular cremas y lociones estables con emulsionantes naturales.',
    nivel: 'Intermedio',
    duracion: '4 módulos',
  },
  {
    icon: '💆',
    titulo: 'Activos botánicos en skincare',
    desc: 'Hidrolatos, extractos y aceites vegetales: cómo incorporarlos correctamente.',
    nivel: 'Básico',
    duracion: '3 módulos',
  },
  {
    icon: '🌿',
    titulo: 'Conservantes naturales',
    desc: 'Sistemas conservadores sin parabenos ni fenoxietanol para tus fórmulas.',
    nivel: 'Avanzado',
    duracion: '5 módulos',
  },
  {
    icon: '🫧',
    titulo: 'Champús y acondicionadores sólidos',
    desc: 'Formula productos sólidos con alta concentración de activos y bajo impacto ambiental.',
    nivel: 'Intermedio',
    duracion: '4 módulos',
  },
];

export default function Cursos() {
  const { esPro, isLoggedIn } = useElementos();

  return (
    <div className="cursos-page">
      {/* NAV */}
      <nav className="pro-nav">
        <Link to="/" className="pro-nav-logo">Be Alquimist</Link>
        {isLoggedIn && <Link to="/cuenta" className="pro-nav-link">Mi cuenta</Link>}
      </nav>

      {/* HEADER */}
      <section className="cursos-header">
        <span className="cursos-header-icon">📚</span>
        <h1 className="cursos-header-title">Cursos de formulación</h1>
        <p className="cursos-header-sub">
          {esPro
            ? 'Tienes acceso completo a todos los cursos como Alquimista PRO.'
            : 'Accede a todos los cursos con el plan Alquimista PRO.'}
        </p>
        {!esPro && (
          <Link to="/pro" className="pro-cta-btn" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '16px' }}>
            Ver plan PRO
          </Link>
        )}
      </section>

      {/* GRID DE CURSOS */}
      <section className="cursos-grid">
        {CURSOS.map((c, i) => (
          <div key={i} className={`curso-card ${!esPro ? 'locked' : ''}`}>
            {!esPro && <div className="curso-lock-overlay"><span>🔒</span><p>Plan PRO</p></div>}
            <span className="curso-icon">{c.icon}</span>
            <div className="curso-info">
              <h3 className="curso-titulo">{c.titulo}</h3>
              <p className="curso-desc">{c.desc}</p>
              <div className="curso-meta">
                <span className="curso-nivel">{c.nivel}</span>
                <span className="curso-duracion">{c.duracion}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <footer className="pro-footer">
        <Link to="/">← Volver al inicio</Link>
      </footer>
    </div>
  );
}
