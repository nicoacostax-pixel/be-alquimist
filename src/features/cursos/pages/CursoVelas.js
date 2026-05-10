import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CursoVelas.css';

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
    <div className="cv-page">

      {/* NAV */}
      <nav className="cv-nav">
        <Link to="/" style={{ color: '#F3EFE8', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          ← Be Alquimist
        </Link>
        <span style={{ color: '#F3EFE8', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>CURSOS</span>
      </nav>

      <div className="cv-wrapper">

        {/* HEADER */}
        <div className="cv-header">
          <p style={{ color: '#F3EFE8', fontSize: 12, fontWeight: 700, letterSpacing: 3, margin: '0 0 12px', textTransform: 'uppercase' }}>
            ⚗️ Be Alquimist
          </p>
          <h1 style={{
            color: '#F3EFE8', fontSize: 28, fontWeight: 900, lineHeight: 1.25,
            margin: 0, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Georgia, serif',
          }}>
            Curso de Velas<br />de Soya
          </h1>
        </div>

        {/* IMAGEN + INFO */}
        <div className="cv-intro">
          <div className="cv-img-wrap">
            <img
              src={`${process.env.PUBLIC_URL}/Velas.jpg`}
              alt="Curso de Velas de Soya"
            />
          </div>
          <div className="cv-info">
            {INFO.map(({ label, value }) => (
              <p key={label} style={{ fontSize: 14, color: '#7A6A5A', marginBottom: 12, lineHeight: 1.7 }}>
                <strong style={{ color: '#4A3F35', fontWeight: 800 }}>{label}:</strong>{' '}
                {value}
              </p>
            ))}
            <div className="cv-cta-wrap" style={{ padding: 0, marginTop: 8 }}>
              <a href="#precio" style={{
                display: 'inline-block', background: '#B08968', color: '#fff',
                fontWeight: 700, fontSize: 14, padding: '14px 44px', borderRadius: 30,
                textDecoration: 'none', letterSpacing: 2, textTransform: 'uppercase',
              }}>
                Ver Temario
              </a>
            </div>
          </div>
        </div>

        {/* CTA móvil (oculto en desktop via CSS) */}
        <div className="cv-cta-wrap">
          <a href="#precio" style={{
            display: 'inline-block', background: '#B08968', color: '#fff',
            fontWeight: 700, fontSize: 14, padding: '14px 44px', borderRadius: 30,
            textDecoration: 'none', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Ver Temario
          </a>
        </div>

        {/* SOCIAL PROOF */}
        <div className="cv-social">

          {/* Encabezado */}
          <div style={{ background: '#B08968', padding: '22px 32px', textAlign: 'center' }}>
            <h2 style={{ color: '#F3EFE8', fontSize: 22, fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'Georgia, serif' }}>
              Lo que dicen nuestras alumnas
            </h2>
          </div>

          {/* Stats */}
          <div className="cv-stats">
            {[
              { n: '+340', label: 'Alumnas activas' },
              { n: '4.9★', label: 'Calificación' },
              { n: '98%', label: 'Lo recomiendan' },
            ].map(({ n, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#B08968' }}>{n}</div>
                <div style={{ fontSize: 12, color: '#7A6A5A', fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonios tipo tarjeta */}
          <div className="cv-reviews">
            {[
              { nombre: 'Valeria M.', ciudad: 'Guadalajara', stars: 5, texto: 'Nunca había hecho velas y con este curso en dos semanas ya estaba vendiendo. Los manuales son clarísimos y la instructora explica todo paso a paso. ¡100% recomendado!' },
              { nombre: 'Daniela R.', ciudad: 'CDMX', stars: 5, texto: 'Lo que más me gustó fue que el acceso es de por vida. Puedo regresar a ver los videos cuando quiero. Las velas me quedaron increíbles desde el módulo 3.' },
              { nombre: 'Sofía L.', ciudad: 'Monterrey', stars: 5, texto: 'Compré el kit completo y fue la mejor decisión. Llegaron todos los materiales y ya tenía todo listo para empezar. Ahora hago velas para regalar y vender.' },
              { nombre: 'Mariana T.', ciudad: 'Puebla', stars: 5, texto: 'El grupo de asesoría es un plus enorme. Subí mis dudas y me contestaron en menos de una hora. Me sentí muy acompañada durante todo el proceso.' },
            ].map(({ nombre, ciudad, stars, texto }) => (
              <div key={nombre} className="cv-review-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', background: '#B08968',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0,
                  }}>
                    {nombre[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#4A3F35', fontSize: 14 }}>{nombre}</div>
                    <div style={{ fontSize: 12, color: '#9E9188' }}>{ciudad}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#B08968', fontSize: 15 }}>{'★'.repeat(stars)}</div>
                </div>
                <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.7, margin: 0 }}>{texto}</p>
              </div>
            ))}
          </div>

          {/* Mensajes estilo WhatsApp */}
          <div style={{ padding: '8px 20px 32px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#9E9188', textAlign: 'center', letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>
              Mensajes reales de alumnas 💬
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { nombre: 'Karen G.', msg: 'Acabo de terminar mi primera vela de flores y me quedó HERMOSA 😭🌸 Gracias por el curso, es lo mejor que he comprado este año', hora: '10:42 a.m.' },
                { nombre: 'Lucía P.', msg: 'Ya vendí 12 velas esta semana!! Con el kit tuve todo lo necesario y mis clientas están encantadas 🕯️✨', hora: '3:15 p.m.' },
                { nombre: 'Andrea F.', msg: 'Los videos son súper claros, incluso yo que soy primeriza entendí todo perfectamente. El módulo de aromas fue mi favorito 🥰', hora: 'ayer' },
              ].map(({ nombre, msg, hora }) => (
                <div key={nombre} style={{ background: '#E8F5E9', borderRadius: '0 12px 12px 12px', padding: '12px 14px', maxWidth: '90%', position: 'relative' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#B08968', marginBottom: 4 }}>{nombre}</div>
                  <p style={{ fontSize: 13, color: '#3A3A3A', margin: 0, lineHeight: 1.6 }}>{msg}</p>
                  <div style={{ fontSize: 11, color: '#9E9188', textAlign: 'right', marginTop: 4 }}>{hora} ✓✓</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SECCIÓN PRECIO */}
        <div id="precio">
          <div style={{ background: '#B08968', padding: '22px 32px', textAlign: 'center' }}>
            <h2 style={{
              color: '#F3EFE8', fontSize: 24, fontWeight: 900, margin: 0,
              textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'Georgia, serif',
            }}>
              Precio
            </h2>
          </div>

          <div className="cv-cards">

            {/* CARD POPULAR */}
            <div style={{ border: '2px solid #B08968', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: '#B08968', padding: '12px 20px', textAlign: 'center' }}>
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
                  <p key={item} style={{ fontSize: 14, color: '#4A3F35', fontWeight: 600, margin: '0 0 8px', textDecoration: 'underline' }}>
                    {item}
                  </p>
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

            {/* CARD ESTÁNDAR */}
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
        <div className="cv-countdown">
          <h2 style={{ color: '#F3EFE8', fontSize: 22, fontWeight: 800, margin: '0 0 24px', lineHeight: 1.3 }}>
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
                  <div style={{ color: '#F3EFE8', fontSize: 11, fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
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
