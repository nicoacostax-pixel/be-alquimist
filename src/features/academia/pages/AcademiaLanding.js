import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';

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
  const [form,    setForm]    = useState({ nombre: '', correo: '', telefono: '' });
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [formErr, setFormErr] = useState('');

  const scrollToForm = () => document.getElementById('registro-form').scrollIntoView({ behavior: 'smooth' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.correo.trim()) return;
    setSending(true); setFormErr('');
    try {
      // Save lead
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'academia_landing', nombre: form.nombre.trim(), correo: form.correo.trim(), telefono: form.telefono }),
      });
      // Send magic link (creates account if new, logs in if existing)
      const { error } = await supabase.auth.signInWithOtp({
        email: form.correo.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/comunidad`,
          data: { nombre: form.nombre.trim(), telefono: form.telefono },
        },
      });
      if (error) { setFormErr(error.message); setSending(false); return; }
      setDone(true);
    } catch {
      setFormErr('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', background: '#FDFAF6', overflowX: 'hidden' }}>

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
            🎁 Acceso gratuito por 7 días — sin tarjeta de crédito
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
            6 cursos especializados, envíos gratuitos y chat IA de recetas. Pruébalo <strong>7 días completamente gratis</strong>.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={scrollToForm}
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
              Quiero mis 7 días gratis →
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
              { num: '7', label: 'Días gratis de acceso' },
              { num: '6', label: 'Cursos especializados' },
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
      <section id="cursos-section" style={{ padding: '56px 24px', background: '#fff' }}>
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

          {/* CTA bajo cursos */}
          <FadeIn>
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <button
                onClick={scrollToForm}
                style={{
                  background: 'linear-gradient(135deg, #B08968, #8C6A4F)', color: '#fff',
                  border: 'none', borderRadius: 14, padding: '15px 38px',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(176,137,104,0.35)',
                }}
              >
                Quiero acceso gratis por 7 días →
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── REGISTRO FORM ── */}
      <section id="registro-form" style={{
        padding: '64px 24px',
        background: 'linear-gradient(160deg, #2C2318 0%, #4A3F35 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'rgba(176,137,104,0.05)', pointerEvents: 'none' }} />
        <FadeIn>
          <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' }}>

            {/* Left copy */}
            <div style={{ flex: '1 1 340px', position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(176,137,104,0.2)', borderRadius: 30, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#C4A882', marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase' }}>
                🎁 7 días completamente gratis
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 900, color: '#fff', margin: '0 0 18px', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
                Empieza hoy.<br />
                <span style={{ color: '#C4A882' }}>Sin costo.</span>
              </h2>
              <p style={{ color: '#A89080', fontSize: 15, lineHeight: 1.8, margin: '0 0 24px' }}>
                Accede a los 6 cursos, al chat IA de recetas y a la comunidad durante 7 días sin pagar nada. Sin tarjeta de crédito, sin compromisos.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['✓ Acceso inmediato a todos los cursos', '✓ Chat IA de recetas ilimitado', '✓ Comunidad de alquimistas activa', '✓ Envíos gratis en tu tienda de insumos'].map((t, i) => (
                  <span key={i} style={{ color: '#C4B09A', fontSize: 14, fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Right form */}
            <div style={{ flex: '1 1 340px', position: 'relative' }}>
              <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                {done ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 900, color: '#4A3F35', margin: '0 0 12px' }}>¡Revisa tu correo!</h3>
                    <p style={{ color: '#7A6A5A', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                      Te enviamos un enlace mágico a <strong>{form.correo}</strong>. Haz clic en él para activar tu cuenta y empezar.
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 900, color: '#4A3F35', margin: '0 0 6px' }}>
                      Crear mi cuenta gratis
                    </h3>
                    <p style={{ color: '#9E8E80', fontSize: 13, margin: '0 0 24px' }}>7 días de acceso completo · Sin tarjeta</p>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <input
                        placeholder="Tu nombre completo *"
                        value={form.nombre}
                        onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                        required
                        style={{ border: '1.5px solid #E0D6CE', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none', color: '#1A1A1A', background: '#FAFAFA' }}
                      />
                      <input
                        placeholder="Correo electrónico *"
                        type="email"
                        value={form.correo}
                        onChange={e => setForm(p => ({ ...p, correo: e.target.value }))}
                        required
                        style={{ border: '1.5px solid #E0D6CE', borderRadius: 10, padding: '13px 16px', fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none', color: '#1A1A1A', background: '#FAFAFA' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E0D6CE', borderRadius: 10, background: '#FAFAFA', overflow: 'hidden' }}>
                        <span style={{ padding: '13px 12px', fontSize: 14, color: '#7A6A5A', borderRight: '1px solid #E0D6CE', background: '#F3EFE8', whiteSpace: 'nowrap' }}>🇲🇽 +52</span>
                        <input
                          placeholder="Teléfono (opcional)"
                          type="tel"
                          value={form.telefono}
                          onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                          style={{ flex: 1, border: 'none', padding: '13px 14px', fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none', color: '#1A1A1A', background: 'transparent' }}
                        />
                      </div>
                      {formErr && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{formErr}</p>}
                      <button
                        type="submit"
                        disabled={sending}
                        style={{
                          background: 'linear-gradient(135deg, #B08968, #8C6A4F)', color: '#fff',
                          border: 'none', borderRadius: 10, padding: '15px',
                          fontSize: 15, fontWeight: 800, cursor: sending ? 'not-allowed' : 'pointer',
                          fontFamily: 'Poppins, sans-serif', marginTop: 4,
                          boxShadow: '0 4px 16px rgba(176,137,104,0.4)',
                        }}
                      >
                        {sending ? 'Enviando…' : 'Empezar mis 7 días gratis →'}
                      </button>
                    </form>
                    <p style={{ fontSize: 11, color: '#B0A09A', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
                      Al registrarte aceptas nuestros términos. Sin cobros automáticos.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── CHAT IA ── */}
      <section style={{ padding: '56px 24px', background: 'linear-gradient(135deg, #2C2318 0%, #4A3F35 100%)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(176,137,104,0.08)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
          <FadeIn style={{ flex: '1 1 360px' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#B08968', letterSpacing: 2, textTransform: 'uppercase' }}>Inteligencia Artificial</span>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, color: '#fff', margin: '12px 0 20px', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
              Tu formuladora personal,<br />disponible 24/7
            </h2>
            <p style={{ color: '#C4B09A', fontSize: 16, lineHeight: 1.8, margin: '0 0 32px', textAlign: 'left' }}>
              Describe el producto que quieres crear y nuestra IA genera la fórmula completa: ingredientes, porcentajes, modo de preparación y consejos de conservación.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Fórmulas personalizadas en segundos', 'Ajustada a ingredientes que ya tienes', 'Incluye modo de preparación paso a paso', 'Sugiere alternativas naturales y sustentables'].map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D4C4B0', fontSize: 14 }}>
                  <span style={{ color: '#B08968', fontWeight: 900, fontSize: 16 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{ background: 'rgba(255,255,255,0.12)', color: '#D4C4B0', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Probar el chat IA →
              </button>
              <button
                onClick={scrollToForm}
                style={{ background: 'linear-gradient(135deg, #B08968, #8C6A4F)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(176,137,104,0.4)' }}
              >
                Quiero mis 7 días gratis →
              </button>
            </div>
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
      <section style={{ padding: '56px 24px', background: '#F9F5EF' }}>
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

          <FadeIn>
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <button
                onClick={scrollToForm}
                style={{
                  background: 'linear-gradient(135deg, #B08968, #8C6A4F)', color: '#fff',
                  border: 'none', borderRadius: 14, padding: '15px 38px',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 6px 20px rgba(176,137,104,0.35)',
                }}
              >
                Empezar gratis — 7 días sin costo →
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── ENVÍOS ── */}
      <section style={{ padding: '48px 24px', background: '#fff' }}>
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

    </div>
  );
}
