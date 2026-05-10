import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CursoVelas.css';
import CursoVelasPopup from './CursoVelasPopup';
import { useCart } from '../../../shared/context/CartContext';

const KIT_PRODUCTO = { id: 'kit-de-velas-de-soya', nombre: 'Kit de Velas de Soya', imagen_url: '/KIT.jpg' };
const KIT_VARIANTE = { nombre: 'Estándar', precio: 1499, sku: 'kit-velas-soya-estandar' };

const INFO = [
  { icon: '🎬', label: 'Contenido',        value: '+20 videos y +10 manuales' },
  { icon: '📅', label: 'Duración',         value: '1 mes de aprendizaje' },
  { icon: '🎓', label: 'Diploma',          value: 'Al aprobar los 9 módulos' },
  { icon: '📚', label: 'Módulos',          value: '9 módulos completos' },
  { icon: '⏱️', label: 'Ritmo',            value: 'A tu propio ritmo' },
  { icon: '💻', label: 'Modalidad',        value: 'Online, 100% digital' },
  { icon: '♾️', label: 'Acceso',           value: 'De por vida, para siempre' },
  { icon: '💬', label: 'Asesoría',         value: 'Grupo exclusivo de ayuda' },
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

function scrollToPrecio(e) {
  e.preventDefault();
  document.getElementById('precio')?.scrollIntoView({ behavior: 'smooth' });
}

export default function CursoVelas() {
  const { d, h, m, s } = useCountdown(DEADLINE);
  const [openModulo, setOpenModulo] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const { addToCart, clearCart } = useCart();
  const navigate = useNavigate();

  function comprarKit() {
    clearCart();
    addToCart(KIT_PRODUCTO, KIT_VARIANTE, 1);
    navigate('/checkout');
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('cv-revealed'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cv-page">
      <CursoVelasPopup />

      {/* NAV */}
      <nav className="cv-nav">
        <Link to="/" style={{ color: '#B08968', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          ← Be Alquimist
        </Link>
        <span style={{ color: '#B08968', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>CURSOS</span>
      </nav>

      <div className="cv-wrapper">

        {/* HEADER */}
        <div className="cv-header">
          <p style={{ color: '#F3EFE8', fontSize: 11, fontWeight: 700, letterSpacing: 4, margin: '0 0 14px', textTransform: 'uppercase', opacity: 0.85 }}>
            ⚗️ Be Alquimist
          </p>
          <h1 style={{
            color: '#F3EFE8', fontSize: 32, fontWeight: 900, lineHeight: 1.2,
            margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'Georgia, serif',
          }}>
            Curso de Velas<br />de Soya
          </h1>
          <p style={{ color: '#F3EFE8', fontSize: 14, fontWeight: 400, margin: 0, opacity: 0.9, lineHeight: 1.6 }}>
            Aprende a formular velas únicas desde cero y conviértelo en tu negocio
          </p>
        </div>

        {/* IMAGEN + INFO */}
        <div className="cv-intro">
          <div className="cv-img-wrap">
            <img src="/Velas.jpg" alt="Curso de Velas de Soya" />
          </div>
          <div className="cv-info">
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#4A3F35', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 18px' }}>
              Detalles del curso
            </h2>
            <div className="cv-info-grid">
              {INFO.map(({ icon, label, value }) => (
                <div key={label} className="cv-info-chip">
                  <span className="cv-info-chip-icon">{icon}</span>
                  <div>
                    <div className="cv-info-chip-label">{label}</div>
                    <div className="cv-info-chip-value">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cv-cta-wrap" style={{ padding: 0, marginTop: 24 }}>
              <a href="#precio" onClick={scrollToPrecio} style={{
                display: 'inline-block', background: '#B08968', color: '#fff',
                fontWeight: 700, fontSize: 14, padding: '14px 44px', borderRadius: 30,
                textDecoration: 'none', letterSpacing: 2, textTransform: 'uppercase',
              }}>
                Inscríbete ahora
              </a>
            </div>
          </div>
        </div>

        {/* CTA móvil (oculto en desktop via CSS) */}
        <div className="cv-cta-wrap">
          <a href="#precio" onClick={scrollToPrecio} style={{
            display: 'inline-block', background: '#B08968', color: '#fff',
            fontWeight: 700, fontSize: 14, padding: '14px 44px', borderRadius: 30,
            textDecoration: 'none', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Inscríbete ahora
          </a>
        </div>

        {/* INFORMACIÓN DEL CURSO */}
        <div data-reveal>
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
        <div className="cv-social" data-reveal>

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
        <div id="precio" data-reveal>
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
                <button onClick={comprarKit}
                  style={{
                    display: 'inline-block', marginTop: 16, background: '#4A3F35', color: '#fff',
                    fontWeight: 700, fontSize: 15, padding: '14px 36px', borderRadius: 30,
                    border: 'none', cursor: 'pointer', width: '100%',
                  }}>
                  Inscríbete Aquí
                </button>
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
        <div className="cv-countdown" data-reveal>
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
        <div data-reveal>
          <div style={{ background: '#C9A882', padding: '22px 32px', textAlign: 'center' }}>
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

        {/* TESTIMONIO + BENEFICIOS */}
        {/* Testimonio */}
        <div className="cv-testimonio" style={{ background: '#F3EFE8' }} data-reveal>
          <p style={{ fontStyle: 'italic', fontSize: 15, color: '#4A3F35', lineHeight: 1.8, margin: '0 0 20px', textAlign: 'justify' }}>
            "Durante el último año, he gastado una gran cantidad de dinero estudiando con otras personas y tomando varios cursos de forma online y presencial, pero nunca me sentí satisfecha con mi comprensión de los ingredientes, los métodos de formulación o la enseñanza de la cosmética natural. Tan pronto como adquirí el primer Manual de Be Alquimist, supe que había llegado al lugar correcto, la forma en la que explicaban el porque de cada ingrediente en una formulación me encanto, así que en cuanto vi este curso no dude ni un momento en adquirirlo, después de tomarlo puedo decir que es simplemente increíble. El equipo de Be Alquimist, además de ser unos excelentes profesores, son Biotecnólogos expertos en los que puede confiar, no son aficionados que hayan aprendido todo su conocimiento de Google o los rumores que circulan en los cientos de videos que hay por YouTube.{' '}
            <strong>No pierdas el tiempo estudiando con nadie más. Be Alquimist debe de ser tu única opción si deseas aprender todo lo relacionado a la Cosmética Natural y Artesanal".</strong>
          </p>
          <p style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: '#4A3F35', margin: 0 }}>
            – Fernanda Galván, &nbsp;México
          </p>
        </div>

        {/* Beneficios grid */}
        <div className="cv-beneficios">
          {[
            [
              { icon: '🎬', title: '+20 VIDEOS', desc: 'Aprende directamente del equipo de Be Alquimist con nuestros videos profesionales y de la mejor calidad.' },
              { icon: '📋', title: '+10 MANUALES', desc: 'Descarga los manuales del curso cuidadosamente diseñados para consultarlos cuando necesites.' },
              { icon: '🧩', title: 'SESIONES EN VIVO', desc: 'Cada semana tendremos sesiones en vivo donde atenderemos tus dudas y las de tus compañeros.' },
            ],
            [
              { icon: '🔓', title: 'APRENDIZAJE SECUENCIAL', desc: 'Desbloquea nuevos módulos a medida que avanzas en el curso secuencialmente para reforzar tu aprendizaje.' },
              { icon: '🤍', title: 'GRUPO DE AYUDA', desc: 'Únete a un grupo exclusivo de estudiantes de Be Alquimist, donde podrás consultar todas tus dudas con cientos de expertos.' },
              { icon: '⭐', title: 'DIPLOMA', desc: 'Al aprobar el último examen del curso recibe un diploma por haber terminado el curso.' },
            ],
          ].flat().map(({ icon, title, desc }) => (
            <div key={title} style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#4A3F35', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>{title}</h3>
              <p style={{ fontSize: 14, color: '#7A6A5A', lineHeight: 1.7, margin: 0, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* BONUS DEL CURSO */}
        <div data-reveal>
          <div style={{ background: '#F3EFE8', padding: '40px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#4A3F35', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 16px', fontFamily: 'Georgia, serif' }}>
              Bonus del Curso
            </h2>
            <p style={{ fontSize: 15, color: '#5A4A40', lineHeight: 1.7, margin: 0, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
              Cuando estudias en Be Alquimist, te conviertes en una persona muy importante dentro de nuestra comunidad de estudiantes y graduados en toda Latinoamérica. Te apoyaremos en todos tus estudios y más allá para que puedas consolidar tu marca.
            </p>
          </div>

          <div className="cv-bonus-grid">
            {[
              { icon: '🏷️', title: 'Descuentos Exclusivos', desc: 'Como alumno de Be Alquimist podrás acceder a increíbles descuentos en todos nuestros insumos, manuales y cursos.' },
              { icon: '🏠', title: 'Comunidad de Alumnos', desc: 'Recibe apoyo de tus compañeros, haz preguntas, comparte fotos, soluciona problemas de formulaciones.' },
              { icon: '👥', title: 'Sesiones en Vivo', desc: 'Recibe apoyo en sesiones en vivo junto a todos tus compañeros, donde podrás aclarar todas tus dudas.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ textAlign: 'center', padding: '36px 24px' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#4A3F35', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#7A6A5A', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PARA TI SI */}
        <div style={{ background: '#F3EFE8' }} data-reveal>
          <div className="cv-paratiif">
            {/* Imagen */}
            <div className="cv-paratiif-img">
              <img src="/KIT.jpg" alt="Kit Velas de Soya" style={{ maxWidth: '100%', height: 'auto', borderRadius: 12, display: 'block' }} />
            </div>
            {/* Lista */}
            <div className="cv-paratiif-text">
              <p style={{ fontStyle: 'italic', fontSize: 13, color: '#7A6A5A', margin: '0 0 10px' }}>
                ¿Porqué inscribirte en Be Alquimist?
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#4A3F35', textTransform: 'uppercase', margin: '0 0 24px', letterSpacing: 0.5 }}>
                Este curso es para ti si:
              </h2>
              {[
                'Deseas iniciar tu propia marca de Velas de Soya en cualquier parte del mundo.',
                'Has estado haciendo velas de soya de forma casera y quieres convertir tu pasatiempo en un negocio.',
                'Quieres aprender a formular productos de cosmética natural de calidad profesional.',
                'Quieres inscribirte a la escuela de cosmética natural más profesional de forma online.',
                'Quieres aprender de un equipo de Biotecnólogos especialistas en el área de la cosmética.',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🤍</span>
                  <p style={{ fontSize: 14, color: '#4A3F35', lineHeight: 1.6, margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA final */}
          <div style={{ textAlign: 'center', padding: '40px 32px 56px' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#4A3F35', margin: '0 0 24px', fontFamily: 'Georgia, serif' }}>
              ¿Deseas inscribirte?
            </h2>
            <a href="#precio" onClick={scrollToPrecio}
              style={{
                display: 'inline-block', background: '#B08968', color: '#fff',
                fontWeight: 700, fontSize: 15, padding: '16px 48px', borderRadius: 30,
                textDecoration: 'none', letterSpacing: 0.5,
              }}>
              ¡Sí! Deseo inscribirme
            </a>
          </div>
        </div>

        {/* PREGUNTAS FRECUENTES */}
        <div data-reveal>
          <div style={{ background: '#B08968', padding: '28px 32px', textAlign: 'center' }}>
            <h2 style={{ color: '#F3EFE8', fontSize: 24, fontWeight: 900, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'Georgia, serif' }}>
              Preguntas Frecuentes
            </h2>
            <p style={{ color: '#F3EFE8', fontSize: 12, fontWeight: 600, margin: 0, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 }}>
              Curso de Velas de Soya
            </p>
          </div>

          <div style={{ padding: '28px 28px 16px' }}>
            {[
              {
                q: '¿Incluye los materiales?',
                a: <>No, <strong>los materiales no están incluidos en el coste del curso,</strong> pero te obsequiaremos descuentos permanentes en todos nuestros insumos para que puedas adquirirlos a un super precio. Puedes comprar grandes cantidades para economizar gastos o compartir tu pedido con algún otro estudiante de tu ciudad.</>,
              },
              { q: '¿Y si no tengo experiencia en velas de soya?', a: 'No te preocupes, este curso es ideal si deseas comenzar a formar parte de la Cosmética Natural.' },
              { q: '¿Se puede realizar desde cualquier lugar?', a: '¡Sí! El curso es 100% online.' },
              { q: '¿Los productos que aprenderé a hacer son naturales?', a: '¡Sí! Todos los productos que aprenderás a realizar en el curso son 100% naturales.' },
              { q: '¿Me darán un certificado?', a: 'Al finalizar tu curso serás acreedor a un Diploma donde acreditamos tu formación en nuestra Academia.' },
            ].map(({ q, a }, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', border: '1px solid #EDE0D4' }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: isOpen ? '#fff' : '#FAF7F2',
                      border: 'none', padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#4A3F35', lineHeight: 1.4 }}>{q}</span>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', background: '#4A3F35',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0, marginLeft: 12,
                      transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
                    }}>+</span>
                  </button>
                  {isOpen && (
                    <div style={{ background: '#fff', padding: '14px 20px 18px', borderTop: '1px solid #F0E8DE' }}>
                      <p style={{ fontSize: 14, color: '#7A6A5A', lineHeight: 1.7, margin: 0 }}>{a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', padding: '16px 32px 56px' }}>
            <a href="https://wa.me/524921291547?text=Quiero%20inscribirme%20al%20Curso%20Velas%20de%20Soya" target="_blank" rel="noreferrer"
              style={{
                display: 'inline-block', background: '#B08968', color: '#fff',
                fontWeight: 700, fontSize: 14, padding: '14px 48px', borderRadius: 30,
                textDecoration: 'none', letterSpacing: 2, textTransform: 'uppercase',
              }}>
              Inscribirme Ahora
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
