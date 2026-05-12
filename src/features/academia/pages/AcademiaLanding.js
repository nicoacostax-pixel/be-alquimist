import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';

const BENEFICIOS = [
  { emoji: '📚', text: '+12 cursos especializados' },
  { emoji: '🤖', text: 'Chat IA de recetas' },
  { emoji: '🚚', text: 'Envíos siempre gratis' },
  { emoji: '👥', text: 'Comunidad activa' },
];

export default function AcademiaLanding() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ nombre: '', correo: '', telefono: '' });
  const [sending, setSending] = useState(false);
  const [formErr, setFormErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.correo.trim()) return;
    setSending(true); setFormErr('');
    try {
      const res = await fetch('/api/academia-registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          correo: form.correo.trim(),
          telefono: form.telefono,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setFormErr(json.error || 'Ocurrió un error. Intenta de nuevo.'); setSending(false); return; }
      if (json.email && json.tempPassword) {
        await supabase.auth.signInWithPassword({ email: json.email, password: json.tempPassword });
      }
      navigate('/academia/confirmacion');
    } catch {
      setFormErr('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', minHeight: '100vh', background: 'linear-gradient(160deg, #F3EFE8 0%, #EDE0D4 55%, #F9F5EF 100%)', overflowX: 'hidden' }}>

      {/* Blobs */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(176,137,104,0.07)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(176,137,104,0.05)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: 'clamp(40px, 8vh, 80px) 24px 60px' }}>

        {/* ── HERO + FORM ── */}
        <div style={{ display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Left */}
          <div style={{ flex: '1 1 340px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#fff', border: '1px solid #EDE0D4', borderRadius: 30,
              padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#B08968',
              marginBottom: 24, boxShadow: '0 2px 8px rgba(176,137,104,0.12)', letterSpacing: 0.5,
            }}>
              🎁 Inscripción gratuita · sin tarjeta de crédito
            </div>

            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(32px, 5vw, 60px)',
              fontWeight: 900, color: '#2C2318',
              lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-1px',
            }}>
              Aprende a crear tu<br />
              <span style={{ color: '#B08968' }}>propia cosmética<br />natural</span>
            </h1>

            <p style={{ fontSize: 15, color: '#7A6A5A', lineHeight: 1.75, margin: '0 0 28px', maxWidth: 460 }}>
              +12 cursos, chat IA de recetas y comunidad activa. <strong>Inscríbete gratis</strong> y empieza hoy.
            </p>

            {/* Benefits strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {BENEFICIOS.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(176,137,104,0.18)', borderRadius: 30,
                  padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#4A3F35',
                }}>
                  <span>{b.emoji}</span> {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div style={{ flex: '1 1 320px' }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #EDE0D4' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 900, color: '#2C2318', margin: '0 0 4px' }}>
                Inscríbete a la Academia
              </h2>
              <p style={{ color: '#9E8E80', fontSize: 13, margin: '0 0 24px' }}>Acceso gratuito · Sin tarjeta de crédito</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                  {sending ? 'Creando tu cuenta…' : 'Inscribirme gratis →'}
                </button>
              </form>

              <p style={{ fontSize: 11, color: '#B0A09A', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                Sin cobros automáticos. Cancela cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
