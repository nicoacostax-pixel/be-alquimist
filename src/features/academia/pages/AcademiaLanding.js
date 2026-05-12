import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const CURSOS = [
  {
    emoji: '🌿',
    nombre: 'Ruta de Cosmética Natural',
    desc: 'La base completa para formular productos naturales desde cero: ingredientes, conservantes, pH y más.',
    nivel: 'Principiante',
    color: '#4CAF50',
  },
  {
    emoji: '💄',
    nombre: 'Maquillaje Sólido',
    desc: 'Crea labiales, correctores y polvos compactos 100% naturales con fórmulas probadas.',
    nivel: 'Intermedio',
    color: '#E91E63',
  },
  {
    emoji: '🧼',
    nombre: 'Jabones Artesanales',
    desc: 'Domina el proceso en frío y en caliente para elaborar jabones con aceites vegetales y botanicals.',
    nivel: 'Principiante',
    color: '#8BC34A',
  },
  {
    emoji: '🧴',
    nombre: 'Shampoo Sólido',
    desc: 'Formula shampoos sólidos zero waste con tensioactivos naturales y activos capilares.',
    nivel: 'Intermedio',
    color: '#26A69A',
  },
  {
    emoji: '✨',
    nombre: 'Skin Care Natural',
    desc: 'Serums, cremas, tónicos y rutinas completas con activos botánicos de alta eficacia.',
    nivel: 'Avanzado',
    color: '#B08968',
  },
  {
    emoji: '🕯️',
    nombre: 'Velas de Soya',
    desc: 'Aprende a crear velas aromáticas premium con cera de soya, fragancias y aceites esenciales.',
    nivel: 'Principiante',
    color: '#FF8F00',
  },
];

const BENEFICIOS = [
  {
    emoji: '🚚',
    titulo: 'Envíos gratuitos',
    desc: 'Recibe tus insumos sin costo de envío en cada pedido. Sin mínimo de compra.',
  },
  {
    emoji: '🤖',
    titulo: 'Chat IA de recetas',
    desc: 'Genera fórmulas personalizadas al instante con nuestra inteligencia artificial especializada en cosmética.',
  },
  {
    emoji: '👥',
    titulo: 'Comunidad activa',
    desc: 'Aprende con miles de alquimistas. Comparte tus creaciones, resuelve dudas y celebra victorias.',
  },
  {
    emoji: '📈',
    titulo: 'Sistema de niveles',
    desc: 'Avanza de Semilla a Leyenda Alquimista conforme completas cursos y participas en la comunidad.',
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function AcademiaLanding() {
  const navigate = useNavigate();
  const [hoveredCurso, setHoveredCurso] = useState(null);

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', background: '#FDFAF6', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(253,250,246,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #EDE0D4',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60,
      }}>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 18, color: '#4A3F35', letterSpacing: '-0.5px' }}>
          Be Alquimist
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: '1.5px solid #D0C8BF', borderRadius: 30, padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#4A3F35', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => navigate('/registro')}
            style={{ background: '#B08968', border: 'none', borderRadius: 30, padding: '8px 20px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Unirme gratis →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #F3EFE8 0%, #EDE0D4 50%, #F9F5EF 100%)',
        padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(176,137,104,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(176,137,104,0.06)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 780, position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #EDE0D4', borderRadius: 30,
            padding: '6px 18px', fontSize: 13, fontWeight: 600, color: '#B08968',
            marginBottom: 32, boxShadow: '0 2px 12px rgba(176,137,104,0.12)',
          }}>
            ✨ La academia de cosmética natural más completa de México
          </div>

          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 900, color: '#2C2318', lineHeight: 1.1,
            margin: '0 0 24px', letterSpacing: '-1px',
          }}>
            Aprende a crear tu<br />
            <span style={{ color: '#B08968' }}>propia cosmética natural</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: '#7A6A5A', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
            6 cursos especializados, envíos gratuitos en tus insumos y un chat con IA que genera recetas personalizadas al instante.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/registro')}
              style={{
                background: 'linear-gradient(135deg, #B08968, #8C6A4F)', color: '#fff',
                border: 'none', borderRadius: 14, padding: '16px 36px',
                fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 24px rgba(176,137,104,0.4)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(176,137,104,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(176,137,104,0.4)'; }}
            >
              Empezar gratis →
            </button>
            <button
              onClick={() => document.getElementById('cursos-section').scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: '#fff', color: '#4A3F35', border: '1.5px solid #D0C8BF',
                borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}
            >
              Ver cursos
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { num: '6', label: 'Cursos especializados' },
              { num: '100%', label: 'Natural & sustentable' },
              { num: '🚚', label: 'Envíos gratuitos' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#B08968', fontFamily: 'Georgia, serif' }}>{s.num}</div>
                <div style={{ fontSize: 12, color: '#9E8E80', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURSOS ── */}
      <section id="cursos-section" style={{ padding: '96px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#B08968', letterSpacing: 2, textTransform: 'uppercase' }}>Academia</span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#2C2318', margin: '12px 0 16px', letterSpacing: '-0.5px' }}>
                6 rutas de aprendizaje
              </h2>
              <p style={{ color: '#7A6A5A', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                Desde principiante hasta formuladora avanzada. Accede a los cursos según tu nivel y avanza a tu ritmo.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {CURSOS.map((c, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div
                  onMouseEnter={() => setHoveredCurso(i)}
                  onMouseLeave={() => setHoveredCurso(null)}
                  style={{
                    background: hoveredCurso === i ? '#FDFAF6' : '#fff',
                    border: `1.5px solid ${hoveredCurso === i ? c.color + '55' : '#EDE0D4'}`,
                    borderRadius: 20, padding: '32px 28px',
                    transition: 'all 0.22s ease',
                    boxShadow: hoveredCurso === i ? `0 8px 32px ${c.color}18` : '0 2px 12px rgba(0,0,0,0.04)',
                    transform: hoveredCurso === i ? 'translateY(-4px)' : 'none',
                    cursor: 'default',
                  }}
                >
                  <div style={{ fontSize: 44, marginBottom: 18, lineHeight: 1 }}>{c.emoji}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 900, color: '#2C2318', margin: 0, flex: 1 }}>
                      {c.nombre}
                    </h3>
                  </div>
                  <p style={{ color: '#7A6A5A', fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' }}>
                    {c.desc}
                  </p>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    background: c.color + '18', color: c.color,
                  }}>
                    {c.nivel}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAT IA ── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(135deg, #2C2318 0%, #4A3F35 100%)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(176,137,104,0.08)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
          <FadeIn style={{ flex: '1 1 360px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#B08968', letterSpacing: 2, textTransform: 'uppercase' }}>Inteligencia Artificial</span>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#fff', margin: '12px 0 20px', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
              Tu formuladora personal,<br />disponible 24/7
            </h2>
            <p style={{ color: '#C4B09A', fontSize: 16, lineHeight: 1.8, margin: '0 0 32px' }}>
              Describe el producto que quieres crear y nuestra IA genera la fórmula completa: ingredientes, porcentajes, modo de preparación y consejos de conservación.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Fórmulas personalizadas en segundos', 'Ajustada a ingredientes que ya tienes', 'Incluye modo de preparación paso a paso', 'Sugiere alternativas naturales y sustentables'].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D4C4B0', fontSize: 14 }}>
                  <span style={{ color: '#B08968', fontWeight: 900, fontSize: 16 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: 'linear-gradient(135deg, #B08968, #8C6A4F)', color: '#fff',
                border: 'none', borderRadius: 12, padding: '14px 32px',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 20px rgba(176,137,104,0.4)',
              }}
            >
              Probar el chat IA →
            </button>
          </FadeIn>

          <FadeIn delay={0.2} style={{ flex: '1 1 300px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '1px solid rgba(176,137,104,0.3)', overflow: 'hidden' }}>
              {/* Chat mockup */}
              <div style={{ background: 'rgba(176,137,104,0.15)', padding: '14px 20px', borderBottom: '1px solid rgba(176,137,104,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🤖</span>
                <span style={{ color: '#D4C4B0', fontSize: 13, fontWeight: 700 }}>Chat IA · Be Alquimist</span>
                <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#4CAF50', display: 'block' }} />
              </div>
              <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { user: true,  text: 'Quiero hacer un sérum vitamina C para piel sensible' },
                  { user: false, text: 'Aquí tienes tu fórmula: Agua destilada 70%, Niacinamida 5%, Vitamina C estabilizada 10%, Aloe vera 10%, Glicerina 3%, Conservante Geogard 1%, Xantana 0.5%, pH ajustado a 3.5...' },
                  { user: true,  text: '¿Puedo sustituir la vitamina C?' },
                  { user: false, text: 'Sí, puedes usar Extracto de Kakadu Plum al 2-5%, tiene vitamina C natural y es más estable...' },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.user ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px', borderRadius: m.user ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: m.user ? '#B08968' : 'rgba(255,255,255,0.1)',
                      color: m.user ? '#fff' : '#D4C4B0', fontSize: 12, lineHeight: 1.6,
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section style={{ padding: '96px 24px', background: '#F9F5EF' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#B08968', letterSpacing: 2, textTransform: 'uppercase' }}>Todo incluido</span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#2C2318', margin: '12px 0 0', letterSpacing: '-0.5px' }}>
                Más que cursos
              </h2>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {BENEFICIOS.map((b, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ background: '#fff', borderRadius: 20, padding: '36px 28px', border: '1px solid #EDE0D4', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: 42, marginBottom: 18 }}>{b.emoji}</div>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 900, color: '#2C2318', margin: '0 0 12px' }}>
                    {b.titulo}
                  </h3>
                  <p style={{ color: '#7A6A5A', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    {b.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENVÍOS ── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <FadeIn>
          <div style={{
            maxWidth: 900, margin: '0 auto',
            background: 'linear-gradient(135deg, #F3EFE8, #EDE0D4)',
            borderRadius: 28, padding: 'clamp(40px, 6vw, 72px)',
            display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap',
            border: '1px solid #D0C8BF',
          }}>
            <div style={{ flex: '1 1 280px' }}>
              <span style={{ fontSize: 64 }}>🚚</span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, color: '#2C2318', margin: '20px 0 16px', lineHeight: 1.2 }}>
                Envíos gratuitos<br />en todos tus pedidos
              </h2>
              <p style={{ color: '#7A6A5A', fontSize: 15, lineHeight: 1.8, margin: '0 0 28px' }}>
                Compra tus insumos directamente en nuestra tienda y recíbelos en tu puerta sin costo de envío. Sin mínimo de compra, sin letra chica.
              </p>
              <button
                onClick={() => window.location.href = '/insumos'}
                style={{
                  background: '#4A3F35', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '14px 30px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Ver tienda de insumos →
              </button>
            </div>
            <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '📦', text: 'Empaque sustentable y seguro' },
                { icon: '⚡', text: 'Envío express disponible' },
                { icon: '🌎', text: 'Entrega en toda la república' },
                { icon: '💳', text: 'Pago en cuotas sin intereses' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1px solid #EDE0D4' }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#4A3F35' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{
        padding: '100px 24px', textAlign: 'center',
        background: 'linear-gradient(160deg, #2C2318 0%, #4A3F35 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'rgba(176,137,104,0.06)', pointerEvents: 'none' }} />
        <FadeIn>
          <span style={{ fontSize: 52 }}>⚗️</span>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px, 5vw, 58px)', fontWeight: 900, color: '#fff', margin: '20px 0 20px', letterSpacing: '-1px', lineHeight: 1.1 }}>
            Empieza tu camino<br />
            <span style={{ color: '#C4A882' }}>como alquimista hoy</span>
          </h2>
          <p style={{ color: '#A89080', fontSize: 17, lineHeight: 1.8, marginBottom: 44, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Regístrate gratis, accede al chat IA y comienza con tu primer curso de cosmética natural.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.href = '/registro'}
              style={{
                background: 'linear-gradient(135deg, #B08968, #8C6A4F)', color: '#fff',
                border: 'none', borderRadius: 14, padding: '18px 44px',
                fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 28px rgba(176,137,104,0.45)',
              }}
            >
              Crear mi cuenta gratis →
            </button>
            <button
              onClick={() => window.location.href = '/comunidad'}
              style={{
                background: 'rgba(255,255,255,0.08)', color: '#D4C4B0',
                border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 14,
                padding: '18px 44px', fontSize: 17, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Ver la comunidad
            </button>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1A110A', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: '#6B5744', fontSize: 13, margin: 0, fontWeight: 500 }}>
          © 2025 Be Alquimist · Cosmética natural hecha con amor 🌿
        </p>
      </footer>
    </div>
  );
}
