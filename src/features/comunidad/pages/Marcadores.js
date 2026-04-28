import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Settings, HelpCircle } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { LEVELS, getLevel, calcPts } from '../gamification';

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
const RANK_COLORS    = ['#FFD700', '#C0C0C0', '#CD7F32'];

// ── SVG Level Ring ────────────────────────────────────────────────────────────
function LevelRing({ pct, color, size = 130, children }) {
  const r    = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E8E8" strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      {children}
    </div>
  );
}

// ── Leaderboard panel ─────────────────────────────────────────────────────────
function LeaderPanel({ title, members, ptsKey, showPlus }) {
  const visible = members.filter(m => (m[ptsKey] || 0) > 0);
  return (
    <div className="marc-leader-card">
      <h3 className="marc-leader-title">{title}</h3>
      {visible.length === 0 ? (
        <p className="marc-leader-empty">Sin actividad en este período.</p>
      ) : (
        <div className="marc-leader-list">
          {visible.map((m, i) => (
            <Link key={m.id} to={`/perfil/${m.id}`} className="marc-leader-row">
              {i < 3 ? (
                <div className="marc-medal" style={{ background: RANK_COLORS[i] }}>{i + 1}</div>
              ) : (
                <span className="marc-rank-num">{i + 1}</span>
              )}
              <img src={m.avatar_url || DEFAULT_AVATAR} alt={m.nombre} className="marc-leader-avatar" />
              <span className="marc-leader-name">{m.nombre} {m.apellido || ''}</span>
              <span className="marc-leader-pts" style={{ color: m.levelInfo.color }}>
                {showPlus && '+'}{m[ptsKey]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Marcadores() {
  const [loading, setLoading]       = useState(true);
  const [me, setMe]                 = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [updatedAt, setUpdatedAt]   = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;

      const [{ data: perfiles }, { data: allPosts }, { data: allLikes }] = await Promise.all([
        supabase.from('perfiles').select('id, nombre, apellido, avatar_url'),
        supabase.from('posts').select('id, usuario_id, created_at'),
        supabase.from('post_likes').select('post_id'),
      ]);

      const postOwner = {};
      (allPosts || []).forEach(p => { postOwner[p.id] = p.usuario_id; });

      const likesAllTime = {};
      (allLikes || []).forEach(l => {
        const owner = postOwner[l.post_id];
        if (owner) likesAllTime[owner] = (likesAllTime[owner] || 0) + 1;
      });

      const now = Date.now();
      const postsAll = {}, posts30 = {}, posts7 = {};
      (allPosts || []).forEach(p => {
        const o = p.usuario_id;
        postsAll[o] = (postsAll[o] || 0) + 1;
        const age = now - new Date(p.created_at).getTime();
        if (age <= 30 * 864e5) posts30[o] = (posts30[o] || 0) + 1;
        if (age <= 7  * 864e5) posts7[o]  = (posts7[o]  || 0) + 1;
      });

      const enriched = (perfiles || []).map(p => {
        const postCount = postsAll[p.id] || 0;
        const likes     = likesAllTime[p.id] || 0;
        const points    = calcPts(postCount, likes);
        const pts30     = calcPts(posts30[p.id] || 0, 0);
        const pts7      = calcPts(posts7[p.id]  || 0, 0);
        return { ...p, points, pts30, pts7, levelInfo: getLevel(points) };
      });

      setAllMembers(enriched);
      if (uid) setMe(enriched.find(m => m.id === uid) || null);
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  }

  const leaderAllTime = useMemo(() => [...allMembers].sort((a, b) => b.points - a.points).slice(0, 10), [allMembers]);
  const leader30      = useMemo(() => [...allMembers].sort((a, b) => b.pts30   - a.pts30  ).slice(0, 10), [allMembers]);
  const leader7       = useMemo(() => [...allMembers].sort((a, b) => b.pts7    - a.pts7   ).slice(0, 10), [allMembers]);

  const levelCounts = useMemo(() => {
    const c = {};
    LEVELS.forEach(l => { c[l.level] = 0; });
    allMembers.forEach(m => { c[m.levelInfo.level] = (c[m.levelInfo.level] || 0) + 1; });
    return c;
  }, [allMembers]);

  const totalMembers = allMembers.length || 1;
  const myInfo       = me?.levelInfo || LEVELS[0];
  const myNextLevel  = LEVELS.find(l => l.level === myInfo.level + 1);
  const myPtsToNext  = myNextLevel ? myNextLevel.min - (me?.points || 0) : 0;
  const myProgress   = myNextLevel
    ? Math.min(100, Math.round(((me?.points || 0) - myInfo.min) / (myNextLevel.min - myInfo.min) * 100))
    : 100;

  if (loading) return <div className="loading-state">Cargando marcadores…</div>;

  return (
    <div className="marc-wrap">

      {/* ── Top: user card + levels ── */}
      <div className="marc-top">

        {/* User card */}
        <div className="marc-user-card">
          <Link to="/cuenta" className="marc-settings-link" title="Editar perfil">
            <Settings size={17} />
          </Link>

          <div className="marc-ring-wrap">
            <LevelRing pct={myProgress} color={myInfo.color}>
              <img
                src={me?.avatar_url || DEFAULT_AVATAR}
                alt={me?.nombre || 'Alquimista'}
                className="marc-user-avatar"
              />
              <div className="marc-user-badge" style={{ background: myInfo.color }}>
                {myInfo.level}
              </div>
            </LevelRing>
          </div>

          <h3 className="marc-user-name">
            {me ? (`${me.nombre || ''} ${me.apellido || ''}`).trim() || 'Alquimista' : 'Alquimista'}
          </h3>
          <p className="marc-user-level-text" style={{ color: myInfo.color }}>
            Nivel {myInfo.level}
          </p>
          {myNextLevel ? (
            <p className="marc-user-ptsup">
              <strong style={{ color: myInfo.color }}>{myPtsToNext}</strong>{' '}
              puntos para subir de nivel
              <HelpCircle size={13} className="marc-help-icon" />
            </p>
          ) : (
            <p className="marc-user-ptsup" style={{ color: myInfo.color }}>
              ¡Nivel máximo alcanzado! 👑
            </p>
          )}
        </div>

        {/* Levels list */}
        <div className="marc-levels-card">
          <div className="marc-levels-grid">
            {LEVELS.map(lvl => {
              const unlocked  = (me?.points || 0) >= lvl.min;
              const isCurrent = myInfo.level === lvl.level;
              const pct       = Math.round((levelCounts[lvl.level] / totalMembers) * 100);
              return (
                <div
                  key={lvl.level}
                  className={`marc-lvl-row ${isCurrent ? 'is-current' : ''} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                >
                  <div
                    className="marc-lvl-circle"
                    style={{
                      background: unlocked ? lvl.color : '#EEEEEE',
                      color:      unlocked ? '#fff'    : '#BDBDBD',
                      boxShadow:  isCurrent ? `0 0 0 3px ${lvl.color}40` : 'none',
                    }}
                  >
                    {unlocked ? lvl.level : <Lock size={12} />}
                  </div>

                  <div className="marc-lvl-body">
                    <span className="marc-lvl-name">Nivel {lvl.level}</span>
                    {lvl.unlocks.length > 0 && (
                      <p className="marc-lvl-unlocks">
                        Desbloquea{' '}
                        {lvl.unlocks.map((u, i) => (
                          <span key={i}>
                            <span
                              className="marc-unlock-chip"
                              style={{ color: unlocked ? '#2D3461' : '#BDBDBD' }}
                            >
                              "{u}"
                            </span>
                            {i < lvl.unlocks.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    )}
                    <span className="marc-lvl-pct">{pct}% de miembros</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {updatedAt && (
        <p className="marc-updated">
          Última actualización:{' '}
          {updatedAt.toLocaleDateString('es-MX', {
            month: 'long', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}

      {/* ── Leaderboards ── */}
      <div className="marc-leaders-row">
        <LeaderPanel title="Leaderboard (7 días)"         members={leader7}       ptsKey="pts7"   showPlus />
        <LeaderPanel title="Leaderboard (30 días)"        members={leader30}      ptsKey="pts30"  showPlus />
        <LeaderPanel title="Leaderboard (todo el tiempo)" members={leaderAllTime} ptsKey="points" />
      </div>
    </div>
  );
}
