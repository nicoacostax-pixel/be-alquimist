import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';

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
  const [cursos,   setCursos]   = useState([]);
  const [accesos,  setAccesos]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [token,    setToken]    = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const tok = session?.access_token;
      setToken(tok);

      // Fetch published courses from Supabase directly (public read)
      const { data: rows } = await supabase
        .from('cursos')
        .select('id, slug, titulo, descripcion, imagen_url')
        .eq('publicado', true)
        .order('created_at', { ascending: false });

      const lista = rows || [];
      setCursos(lista);

      // Check enrollment status for each course
      if (tok && lista.length) {
        const checks = await Promise.all(
          lista.map(c => api('checkAcceso', { cursoId: c.id }, tok))
        );
        const map = {};
        lista.forEach((c, i) => { map[c.id] = checks[i]?.tieneAcceso || false; });
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
        Accede a los cursos, aprende a tu ritmo.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {cursos.map(curso => {
          const tieneAcceso = accesos[curso.id];
          return (
            <div
              key={curso.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid #EDE0D4',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 12px rgba(74,63,53,0.06)',
                transition: 'box-shadow 0.2s',
              }}
            >
              {/* Cover image */}
              <div style={{ background: '#F3EFE8', aspectRatio: '16/9', overflow: 'hidden' }}>
                {curso.imagen_url ? (
                  <img
                    src={curso.imagen_url}
                    alt={curso.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                    🕯️
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#4A3F35', margin: '0 0 8px', lineHeight: 1.3 }}>
                  {curso.titulo}
                </h2>
                {curso.descripcion && (
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
                    onClick={() => navigate(`/cursos/${curso.slug}/aprender`)}
                    style={{
                      marginLeft: 'auto',
                      background: tieneAcceso ? '#4A3F35' : '#B08968',
                      color: '#fff', border: 'none', borderRadius: 30,
                      padding: '9px 20px', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {tieneAcceso ? 'Continuar →' : 'Ver curso →'}
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
