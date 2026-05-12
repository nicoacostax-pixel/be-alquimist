import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import { LEVELS, getLevel } from '../gamification';

async function api(action, data, token) {
  const res = await fetch('/api/cursos-lms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...data }),
  });
  return res.json();
}

export default function CursosComunidad() {
  const navigate = useNavigate();
  const [cursos,     setCursos]     = useState([]);
  const [accesos,    setAccesos]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [token,      setToken]      = useState(null);
  const [userLevel,  setUserLevel]  = useState(1);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const tok = session?.access_token;
      const uid = session?.user?.id;
      setToken(tok);

      const [{ data: rows }, perfilRes] = await Promise.all([
        supabase.from('cursos')
          .select('id, slug, titulo, descripcion, imagen_url, nivel_requerido')
          .eq('publicado', true)
          .order('orden')
          .order('created_at', { ascending: false }),
        uid ? supabase.from('perfiles').select('puntos').eq('id', uid).single() : Promise.resolve({ data: null }),
      ]);

      const lista = rows || [];
      setCursos(lista);

      const nivel = getLevel(perfilRes.data?.puntos || 0).level;
      setUserLevel(nivel);

      if (tok && lista.length) {
        const checks = await Promise.all(
          lista.map(c => api('checkAcceso', { cursoId: c.id }, tok))
        );
        const map = {};
        lista.forEach((c, i) => { map[c.id] = checks[i]; });
        setAccesos(map);
      }

      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9E8E80', fontFamily: 'Poppins, sans-serif' }}>
      Cargando cursos…
    </div>
  );

  if (!cursos.length) return (
    <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
      <p style={{ fontSize: 48, margin: '0 0 16px' }}>📚</p>
      <p style={{ color: '#9E8E80', fontSize: 15 }}>Pronto habrá cursos disponibles aquí.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#4A3F35', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>
        Cursos disponibles
      </h1>
      <p style={{ color: '#9E8E80', fontSize: 14, margin: '0 0 28px' }}>
        Aprende a tu ritmo · Tu nivel actual:{' '}
        <strong style={{ color: getLevel(0).color }}>
          {LEVELS.find(l => l.level === userLevel)?.name || 'Semilla'}
        </strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {cursos.map(curso => {
          const nivelReq    = curso.nivel_requerido || 1;
          const locked      = userLevel < nivelReq;
          const acceso      = accesos[curso.id];
          const tieneAcceso = acceso?.tieneAcceso || false;
          const lvlInfo     = LEVELS.find(l => l.level === nivelReq) || LEVELS[0];

          return (
            <div
              key={curso.id}
              style={{
                background: '#fff', borderRadius: 16, overflow: 'hidden',
                border: '1px solid #EDE0D4', display: 'flex', flexDirection: 'column',
                boxShadow: '0 2px 12px rgba(74,63,53,0.06)',
                opacity: locked ? 0.8 : 1,
              }}
            >
              {/* Cover */}
              <div style={{ background: '#F3EFE8', aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                {curso.imagen_url ? (
                  <img
                    src={curso.imagen_url}
                    alt={curso.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: locked ? 'grayscale(50%)' : 'none' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                    🕯️
                  </div>
                )}
                {locked && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(30,20,10,0.50)', gap: 8,
                  }}>
                    <span style={{ fontSize: 30 }}>🔒</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: lvlInfo.color, padding: '4px 14px', borderRadius: 20 }}>
                      Nivel {nivelReq} — {lvlInfo.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#4A3F35', margin: '0 0 8px', lineHeight: 1.3 }}>
                  {curso.titulo}
                </h2>

                {locked ? (
                  <p style={{ fontSize: 13, color: '#9E8E80', lineHeight: 1.6, margin: '0 0 16px', flex: 1 }}>
                    Alcanza el nivel <strong style={{ color: lvlInfo.color }}>{lvlInfo.name}</strong> para desbloquear este curso.
                  </p>
                ) : curso.descripcion && (
                  <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6, margin: '0 0 16px', flex: 1 }}>
                    {curso.descripcion.length > 100 ? curso.descripcion.slice(0, 100) + '…' : curso.descripcion}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: 10 }}>
                  {tieneAcceso && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2E7D32', background: '#E8F5E9', padding: '3px 10px', borderRadius: 20 }}>
                      ✓ Con acceso
                    </span>
                  )}
                  <button
                    onClick={() => !locked && navigate(`/cursos/${curso.slug}/aprender`)}
                    disabled={locked}
                    style={{
                      marginLeft: 'auto',
                      background: locked ? '#D0C8BF' : tieneAcceso ? '#4A3F35' : '#B08968',
                      color: '#fff', border: 'none', borderRadius: 30,
                      padding: '9px 20px', fontSize: 13, fontWeight: 700,
                      cursor: locked ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {locked ? '🔒 Bloqueado' : tieneAcceso ? 'Continuar →' : 'Ver curso →'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
