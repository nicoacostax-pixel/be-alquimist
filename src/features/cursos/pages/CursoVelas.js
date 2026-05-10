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

const MODULOS = [
  {
    titulo: 'Módulo 1: La Vela',
    desc: 'En este módulo aprenderemos cosas súper interesantes que probablemente no aprenderás en ningún otro curso sobre Vela de Soya:',
    lecciones: ['Lección 1: Historia de la Vela', 'Lección 2: Química básica de la Vela', 'Lección 3: ¿Por qué iniciar un negocio de velas?'],
  },
  {
    titulo: 'Módulo 2: Composición de las Velas',
    desc: 'En este módulo veremos a profundidad sobre la composición de las velas:',
    lecciones: ['Lección 4: Tipos de Ceras', 'Lección 5: La Cera de Soya vs Parafina'],
  },
  {
    titulo: 'Módulo 3: Mechas y Pabilos',
    desc: 'En este módulo tocaremos a profundidad todo lo relacionado a los tipos de pabilos y mechas:',
    lecciones: ['Lección 6: Tipos de velas y mechas', 'Lección 7: Cómo elegir nuestro pabilo ideal'],
  },
  {
    titulo: 'Módulo 4: Moldes',
    desc: '¡Moldes! En este módulo veremos los tipos de moldes más usados en la actualidad.',
    lecciones: ['Lección 8: Tipos de Moldes'],
  },
  {
    titulo: 'Módulo 5: Colorantes',
    desc: 'Las velas de soya pueden ser de múltiples colores y tonalidades. En este módulo veremos los tipos de colorantes:',
    lecciones: ['Lección 9: Teoría del color', 'Lección 10: Tipos de colorantes'],
  },
  {
    titulo: 'Módulo 6: Aromas',
    desc: 'En Velas de Soya puedes utilizar aceites esenciales o esencias. En este módulo abordaremos sus diferencias:',
    lecciones: ['Lección 11: Aceites esenciales vs Esencias aromáticas', 'Lección 12: Familias olfativas'],
  },
  {
    titulo: 'Módulo 7: Primeros Pasos',
    desc: 'En este módulo aprenderemos los pasos iniciales antes de comenzar a elaborar tus primeras velas de soya.',
    lecciones: ['Lección 13: Primeros pasos'],
  },
  {
    titulo: 'Módulo 8: Recetas Básicas',
    desc: 'En este módulo comenzaremos a elaborar nuestras primeras recetas de Velas de Soya:',
    lecciones: ['Lección 15: Vela Natural', 'Lección 16: Vela Aromática', 'Lección 17: Vela para masajes', 'Lección 18: Vela del Bosque'],
  },
  {
    titulo: 'Módulo 9: Recetas Avanzadas',
    desc: 'Ya que hayas elaborado tus primeras velas, estarás lista para recetas más avanzadas:',
    lecciones: ['Lección 18: Vela para masaje enriquecida', 'Lección 19: Vela de Cactus', 'Lección 20: Vela Glitter', 'Lección 21: Vela Pastel Feliz Cumpleaños', 'Lección 22: Vela de Unicornio', 'Lección 24: Vela Latte'],
  },
  {
    titulo: 'Examen Final',
    desc: 'Tu último paso será presentar el examen final del curso. Al aprobarlo recibirás tu diploma como formuladora de Velas de Soya.',
    lecciones: [],
  },
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
  const [openModulo, setOpenModulo] = useState(null);

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
              src="/Velas.jpg"
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

        {/* INFORMACIÓN DEL CURSO */}
        <div>
          {/* Encabezado */}
          <div style={{ background: '#B08968', padding: '28px 32px 20px', textAlign: 'center' }}>
            <h2 style={{ color: '#F3EFE8', fontSize: 22, fontWeight: 900, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Georgia, serif' }}>
              Información del Curso
            </h2>
            <p style={{ color: '#F3EFE8', fontSize: 12, fontWeight: 600, margin: 0, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 }}>
              Curso de Velas de Soya
            </p>
          </div>

          {/* Dos columnas */}
          <div className="cv-info-cols">

            <div className="cv-info-col">
              <h3 className="cv-info-col-title">
                Conviértete en un formulador<br />
                <span style={{ fontSize: 13 }}>(no un seguidor de recetas)</span>
              </h3>
              <p className="cv-info-col-text">
                Te enseñamos la manera correcta de crear tus propias fórmulas de Velas de Soya partiendo desde cero, permitiéndote diferenciarte de cientos de formuladores que solo siguen recetas. Te enseñaremos a crear e innovar tus propias Velas de Soya únicas y maravillosas que reflejen toda tu personalidad y contengan tus ingredientes favoritos.
              </p>
              <img src="/Velas1.jpg" alt="Velas artesanales" className="cv-info-col-img" />
            </div>

            <div className="cv-info-col">
              <h3 className="cv-info-col-title">
                Estudia la ciencia<br />de la cosmética natural
              </h3>
              <p className="cv-info-col-text">
                Aprende y domina el lenguaje correcto de la ciencia detrás de los productos de la Cosmética Artesanal. Estudia cómo formular — verás que es súper sencillo y divertido. Comprenderás todo lo necesario sobre la formulación para convertir tu negocio de Velas de Soya en el negocio de tus sueños, con toda una gama de productos que se adapten a ti.
              </p>
              <img src="/Velas2.jpg" alt="Velas de flores" className="cv-info-col-img" />
            </div>

          </div>
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
          <div style={{ padding: '8px 28px 36px' }}>
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

        {/* TEMARIO ACORDEÓN */}
        <div>
          <div style={{ background: '#B08968', padding: '22px 32px', textAlign: 'center' }}>
            <h2 style={{ color: '#F3EFE8', fontSize: 22, fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'Georgia, serif' }}>
              Temario
            </h2>
          </div>

          <div style={{ padding: '28px 28px 36px' }}>
            {MODULOS.map((mod, i) => {
              const isOpen = openModulo === i;
              return (
                <div key={i} style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', border: '1px solid #EDE0D4' }}>
                  <button
                    onClick={() => setOpenModulo(isOpen ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: isOpen ? '#fff' : '#F5EDE3',
                      border: 'none', padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#4A3F35', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {mod.titulo}
                    </span>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', background: '#4A3F35',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0, marginLeft: 12,
                      transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
                    }}>+</span>
                  </button>

                  {isOpen && (
                    <div style={{ background: '#fff', padding: '16px 20px 20px', borderTop: '1px solid #F0E8DE' }}>
                      <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.7, margin: '0 0 12px' }}>{mod.desc}</p>
                      {mod.lecciones.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {mod.lecciones.map(l => (
                            <li key={l} style={{ fontSize: 13, color: '#4A3F35', marginBottom: 6, lineHeight: 1.5 }}>{l}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
