import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';

import { getLevel } from '../gamification';

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

export default function Miembros() {
  const [miembros, setMiembros]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');

  useEffect(() => { loadMiembros(); }, []);

  async function loadMiembros() {
    setLoading(true);
    try {
      // 1. Get all profiles
      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombre, apellido, bio, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (!perfiles?.length) { setMiembros([]); return; }

      // 2. Get post counts per user
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, usuario_id');

      const postsByUser = {};
      const allPostIds = [];
      (postsData || []).forEach(p => {
        postsByUser[p.usuario_id] = (postsByUser[p.usuario_id] || []);
        postsByUser[p.usuario_id].push(p.id);
        allPostIds.push(p.id);
      });

      // 3. Get total likes per post
      const likesByPost = {};
      if (allPostIds.length > 0) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', allPostIds);
        (likesData || []).forEach(l => {
          likesByPost[l.post_id] = (likesByPost[l.post_id] || 0) + 1;
        });
      }

      // 4. Calculate points for each user
      const enriched = perfiles.map(p => {
        const userPostIds = postsByUser[p.id] || [];
        const postCount = userPostIds.length;
        const likesReceived = userPostIds.reduce((sum, pid) => sum + (likesByPost[pid] || 0), 0);
        const points = postCount * 2 + likesReceived * 5;
        return { ...p, postCount, likesReceived, points, levelInfo: getLevel(points) };
      });

      // Sort by points desc
      enriched.sort((a, b) => b.points - a.points);
      setMiembros(enriched);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return miembros;
    const q = query.toLowerCase();
    return miembros.filter(m =>
      `${m.nombre} ${m.apellido}`.toLowerCase().includes(q) ||
      (m.bio || '').toLowerCase().includes(q)
    );
  }, [miembros, query]);

  return (
    <div className="miembros-wrap">
      <div className="miembros-header-row">
        <h2 className="miembros-title">Directorio de Alquimistas</h2>
        <div className="miembros-search-wrap">
          <Search size={15} />
          <input
            type="text"
            placeholder="Buscar miembro…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="miembros-search-input"
          />
        </div>
      </div>

      {loading ? (
        <p className="miembros-loading">Cargando miembros…</p>
      ) : filtered.length === 0 ? (
        <p className="miembros-loading">Sin resultados.</p>
      ) : (
        <div className="miembros-grid">
          {filtered.map((m, i) => (
            <Link key={m.id} to={`/perfil/${m.id}`} className="miembro-card">
              {/* Rank */}
              {i < 3 && (
                <span className="miembro-rank" style={{ background: ['#FFD700','#C0C0C0','#CD7F32'][i] }}>
                  #{i + 1}
                </span>
              )}

              {/* Avatar + level badge */}
              <div className="miembro-avatar-wrap">
                <img src={m.avatar_url || DEFAULT_AVATAR} alt={m.nombre} className="miembro-avatar" />
                <span className="miembro-level-dot" style={{ background: m.levelInfo.color }}>
                  {m.levelInfo.level}
                </span>
              </div>

              {/* Info */}
              <p className="miembro-nombre">{m.nombre} {m.apellido}</p>
              <p className="miembro-level-name" style={{ color: m.levelInfo.color }}>
                Nivel {m.levelInfo.level} · {m.levelInfo.name}
              </p>
              {m.bio && <p className="miembro-bio">{m.bio}</p>}

              {/* Stats */}
              <div className="miembro-stats">
                <span>📝 {m.postCount}</span>
                <span>👍 {m.likesReceived}</span>
                <span className="miembro-pts" style={{ color: m.levelInfo.color }}>
                  {m.points} pts
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
