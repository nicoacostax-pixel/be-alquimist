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
    <div style={{ minHeight: '100vh', background: '#F3EFE8', fontFamily: 'Poppins, sans-serif' }}>

      {/* NAV */}
      <nav style={{
        background: '#4A3F35',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ color: '#F3EFE8', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          ← Be Alquimist
        </Link>
        <span style={{ color: '#B08968', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>CURSOS</span>
      </nav>

      <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff' }}>

        {/* HEADER */}
        <div style={{
          background: '#4A3F35',
          padding: '40px 32px 32px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#B08968', fontSize: 12, fontWeight: 700, letterSpacing: 3, margin: '0 0 12px', textTransform: 'uppercase' }}>
            ⚗️ Be Alquimist
          </p>
          <h1 style={{
            color: '#F3EFE8',
            fontSize: 28,
            fontWeight: 900,
            lineHeight: 1.25,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 2,
            fontFamily: 'Georgia, serif',
          }}>
            Curso de Velas<br />de Soya
          </h1>
        </div>

        {/* IMAGEN */}
        <div style={{ padding: '28px 24px 0' }}>
          <img
            src={`${process.env.PUBLIC_URL}/Velas.jpg`}
            alt="Curso de Velas de Soya"
            style={{
              width: '100%',
              borderRadius: 12,
              display: 'block',
              objectFit: 'cover',
              maxHeight: 340,
            }}
          />
        </div>

        {/* INFO */}
        <div style={{ padding: '28px 28px 8px' }}>
          {INFO.map(({ label, value }) => (
            <p key={label} style={{ fontSize: 14, color: '#7A6A5A', marginBottom: 12, lineHeight: 1.7 }}>
              <strong style={{ color: '#4A3F35', fontWeight: 800 }}>{label}:</strong>{' '}
              {value}
            </p>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: '24px 28px 48px', textAlign: 'center' }}>
          <a
            href="#temario"
            style={{
              display: 'inline-block',
              background: '#B08968',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              padding: '14px 44px',
              borderRadius: 30,
              textDecoration: 'none',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Ver Temario
          </a>
        </div>

        {/* SECCIONES ADICIONALES */}
        <div id="temario" />

      </div>
    </div>
  );
}
