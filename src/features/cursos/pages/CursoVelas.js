import React from 'react';
import { Link } from 'react-router-dom';

const INFO = [
  { label: 'CONTENIDO',       value: '+10 videos y +10 manuales descargables' },
  { label: 'TIEMPO',          value: '1 Mes de aprendizaje' },
  { label: 'DIPLOMA',         value: 'Al aprobar los 9 módulos' },
  { label: 'MÓDULOS',         value: '9 Módulos' },
  { label: 'RITMO DEL CURSO', value: 'Avanza a tu propio ritmo' },
  { label: 'MODALIDAD',       value: 'ONLINE' },
  { label: 'DURACIÓN',        value: 'Tendrás acceso al curso para siempre' },
  { label: 'ASESORÍA',        value: 'Acceso a grupo de ayuda' },
];

export default function CursoVelas() {
  return (
    <div style={{ minHeight: '100vh', background: '#F2EDE8', fontFamily: 'Poppins, sans-serif' }}>

      {/* NAV */}
      <nav style={{ background: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #EDE0D4' }}>
        <Link to="/" style={{ color: '#4A3F35', fontWeight: 700, textDecoration: 'none', fontSize: 16 }}>
          ← Be Alquimist
        </Link>
      </nav>

      <div style={{ maxWidth: 480, margin: '0 auto', background: '#fff', minHeight: '100vh' }}>

        {/* HEADER */}
        <div style={{
          background: '#F2C9BE',
          padding: '36px 32px 28px',
          textAlign: 'center',
        }}>
          <h1 style={{
            color: '#2D4A2D',
            fontSize: 30,
            fontWeight: 900,
            lineHeight: 1.2,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontFamily: 'Georgia, serif',
          }}>
            Curso de Velas de Soya
          </h1>
        </div>

        {/* IMAGEN */}
        <div style={{ padding: '28px 24px 0' }}>
          <img
            src="/Velas.jpg"
            alt="Curso de Velas de Soya"
            style={{ width: '100%', borderRadius: 16, display: 'block', objectFit: 'cover' }}
          />
        </div>

        {/* INFO */}
        <div style={{ padding: '28px 24px 8px' }}>
          {INFO.map(({ label, value }) => (
            <p key={label} style={{ fontSize: 15, color: '#555', marginBottom: 10, lineHeight: 1.6 }}>
              <strong style={{ color: '#2D4A2D', fontWeight: 800 }}>{label}:</strong>{' '}
              {value}
            </p>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '20px 24px 40px', textAlign: 'center' }}>
          <a
            href="#temario"
            style={{
              display: 'inline-block',
              background: '#F2C9BE',
              color: '#2D4A2D',
              fontWeight: 700,
              fontSize: 15,
              padding: '14px 40px',
              borderRadius: 30,
              textDecoration: 'none',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Ver Temario
          </a>
        </div>

        {/* SECCIONES ADICIONALES — se agregan debajo */}
        <div id="temario" />

      </div>
    </div>
  );
}
