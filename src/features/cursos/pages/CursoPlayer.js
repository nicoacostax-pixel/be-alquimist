import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import './CursoPlayer.css';

async function api(action, data, token) {
  const res = await fetch('/api/cursos-lms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...data }),
  });
  return res.json();
}

// ── Block renderers ───────────────────────────────────────────────────────────

function VideoBlock({ block }) {
  const id = block.vimeo_url?.match(/(\d{6,})/)?.[1];
  if (!id) return null;
  return (
    <div className="cp-block-video">
      <iframe
        src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&color=B08968`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </div>
  );
}

function TextBlock({ block }) {
  return <p className="cp-block-text">{block.content}</p>;
}

function ButtonBlock({ block }) {
  return (
    <a href={block.url} target="_blank" rel="noopener noreferrer" className="cp-block-button">
      {block.label || 'Ver más'}
    </a>
  );
}

function PdfBlock({ block }) {
  return (
    <a href={block.url} target="_blank" rel="noopener noreferrer" className="cp-block-pdf">
      <span className="cp-block-pdf-icon">📄</span>
      <div>
        <div className="cp-block-pdf-title">{block.nombre || 'Recurso descargable'}</div>
        <div className="cp-block-pdf-sub">Clic para descargar</div>
      </div>
    </a>
  );
}

function renderBlock(block, i) {
  if (block.type === 'video')  return <VideoBlock  key={i} block={block} />;
  if (block.type === 'text')   return <TextBlock   key={i} block={block} />;
  if (block.type === 'button') return <ButtonBlock key={i} block={block} />;
  if (block.type === 'pdf')    return <PdfBlock    key={i} block={block} />;
  return null;
}

// ── Enrollment form ───────────────────────────────────────────────────────────

function InscripcionForm({ curso, slug, token, onSuccess }) {
  const [nombre,   setNombre]   = useState('');
  const [telefono, setTelefono] = useState('');
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSending(true); setError('');
    const res = await api('inscribirse', { slug, nombre: nombre.trim(), telefono }, token);
    if (res.error) { setError(res.error); setSending(false); return; }
    onSuccess();
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F3EFE8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 52 }}>🕯️</span>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#4A3F35', margin: '14px 0 8px', fontFamily: 'Georgia, serif' }}>
            {curso?.titulo || 'Acceder al curso'}
          </h1>
          <p style={{ color: '#7A6A5A', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            Completa tu inscripción gratuita para acceder al contenido completo durante <strong>7 días</strong>.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', border: '1px solid #EDE0D4' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              placeholder="Tu nombre completo *"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              style={{
                border: '1.5px solid #D0C8BF', borderRadius: 10, padding: '14px 16px',
                fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1A1A1A', background: '#FAFAFA',
              }}
            />
            <input
              placeholder="Teléfono (opcional)"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              type="tel"
              style={{
                border: '1.5px solid #D0C8BF', borderRadius: 10, padding: '14px 16px',
                fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#1A1A1A', background: '#FAFAFA',
              }}
            />
            {error && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{error}</p>}
            <button type="submit" disabled={sending} style={{
              background: '#B08968', color: '#fff', border: 'none', borderRadius: 10,
              padding: '15px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              marginTop: 4,
            }}>
              {sending ? 'Inscribiendo…' : 'Acceder al curso →'}
            </button>
          </form>
          <p style={{ fontSize: 12, color: '#9E8E80', textAlign: 'center', marginTop: 18, lineHeight: 1.6 }}>
            Sin costo. Acceso completo por 7 días desde hoy.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main player ───────────────────────────────────────────────────────────────

export default function CursoPlayer() {
  const { slug }       = useParams();
  const navigate       = useNavigate();
  const [token,         setToken]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [playerData,    setPlayerData]    = useState(null);
  const [needsEnroll,   setNeedsEnroll]   = useState(false);
  const [cursoPrev,     setCursoPrev]     = useState(null);
  const [leccion,       setLeccion]       = useState(null);
  const [completadas,   setCompletadas]   = useState([]);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [marking,       setMarking]       = useState(false);

  const loadPlayer = useCallback(async (tok) => {
    setLoading(true);
    const res = await api('getPlayerData', { slug }, tok);
    setLoading(false);
    if (res.needsEnrollment) {
      setNeedsEnroll(true);
      setCursoPrev(res.curso);
      return;
    }
    if (res.error) return;
    setPlayerData(res);
    setCompletadas(res.completadas || []);
    const first = res.modulos?.[0]?.lecciones?.[0];
    if (first) setLeccion(first);
  }, [slug]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate(`/login?redirect=/cursos/${slug}/aprender`);
        return;
      }
      const tok = session.access_token;
      setToken(tok);
      loadPlayer(tok);
    });
  }, [slug, navigate, loadPlayer]);

  const toggleCompleta = useCallback(async () => {
    if (!leccion || !token || marking) return;
    setMarking(true);
    const isDone   = completadas.includes(leccion.id);
    const action   = isDone ? 'desmarcarCompleta' : 'marcarCompleta';
    await api(action, { leccionId: leccion.id }, token);
    setCompletadas(prev => isDone ? prev.filter(id => id !== leccion.id) : [...prev, leccion.id]);
    setMarking(false);
    // Auto-advance on mark complete
    if (!isDone) {
      const all  = playerData.modulos.flatMap(m => m.lecciones || []);
      const idx  = all.findIndex(l => l.id === leccion.id);
      if (idx < all.length - 1) setLeccion(all[idx + 1]);
    }
  }, [leccion, completadas, token, marking, playerData]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif', color: '#7A6A5A' }}>
      Cargando…
    </div>
  );

  if (needsEnroll) return (
    <InscripcionForm
      curso={cursoPrev}
      slug={slug}
      token={token}
      onSuccess={() => { setNeedsEnroll(false); loadPlayer(token); }}
    />
  );

  if (!playerData) return null;

  const { curso, modulos, inscripcion } = playerData;
  const allLecciones   = (modulos || []).flatMap(m => m.lecciones || []);
  const total          = allLecciones.length;
  const done           = allLecciones.filter(l => completadas.includes(l.id)).length;
  const pct            = total ? Math.round((done / total) * 100) : 0;
  const diasRestantes  = inscripcion
    ? Math.max(0, Math.ceil((new Date(inscripcion.expira_at) - Date.now()) / 86400000))
    : 0;

  const currentIdx = allLecciones.findIndex(l => l.id === leccion?.id);
  const prevLec    = allLecciones[currentIdx - 1];
  const nextLec    = allLecciones[currentIdx + 1];

  return (
    <div className="cp-root">
      {/* TOP BAR */}
      <header className="cp-topbar">
        <button className="cp-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">
          ☰
        </button>
        <span className="cp-topbar-logo">Be Alquimist</span>
        <span className="cp-topbar-title">{curso?.titulo}</span>

        <div className="cp-progress-wrap">
          <span className="cp-progress-label">{pct}% completado</span>
          <div className="cp-progress-bar">
            <div className="cp-progress-fill" style={{ width: pct + '%' }} />
          </div>
          <span className="cp-progress-steps">{done}/{total}</span>
        </div>

        <span className="cp-days-badge">⏱ {diasRestantes}d restantes</span>
      </header>

      <div className="cp-body">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div className="cp-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* SIDEBAR */}
        <aside className={`cp-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="cp-sidebar-inner">
            {(modulos || []).map((mod, mi) => (
              <div key={mod.id}>
                <div className="cp-modulo-title">Módulo {mi + 1}: {mod.titulo}</div>
                {(mod.lecciones || []).map(lec => {
                  const isActive = leccion?.id === lec.id;
                  const isDone   = completadas.includes(lec.id);
                  return (
                    <button
                      key={lec.id}
                      className={`cp-lesson-btn${isActive ? ' active' : ''}`}
                      onClick={() => { setLeccion(lec); setSidebarOpen(false); }}
                    >
                      <span className={`cp-check${isDone ? ' done' : ''}`}>
                        {isDone ? '✓' : '○'}
                      </span>
                      <span className="cp-lesson-name">{lec.titulo}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="cp-content">
          {leccion ? (
            <div className="cp-lesson">
              <div className="cp-lesson-header">
                <h1 className="cp-lesson-title">{leccion.titulo}</h1>
                <button
                  className={`cp-mark-btn${completadas.includes(leccion.id) ? ' done' : ''}`}
                  onClick={toggleCompleta}
                  disabled={marking}
                >
                  {completadas.includes(leccion.id) ? '✓ Completada' : 'Marcar como completada'}
                </button>
              </div>

              <div className="cp-blocks">
                {(leccion.bloques || []).map((b, i) => renderBlock(b, i))}
                {(!leccion.bloques || leccion.bloques.length === 0) && (
                  <p style={{ color: '#9E8E80', fontSize: 14, textAlign: 'center', marginTop: 60 }}>
                    Esta lección aún no tiene contenido.
                  </p>
                )}
              </div>

              <div className="cp-lesson-nav">
                {prevLec && (
                  <button className="cp-nav-btn" onClick={() => setLeccion(prevLec)}>
                    ← {prevLec.titulo}
                  </button>
                )}
                {nextLec && (
                  <button className="cp-nav-btn next" onClick={() => setLeccion(nextLec)}>
                    {nextLec.titulo} →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9E8E80', fontSize: 14 }}>
              Selecciona una lección del menú para comenzar.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
