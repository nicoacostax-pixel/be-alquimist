import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Menu, ShoppingCart, Search, Clock, Calendar, MessageCircle, UserPlus, ThumbsUp } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useCart } from '../../../shared/context/CartContext';
import SidebarMenu from '../../catalog/components/SidebarMenu';
import CartSidebar from '../../../shared/components/CartSidebar';
import '../../../App.css';

import { LEVELS, getLevel } from '../gamification';
import AttachmentToolbar from '../components/AttachmentToolbar';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d >= 30) return `${Math.floor(d / 30)}mes`;
  if (d > 0) return `hace ${d}d`;
  if (h > 0) return `hace ${h}h`;
  if (m > 0) return `hace ${m}m`;
  return 'ahora';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${MONTHS_ES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function toHandle(nombre = '', apellido = '', id = '') {
  const slug = `${nombre}-${apellido}`
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `@${slug}-${id.slice(0, 4)}`;
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
function buildWeeks(posts) {
  const counts = {};
  posts.forEach(p => {
    if (p.created_at) counts[p.created_at.slice(0, 10)] = (counts[p.created_at.slice(0, 10)] || 0) + 1;
  });

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  // Start on the Monday 52 weeks ago
  const base = new Date(today);
  base.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
  base.setDate(base.getDate() - 51 * 7);

  const weeks = [];
  let cur = new Date(base);
  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const key = cur.toISOString().slice(0, 10);
      week.push({ date: key, count: key <= todayStr ? (counts[key] || 0) : -1 });
      cur = new Date(cur); cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function Heatmap({ posts }) {
  const weeks = useMemo(() => buildWeeks(posts), [posts]);
  const maxCount = Math.max(1, ...weeks.flat().map(c => c.count).filter(c => c >= 0));

  const intensity = (c) => {
    if (c < 0) return -1;
    if (c === 0) return 0;
    return Math.min(4, Math.ceil((c / maxCount) * 4));
  };

  const monthLabels = weeks.map(week => {
    for (const day of week) {
      if (day.date.slice(8) === '01') return MONTHS_ES[+day.date.slice(5, 7) - 1];
    }
    return null;
  });

  return (
    <div className="heatmap-outer">
      <div className="heatmap-wrap">
        {/* Month labels */}
        <div className="heatmap-months">
          <div className="heatmap-day-spacer" />
          {weeks.map((_, wi) => (
            <div key={wi} className="heatmap-month-slot">
              {monthLabels[wi] && <span>{monthLabels[wi]}</span>}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="heatmap-body">
          <div className="heatmap-day-col">
            {['Lun', '', 'Mié', '', 'Vie', '', 'Dom'].map((label, i) => (
              <div key={i} className="heatmap-day-row">{label}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-week-col">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`hm-cell ${intensity(day.count) >= 0 ? `hm-i${intensity(day.count)}` : 'hm-future'}`}
                  title={day.count >= 0 ? `${day.date}: ${day.count} publicación${day.count !== 1 ? 'es' : ''}` : ''}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map(i => <div key={i} className={`hm-cell hm-i${i}`} />)}
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}

// ── SVG Level Ring (around avatar) ───────────────────────────────────────────
function LevelRing({ pct, color, size = 116, children }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="lvl-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E5E5" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

export default function PerfilUsuario() {
  const { userId } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen]       = useState(false);
  const [searchTerm, setSearchTerm]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults]     = useState(false);
  const searchRef = useRef(null);
  const { cartCount } = useCart();

  const [perfil, setPerfil]         = useState(null);
  const [posts, setPosts]           = useState([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [expandedPost, setExpandedPost]     = useState(null);
  const [comentariosMap, setComentariosMap] = useState({});
  const [nuevoComentario, setNuevoComentario]       = useState('');
  const [subiendoComentario, setSubiendoComentario] = useState(false);

  // Comment toolbar state
  const [comentPanel, setComentPanel]               = useState(null);
  const [comentLink, setComentLink]                 = useState('');
  const [comentVideo, setComentVideo]               = useState('');
  const [comentPoll, setComentPoll]                 = useState(['', '']);
  const [comentImagenFile, setComentImagenFile]     = useState(null);
  const [comentImagenPreview, setComentImagenPreview] = useState('');
  const comentFileRef     = useRef(null);
  const comentTextareaRef = useRef(null);

  // Live search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        const { data } = await supabase.from('productos')
          .select('nombre, imagen_url, categoria, slug, variantes')
          .ilike('nombre', `%${searchTerm}%`).limit(6);
        setSearchResults(data || []);
        setShowResults(true);
      } else { setSearchResults([]); setShowResults(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCurrentUserId(session.user.id);
    });
  }, []);

  useEffect(() => { if (userId) loadProfile(); }, [userId]);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;

      const [perfilesRes, postsRes] = await Promise.all([
        supabase.from('perfiles').select('id, nombre, apellido, bio, avatar_url').in('id', [userId]),
        supabase.from('posts').select('id, titulo, contenido, imagen_url, metadata, created_at').eq('usuario_id', userId).order('created_at', { ascending: false }),
      ]);
      if (perfilesRes.error) console.error('perfiles query error:', perfilesRes.error);
      const perfilData = perfilesRes.data?.[0] || null;

      const userPosts = postsRes.data || [];
      let totalLikesCount = 0;

      if (userPosts.length > 0) {
        const postIds = userPosts.map(p => p.id);
        const [{ data: likesData }, { data: commentsData }] = await Promise.all([
          supabase.from('post_likes').select('post_id, usuario_id').in('post_id', postIds),
          supabase.from('post_comentarios').select('post_id').in('post_id', postIds),
        ]);

        const likesPerPost = {};
        const userLikedSet = new Set();
        (likesData || []).forEach(l => {
          likesPerPost[l.post_id] = (likesPerPost[l.post_id] || 0) + 1;
          totalLikesCount++;
          if (uid && l.usuario_id === uid) userLikedSet.add(l.post_id);
        });

        const commentsCount = {};
        (commentsData || []).forEach(c => {
          commentsCount[c.post_id] = (commentsCount[c.post_id] || 0) + 1;
        });

        userPosts.forEach(p => {
          p._likes            = likesPerPost[p.id] || 0;
          p._userLiked        = userLikedSet.has(p.id);
          p._comentariosCount = commentsCount[p.id] || 0;
        });
      }

      // If no perfiles row exists, auto-create it for the logged-in user
      let resolvedPerfil = perfilData;
      if (!resolvedPerfil && uid === userId) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const newRow = {
          id: userId,
          nombre: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || '',
          apellido: '',
          bio: '',
          avatar_url: authUser?.user_metadata?.avatar_url || '',
        };
        await supabase.from('perfiles').upsert(newRow);
        resolvedPerfil = { ...newRow, created_at: authUser?.created_at || null };
      }
      setPerfil(resolvedPerfil || { id: userId, nombre: 'Alquimista', apellido: '', bio: '', avatar_url: '', created_at: null });
      setPosts(userPosts);
      setTotalLikes(totalLikesCount);
    } catch (err) {
      console.error('loadProfile error:', err);
    } finally {
      setLoading(false);
    }
  }

  /* ── Like toggle ── */
  async function toggleLike(postId) {
    if (!currentUserId) { alert('Debes estar logueado para dar like'); return; }
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p, _likes: p._userLiked ? p._likes - 1 : p._likes + 1, _userLiked: !p._userLiked,
    }));
    if (post._userLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('usuario_id', currentUserId);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, usuario_id: currentUserId });
    }
  }

  /* ── Comments ── */
  async function fetchComentarios(postId) {
    const { data: comentarios } = await supabase
      .from('post_comentarios').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    const userIds = [...new Set((comentarios || []).map(c => c.usuario_id).filter(Boolean))];
    let perfilMap = {};
    if (userIds.length > 0) {
      const { data: perfs } = await supabase.from('perfiles').select('id, nombre, avatar_url').in('id', userIds);
      (perfs || []).forEach(p => { perfilMap[p.id] = p; });
    }
    setComentariosMap(prev => ({
      ...prev,
      [postId]: (comentarios || []).map(c => ({ ...c, _perfil: perfilMap[c.usuario_id] || null })),
    }));
  }

  async function toggleComentarios(postId) {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    setNuevoComentario('');
    setComentPanel(null);
    setComentLink(''); setComentVideo('');
    setComentPoll(['', '']);
    setComentImagenFile(null); setComentImagenPreview('');
    if (comentFileRef.current) comentFileRef.current.value = '';
    await fetchComentarios(postId);
  }

  async function uploadImagen(file) {
    const ext      = file.name.split('.').pop();
    const filePath = `${currentUserId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('posts').upload(filePath, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath);
    return publicUrl;
  }

  function buildMetadata(link, video, poll) {
    function extractYoutubeId(url) {
      const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return m ? m[1] : null;
    }
    const videoId = video.trim() ? extractYoutubeId(video.trim()) : null;
    const meta = {
      ...(link.trim()  ? { link: link.trim() }   : {}),
      ...(videoId      ? { video_id: videoId }    : {}),
      ...(poll.some(o => o.trim()) ? {
        poll: { opciones: poll.filter(o => o.trim()), votos: [] }
      } : {}),
    };
    return Object.keys(meta).length ? meta : null;
  }

  function makeEmojiInserter(getText, setText, ref) {
    return (emoji) => {
      const el = ref.current;
      if (!el) { setText(t => t + emoji); return; }
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      setText(getText().slice(0, start) + emoji + getText().slice(end));
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + emoji.length; el.focus(); }, 0);
    };
  }

  async function agregarComentario(e, postId) {
    e.preventDefault();
    if (!nuevoComentario.trim() || !currentUserId) return;
    setSubiendoComentario(true);
    try {
      const imagen_url = comentImagenFile ? await uploadImagen(comentImagenFile) : null;
      const metadata   = buildMetadata(comentLink, comentVideo, comentPoll);
      const { error } = await supabase.from('post_comentarios').insert({
        post_id: postId, usuario_id: currentUserId,
        contenido: nuevoComentario.trim(), imagen_url, metadata,
      });
      if (!error) {
        setNuevoComentario('');
        setComentLink(''); setComentVideo(''); setComentPoll(['', '']);
        setComentImagenFile(null); setComentImagenPreview('');
        setComentPanel(null);
        if (comentFileRef.current) comentFileRef.current.value = '';
        await fetchComentarios(postId);
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, _comentariosCount: p._comentariosCount + 1 } : p));
      }
    } catch (err) {
      console.error('agregarComentario error:', err);
    } finally {
      setSubiendoComentario(false);
    }
  }

  // Gamification calculations
  const points      = useMemo(() => posts.length * 2 + totalLikes * 5, [posts, totalLikes]);
  const levelInfo   = useMemo(() => getLevel(points), [points]);
  const nextLevel   = useMemo(() => LEVELS.find(l => l.level === levelInfo.level + 1), [levelInfo]);
  const ptsToNext   = nextLevel ? nextLevel.min - points : 0;
  const progressPct = useMemo(() => {
    if (!nextLevel) return 100;
    const range = nextLevel.min - levelInfo.min;
    return Math.min(100, Math.round(((points - levelInfo.min) / range) * 100));
  }, [points, levelInfo, nextLevel]);

  const handle   = useMemo(() => perfil ? toHandle(perfil.nombre, perfil.apellido, perfil.id) : '', [perfil]);
  const lastPost = posts[0]?.created_at;

  if (loading) return <div className="loading-state">Cargando perfil…</div>;

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartSidebar isOpen={isCartOpen}   onClose={() => setIsCartOpen(false)} />

      {/* ── Header ── */}
      <header className="app-header-premium insumos-header">
        <div className="insumos-mobile-top">
          <button className="header-icon-btn" onClick={() => setIsSidebarOpen(true)} type="button">
            <Menu size={22} color="#B08968" />
          </button>
          <Link to="/" className="logo-link"><div className="app-logo-small">Be Alquimist</div></Link>
          <div className="cart-icon-wrapper">
            <button className="header-icon-btn" onClick={() => setIsCartOpen(true)} type="button">
              <ShoppingCart size={23} color="#4A3F35" />
            </button>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
        </div>

        <div className="header-search-row insumos-search-wrap insumos-mobile-search" ref={searchRef}>
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar insumo..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} className="search-input-premium"
              onFocus={() => searchTerm.length > 2 && setShowResults(true)} />
            {showResults && <SearchDrop results={searchResults} onClose={() => { setShowResults(false); setSearchTerm(''); }} />}
          </div>
        </div>

        <div className="insumos-desktop-top">
          <div className="insumos-left-group">
            <button className="header-icon-btn" onClick={() => setIsSidebarOpen(true)} type="button">
              <Menu size={22} color="#B08968" />
            </button>
            <Link to="/" className="logo-link insumos-logo-wrap"><div className="app-logo-small">Be Alquimist</div></Link>
          </div>
          <div className="header-search-row insumos-search-wrap" ref={searchRef}>
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Buscar insumo..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="search-input-premium"
                onFocus={() => searchTerm.length > 2 && setShowResults(true)} />
              {showResults && <SearchDrop results={searchResults} onClose={() => { setShowResults(false); setSearchTerm(''); }} />}
            </div>
          </div>
          <div className="header-top-row insumos-actions-wrap">
            <div className="cart-icon-wrapper">
              <button className="header-icon-btn" onClick={() => setIsCartOpen(true)} type="button">
                <ShoppingCart size={24} color="#4A3F35" />
              </button>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="perfil-main">
        <div className="perfil-layout">

          {/* LEFT: Activity + Posts */}
          <div className="perfil-left">

            {/* Activity Heatmap */}
            <div className="perfil-card">
              <h3 className="perfil-card-title">Actividad</h3>
              <Heatmap posts={posts} />
            </div>

            {/* Posts list */}
            <div className="perfil-card" style={{ marginTop: '16px' }}>
              <h3 className="perfil-card-title">{posts.length} publicaciones</h3>

              {posts.length === 0 ? (
                <p className="perfil-empty-msg">Aún no hay publicaciones.</p>
              ) : (
                <div className="perfil-posts-list">
                  {posts.slice(0, 10).map(post => {
                    const meta = post.metadata ? (typeof post.metadata === 'string' ? JSON.parse(post.metadata) : post.metadata) : {};
                    return (
                      <div key={post.id} className="perfil-post-item">
                        <div className="perfil-post-top">
                          <img src={perfil?.avatar_url || DEFAULT_AVATAR} alt="" className="perfil-post-avatar" />
                          <div className="perfil-post-author-wrap">
                            <span className="perfil-post-author-name">
                              {(perfil?.nombre || '') + (perfil?.apellido ? ' ' + perfil.apellido : '') || 'Alquimista'}
                            </span>
                            <span
                              className="perfil-level-chip"
                              style={{ background: levelInfo.color }}
                              title={levelInfo.name}
                            >
                              {levelInfo.level}
                            </span>
                            <span className="perfil-post-time"> · {timeAgo(post.created_at)}</span>
                          </div>
                        </div>

                        <div className="perfil-post-body">
                          {post.imagen_url && <img src={post.imagen_url} alt="" className="perfil-post-thumb" />}
                          {post.titulo    && <p className="perfil-post-titulo">{post.titulo}</p>}
                          {post.contenido && <p className="perfil-post-text">{post.contenido}</p>}
                          {meta.link && (
                            <a href={meta.link} target="_blank" rel="noreferrer" className="perfil-link-card">
                              🔗 {meta.link}
                            </a>
                          )}
                          {meta.video_id && (
                            <iframe
                              className="perfil-video-embed"
                              src={`https://www.youtube.com/embed/${meta.video_id}`}
                              allowFullScreen title="video"
                            />
                          )}
                        </div>

                        {/* ── Actions ── */}
                        <div className="post-actions-row">
                          <button
                            className={`post-action-btn${post._userLiked ? ' liked' : ''}`}
                            onClick={() => toggleLike(post.id)}
                          >
                            <ThumbsUp size={15} /><span>{post._likes || 0}</span>
                          </button>
                          <button
                            className={`post-action-btn${expandedPost === post.id ? ' active' : ''}`}
                            onClick={() => toggleComentarios(post.id)}
                          >
                            <MessageCircle size={15} /><span>{post._comentariosCount || 0}</span>
                          </button>
                        </div>

                        {/* ── Comments section ── */}
                        {expandedPost === post.id && (
                          <div className="post-comments-section">
                            {(comentariosMap[post.id] || []).map(c => (
                              <div key={c.id} className="post-comment-item">
                                <Link to={`/perfil/${c.usuario_id}`} className="post-author-link">
                                  {c._perfil?.avatar_url
                                    ? <img src={c._perfil.avatar_url} alt={c._perfil.nombre} className="post-avatar" style={{ width: 28, height: 28 }} />
                                    : <div className="post-avatar-placeholder" style={{ width: 28, height: 28, fontSize: 12 }}>{(c._perfil?.nombre || '?').charAt(0).toUpperCase()}</div>
                                  }
                                </Link>
                                <div className="post-comment-body">
                                  <Link to={`/perfil/${c.usuario_id}`} className="post-author-name post-author-link">
                                    {c._perfil?.nombre || 'Alquimista'}
                                  </Link>
                                  <span className="post-meta"> · {timeAgo(c.created_at)}</span>
                                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#444' }}>{c.contenido}</p>
                                </div>
                              </div>
                            ))}

                            {currentUserId && (
                              <form onSubmit={e => agregarComentario(e, post.id)} style={{ marginTop: 8 }}>
                                <textarea
                                  ref={comentTextareaRef}
                                  className="premium-input-field"
                                  placeholder="Escribe un comentario..."
                                  value={nuevoComentario}
                                  onChange={e => setNuevoComentario(e.target.value)}
                                  style={{ minHeight: 70, resize: 'none', fontSize: 13 }}
                                />
                                <AttachmentToolbar
                                  panelActivo={comentPanel}         setPanelActivo={setComentPanel}
                                  linkInput={comentLink}            setLinkInput={setComentLink}
                                  videoInput={comentVideo}          setVideoInput={setComentVideo}
                                  pollOpciones={comentPoll}         setPollOpciones={setComentPoll}
                                  imagenFile={comentImagenFile}     imagenPreview={comentImagenPreview}
                                  onImagenChange={e => {
                                    const f = e.target.files[0];
                                    if (!f) return;
                                    setComentImagenFile(f);
                                    setComentImagenPreview(URL.createObjectURL(f));
                                    setComentPanel(null);
                                  }}
                                  onQuitarImagen={() => {
                                    setComentImagenFile(null); setComentImagenPreview('');
                                    if (comentFileRef.current) comentFileRef.current.value = '';
                                  }}
                                  onInsertEmoji={makeEmojiInserter(() => nuevoComentario, setNuevoComentario, comentTextareaRef)}
                                  fileInputRef={comentFileRef}     textareaRef={comentTextareaRef}
                                  submitLabel="Comentar"           submitDisabled={subiendoComentario}
                                  compact
                                />
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Profile card */}
          <aside className="perfil-right">
            <div className="perfil-card perfil-info-card">

              {/* Avatar + level ring */}
              <div className="perfil-avatar-center">
                <LevelRing pct={progressPct} color={levelInfo.color}>
                  <img
                    src={perfil.avatar_url || DEFAULT_AVATAR}
                    alt={perfil.nombre}
                    className="perfil-avatar-img"
                  />
                  <div className="perfil-badge-num" style={{ background: levelInfo.color }}>
                    {levelInfo.level}
                  </div>
                </LevelRing>
              </div>

              {/* Level label + XP bar */}
              <p className="perfil-level-label" style={{ color: levelInfo.color }}>
                Nivel {levelInfo.level} — {levelInfo.name}
              </p>
              {nextLevel && (
                <div className="perfil-xp">
                  <div className="perfil-xp-track">
                    <div className="perfil-xp-fill" style={{ width: `${progressPct}%`, background: levelInfo.color }} />
                  </div>
                  <span className="perfil-xp-hint">{ptsToNext} pts para nivel {nextLevel.level}</span>
                </div>
              )}

              {/* Name + handle */}
              <h2 className="perfil-nombre">{perfil.nombre} {perfil.apellido}</h2>
              <p className="perfil-handle">{handle}</p>

              {/* Bio */}
              {perfil.bio && <p className="perfil-bio">{perfil.bio}</p>}

              {/* Meta */}
              <div className="perfil-meta">
                {lastPost && (
                  <div className="perfil-meta-row">
                    <Clock size={13} />
                    <span>Activo {timeAgo(lastPost)}</span>
                  </div>
                )}
                {perfil.created_at && (
                  <div className="perfil-meta-row">
                    <Calendar size={13} />
                    <span>Unido {formatDate(perfil.created_at)}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="perfil-stats">
                <div className="perfil-stat">
                  <strong>{posts.length}</strong>
                  <span>Posts</span>
                </div>
                <div className="perfil-stat">
                  <strong>{totalLikes}</strong>
                  <span>Likes</span>
                </div>
                <div className="perfil-stat">
                  <strong>{points}</strong>
                  <span>Puntos</span>
                </div>
              </div>

              {/* Actions (other user only) */}
              {currentUserId && currentUserId !== userId && (
                <div className="perfil-actions">
                  <button className="perfil-btn perfil-btn-follow">
                    <UserPlus size={15} /> Seguir
                  </button>
                  <button className="perfil-btn perfil-btn-chat">
                    <MessageCircle size={15} /> Chat
                  </button>
                </div>
              )}
            </div>

            {/* Puntos totales card */}
            <div className="perfil-card perfil-pts-card" style={{ marginTop: '12px' }}>
              <p className="perfil-pts-title">Puntos de alquimia</p>
              <p className="perfil-pts-value" style={{ color: levelInfo.color }}>{points}</p>
              <div className="perfil-pts-breakdown">
                <span>📝 {posts.length} posts × 2 pts</span>
                <span>👍 {totalLikes} likes × 5 pts</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SearchDrop({ results, onClose }) {
  function toCategoryPath(v = '') { return v.toLowerCase().replace(/\s+/g, '-'); }
  return (
    <div className="live-search-results">
      {results.length > 0 ? results.map((r, i) => (
        <Link key={i} to={`/insumos/${toCategoryPath(r.categoria)}/${r.slug}`}
          className="search-result-item" onClick={onClose}>
          <img src={r.imagen_url} alt={r.nombre} />
          <div className="result-info">
            <p className="result-name">{r.nombre}</p>
            <p className="result-price">${r.variantes?.[0]?.precio} MXN</p>
          </div>
        </Link>
      )) : <div className="no-results">Sin coincidencias</div>}
    </div>
  );
}
