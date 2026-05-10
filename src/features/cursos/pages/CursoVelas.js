import React, { useState, useEffect } from 'react';
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

const DEADLINE = new Date('2026-05-25T23:59:59');

function useCountdown(target) {
  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function pad(n) { return String(n).padStart(2, '0'); }

const NOTA = (
  <p style={{ fontSize: 13, color: '#7A6A5A', textAlign: 'center', lineHeight: 1.7, margin: '16px 0 0' }}>
    Inscripción inmediata, no tendrás que esperar ni 5 minutos para completar tu inscripción.{' '}
    <strong style={{ color: '#4A3F35' }}>NOTA:</strong> Tenemos{' '}
    <strong style={{ color: '#4A3F35' }}>7 días de garantía</strong>, si el curso no es lo que
    estás buscando para ti, no te preocupes,{' '}
    <strong style={{ color: '#4A3F35' }}>te rembolsaremos el 100% de tu inscripción</strong> sin ningún problema.
  </p>
);

export default function CursoVelas() {
  const { d, h, m, s } = useCountdown(DEADLINE);

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
        <div style={{ background: '#4A3F35', padding: '40px 32px 32px', textAlign: 'center' }}>
          <p style={{ color: '#B08968', fontSize: 12, fontWeight: 700, letterSpacing: 3, margin: '0 0 12px', textTransform: 'uppercase' }}>
            ⚗️ Be Alquimist
          </p>
          <h1 style={{
            color: '#F3EFE8', fontSize: 28, fontWeight: 900, lineHeight: 1.25,
            margin: 0, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Georgia, serif',
          }}>
            Curso de Velas<br />de Soya
          </h1>
        </div>

        {/* IMAGEN */}
        <div style={{ padding: '28px 24px 0' }}>
          <img
            src={`${process.env.PUBLIC_URL}/Velas.jpg`}
            alt="Curso de Velas de Soya"
            style={{ width: '100%', borderRadius: 12, display: 'block', objectFit: 'cover', maxHeight: 340 }}
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

        {/* CTA VER TEMARIO */}
        <div style={{ padding: '24px 28px 48px', textAlign: 'center' }}>
          <a href="#precio" style={{
            display: 'inline-block', background: '#B08968', color: '#fff',
            fontWeight: 700, fontSize: 14, padding: '14px 44px', borderRadius: 30,
            textDecoration: 'none', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Ver Temario
          </a>
        </div>

        {/* SECCIÓN PRECIO */}
        <div id="precio">

          {/* Encabezado PRECIO */}
          <div style={{ background: '#4A3F35', padding: '22px 32px', textAlign: 'center' }}>
            <h2 style={{
              color: '#F3EFE8', fontSize: 24, fontWeight: 900, margin: 0,
              textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'Georgia, serif',
            }}>
              Precio
            </h2>
          </div>

          <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* CARD POPULAR — Kit Velas de Soya */}
            <div style={{ border: '2px solid #4A3F35', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: '#4A3F35', padding: '12px 20px', textAlign: 'center' }}>
                <span style={{ color: '#F3EFE8', fontWeight: 800, fontSize: 14, letterSpacing: 3, textTransform: 'uppercase' }}>
                  Popular
                </span>
              </div>
              <div style={{ padding: '24px 24px 20px', textAlign: 'center' }}>
                <h3 style={{ color: '#4A3F35', fontWeight: 800, fontSize: 20, margin: '0 0 10px' }}>
                  Kit Velas de Soya
                </h3>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ color: '#9E9188', fontSize: 16, textDecoration: 'line-through', marginRight: 10 }}>$2300</span>
                  <span style={{ color: '#B08968', fontSize: 32, fontWeight: 900 }}>$1499 MXN</span>
                </div>
                {['Todo el material incluído', '(Lista de materiales)', 'Pago único', 'Acceso de por vida', 'Actualizaciones incluidas', 'Envío incluido'].map(item => (
                  <p key={item} style={{
                    fontSize: 14, color: item === '(Lista de materiales)' ? '#B08968' : '#4A3F35',
                    fontWeight: 600, margin: '0 0 8px', textDecoration: 'underline',
                  }}>{item}</p>
                ))}
                <a href="https://wa.me/524921291547?text=Quiero%20inscribirme%20al%20Kit%20Velas%20de%20Soya" target="_blank" rel="noreferrer"
                  style={{
                    display: 'inline-block', marginTop: 16, background: '#4A3F35', color: '#fff',
                    fontWeight: 700, fontSize: 15, padding: '14px 36px', borderRadius: 30, textDecoration: 'none',
                  }}>
                  Inscríbete Aquí
                </a>
                {NOTA}
              </div>
            </div>

            {/* CARD — Curso Velas de Soya */}
            <div style={{ border: '1.5px solid #E0D5CC', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '24px 24px 20px', textAlign: 'center' }}>
                <h3 style={{ color: '#4A3F35', fontWeight: 800, fontSize: 20, margin: '0 0 10px' }}>
                  Curso Velas de Soya
                </h3>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ color: '#9E9188', fontSize: 16, textDecoration: 'line-through', marginRight: 10 }}>$599</span>
                  <span style={{ color: '#B08968', fontSize: 32, fontWeight: 900 }}>$200</span>
                </div>
                {['Pago único', 'Acceso de por vida', 'Actualizaciones incluidas'].map(item => (
                  <p key={item} style={{ fontSize: 14, color: '#4A3F35', fontWeight: 600, margin: '0 0 8px', textDecoration: 'underline' }}>
                    {item}
                  </p>
                ))}
                <a href="https://wa.me/524921291547?text=Quiero%20inscribirme%20al%20Curso%20Velas%20de%20Soya" target="_blank" rel="noreferrer"
                  style={{
                    display: 'inline-block', marginTop: 16, background: '#4A3F35', color: '#fff',
                    fontWeight: 700, fontSize: 15, padding: '14px 36px', borderRadius: 30, textDecoration: 'none',
                  }}>
                  Inscríbete Aquí
                </a>
                {NOTA}
              </div>
            </div>

          </div>
        </div>

        {/* COUNTDOWN */}
        <div style={{ background: '#4A3F35', padding: '32px 24px 40px', textAlign: 'center' }}>
          <h2 style={{
            color: '#F3EFE8', fontSize: 22, fontWeight: 800, margin: '0 0 24px', lineHeight: 1.3,
          }}>
            Tiempo para que<br />termine la promoción
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[
              { val: pad(d), label: 'días' },
              { val: pad(h), label: 'horas' },
              { val: pad(m), label: 'min' },
              { val: pad(s), label: 'seg' },
            ].map(({ val, label }, i, arr) => (
              <React.Fragment key={label}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    background: '#F3EFE8', color: '#4A3F35', fontWeight: 900,
                    fontSize: 32, borderRadius: 10, padding: '10px 14px', minWidth: 56, lineHeight: 1,
                  }}>
                    {val}
                  </div>
                  <div style={{ color: '#B08968', fontSize: 11, fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <span style={{ color: '#F3EFE8', fontSize: 28, fontWeight: 900, alignSelf: 'flex-start', paddingTop: 10 }}>:</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
