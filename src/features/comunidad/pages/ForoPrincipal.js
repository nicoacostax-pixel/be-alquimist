import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageCircle } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import AttachmentToolbar from '../components/AttachmentToolbar';

/* ── Helpers ─────────────────────────────── */
function renderMd(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<strong class="md-h2">$1</strong>')
    .replace(/^### (.+)$/gm, '<strong class="md-h3">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[\-\*] (.+)$/gm, '<span class="md-li">◆ $1</span>')
    .replace(/^(\d+)\. (.+)$/gm, '<span class="md-li"><b>$1.</b> $2</span>')
    .replace(/\n/g, '<br/>');
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function extractYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const CATEGORIAS = [
  { id: 'todos',     nombre: 'Todos los temas',       icono: '🌐' },
  { id: 'general',   nombre: 'General',               icono: '🌎' },
  { id: 'anuncios',  nombre: 'Anuncios',              icono: '📣' },
  { id: 'bienvenida',nombre: 'Bienvenida',            icono: '👋' },
  { id: 'victorias', nombre: 'Victorias',             icono: '🏆' },
  { id: 'ayuda',     nombre: 'Necesito ayuda',        icono: '🙌' },
  { id: 'valor',     nombre: 'Valor',                 icono: '💎' },
  { id: 'diversion', nombre: 'Diversión',             icono: '🥳' },
  { id: 'proceso',   nombre: 'Documenta tu proceso',  icono: '❤️' },
  { id: 'marca',     nombre: 'Camino a tu marca',     icono: '🔥' },
  { id: 'recetas',   nombre: 'Recetas Alquimistas',   icono: '🧪' },
  { id: 'dudas',     nombre: 'Dudas y Soporte',       icono: '❓' },
];

/* ── Componente principal ─────────────────── */
export default function ForoPrincipal() {
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [posts, setPosts]       = useState([]);
  const [cargando, setCargando] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);

  // ── Estado form nuevo post
  const [nuevoPost, setNuevoPost]       = useState({ titulo: '', contenido: '' });
  const [postPanel, setPostPanel]       = useState(null);
  const [postLink, setPostLink]         = useState('');
  const [postVideo, setPostVideo]       = useState('');
  const [postPoll, setPostPoll]         = useState(['', '']);
  const [postImagenFile, setPostImagenFile]       = useState(null);
  const [postImagenPreview, setPostImagenPreview] = useState('');
  const [subiendoPost, setSubiendoPost] = useState(false);
  const postFileRef     = useRef(null);
  const postTextareaRef = useRef(null);

  // ── Estado form nuevo comentario
  const [nuevoComentario, setNuevoComentario]   = useState('');
  const [comentPanel, setComentPanel]           = useState(null);
  const [comentLink, setComentLink]             = useState('');
  const [comentVideo, setComentVideo]           = useState('');
  const [comentPoll, setComentPoll]             = useState(['', '']);
  const [comentImagenFile, setComentImagenFile]         = useState(null);
  const [comentImagenPreview, setComentImagenPreview]   = useState('');
  const [subiendoComentario, setSubiendoComentario]     = useState(false);
  const comentFileRef     = useRef(null);
  const comentTextareaRef = useRef(null);

  // ── Sección de comentarios
  const [expandedPost, setExpandedPost]     = useState(null);
  const [comentariosMap, setComentariosMap] = useState({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  useEffect(() => { fetchPosts(); }, [categoriaActiva]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resetear estado del comentario al cambiar de post expandido
  useEffect(() => {
    setNuevoComentario('');
    setComentPanel(null);
    setComentLink(''); setComentVideo('');
    setComentPoll(['', '']);
    setComentImagenFile(null); setComentImagenPreview('');
    if (comentFileRef.current) comentFileRef.current.value = '';
  }, [expandedPost]);

  /* ── Fetch ── */
  async function fetchPosts() {
    setCargando(true);
    try {
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (categoriaActiva !== 'todos') query = query.eq('categoria', categoriaActiva);
      const { data: postsData, error } = await query;
      if (error) throw error;

      const rawPosts = postsData || [];
      if (rawPosts.length === 0) { setPosts([]); return; }

      const postIds = rawPosts.map(p => p.id);
      const userIds = [...new Set(rawPosts.map(p => p.usuario_id).filter(Boolean))];
      const { data: { user } } = await supabase.auth.getUser();

      const [perfilesRes, likesRes, comentariosRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from('perfiles').select('id, nombre, avatar_url').in('id', userIds)
          : Promise.resolve({ data: [] }),
        supabase.from('post_likes').select('post_id, usuario_id').in('post_id', postIds),
        supabase.from('post_comentarios').select('post_id').in('post_id', postIds),
      ]);

      const perfilMap = {};
      (perfilesRes.data || []).forEach(p => { perfilMap[p.id] = p; });

      const likesMap = {};
      (likesRes.data || []).forEach(like => {
        if (!likesMap[like.post_id]) likesMap[like.post_id] = { count: 0, userLiked: false };
        likesMap[like.post_id].count++;
        if (user && like.usuario_id === user.id) likesMap[like.post_id].userLiked = true;
      });

      const comentariosCount = {};
      (comentariosRes.data || []).forEach(c => {
        comentariosCount[c.post_id] = (comentariosCount[c.post_id] || 0) + 1;
      });

      setPosts(rawPosts.map(post => ({
        ...post,
        _perfil:           perfilMap[post.usuario_id] || null,
        _likes:            likesMap[post.id]?.count     || 0,
        _userLiked:        likesMap[post.id]?.userLiked || false,
        _comentariosCount: comentariosCount[post.id]    || 0,
      })));
    } catch (err) {
      console.error('Error fetchPosts:', err.message);
    } finally {
      setCargando(false);
    }
  }

  /* ── Upload helper ── */
  async function uploadImagen(file, userId) {
    const ext      = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('posts').upload(filePath, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath);
    return publicUrl;
  }

  function buildMetadata(link, video, poll) {
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

  /* ── Crear post ── */
  async function crearPost(e) {
    e.preventDefault();
    if (!nuevoPost.titulo.trim() || !nuevoPost.contenido.trim()) return;
    setSubiendoPost(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('Debes estar logueado'); return; }

      const hace1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase.from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .gte('created_at', hace1h);
      if (count >= 3) {
        alert('Alcanzaste el límite de 3 publicaciones por hora. Intenta más tarde.');
        setSubiendoPost(false);
        return;
      }

      const imagen_url = postImagenFile ? await uploadImagen(postImagenFile, user.id) : null;
      const metadata   = buildMetadata(postLink, postVideo, postPoll);

      const { data: newPosts, error } = await supabase.from('posts').insert([{
        titulo: nuevoPost.titulo.trim(), contenido: nuevoPost.contenido.trim(),
        categoria: categoriaActiva === 'todos' ? 'bienvenida' : categoriaActiva,
        usuario_id: user.id, imagen_url, metadata,
      }]).select('id');
      if (error) throw error;
      if (newPosts?.[0]) {
        await awardPuntos(user.id, 1, 'post_publicado', newPosts[0].id);
      }

      setNuevoPost({ titulo: '', contenido: '' });
      setPostLink(''); setPostVideo(''); setPostPoll(['', '']);
      setPostImagenFile(null); setPostImagenPreview('');
      setPostPanel(null);
      if (postFileRef.current) postFileRef.current.value = '';
      fetchPosts();
    } catch (err) {
      console.error('Error crearPost:', err.message);
      alert('No se pudo publicar: ' + err.message);
    } finally {
      setSubiendoPost(false);
    }
  }

  /* ── Likes ── */
  async function toggleLike(postId) {
    if (!currentUser) { alert('Debes estar logueado para dar like'); return; }
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p, _likes: p._userLiked ? p._likes - 1 : p._likes + 1, _userLiked: !p._userLiked,
    }));
    if (post._userLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('usuario_id', currentUser.id);
      if (post.usuario_id && post.usuario_id !== currentUser.id)
        await supabase.rpc('incrementar_puntos', { uid: post.usuario_id, delta: -1 });
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, usuario_id: currentUser.id });
      if (post.usuario_id && post.usuario_id !== currentUser.id)
        await supabase.rpc('incrementar_puntos', { uid: post.usuario_id, delta: 1 });
    }
  }

  /* ── Comentarios ── */
  async function fetchComentarios(postId) {
    const { data: comentarios } = await supabase
      .from('post_comentarios').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    const rows    = comentarios || [];
    const cIds    = rows.map(c => c.id);
    const userIds = [...new Set(rows.map(c => c.usuario_id).filter(Boolean))];

    const [perfilesRes, cLikesRes, { data: { user } }] = await Promise.all([
      userIds.length ? supabase.from('perfiles').select('id, nombre, avatar_url').in('id', userIds) : { data: [] },
      cIds.length    ? supabase.from('comentario_likes').select('comentario_id, usuario_id').in('comentario_id', cIds) : { data: [] },
      supabase.auth.getUser(),
    ]);

    const perfilMap = {};
    (perfilesRes.data || []).forEach(p => { perfilMap[p.id] = p; });

    const cLikesMap = {};
    (cLikesRes.data || []).forEach(l => {
      if (!cLikesMap[l.comentario_id]) cLikesMap[l.comentario_id] = { count: 0, userLiked: false };
      cLikesMap[l.comentario_id].count++;
      if (user && l.usuario_id === user.id) cLikesMap[l.comentario_id].userLiked = true;
    });

    setComentariosMap(prev => ({
      ...prev,
      [postId]: rows.map(c => ({
        ...c,
        _perfil:    perfilMap[c.usuario_id] || null,
        _likes:     cLikesMap[c.id]?.count     || 0,
        _userLiked: cLikesMap[c.id]?.userLiked || false,
      })),
    }));
  }

  async function toggleComentarioLike(comentario, postId) {
    if (!currentUser) return;
    const isLiked = comentario._userLiked;
    setComentariosMap(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map(c => c.id !== comentario.id ? c : {
        ...c, _likes: isLiked ? c._likes - 1 : c._likes + 1, _userLiked: !isLiked,
      }),
    }));
    if (isLiked) {
      await supabase.from('comentario_likes').delete().eq('comentario_id', comentario.id).eq('usuario_id', currentUser.id);
      if (comentario.usuario_id && comentario.usuario_id !== currentUser.id)
        await supabase.rpc('incrementar_puntos', { uid: comentario.usuario_id, delta: -1 });
    } else {
      await supabase.from('comentario_likes').insert({ comentario_id: comentario.id, usuario_id: currentUser.id });
      if (comentario.usuario_id && comentario.usuario_id !== currentUser.id)
        await supabase.rpc('incrementar_puntos', { uid: comentario.usuario_id, delta: 1 });
    }
  }

  async function toggleComentarios(postId) {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    await fetchComentarios(postId);
  }

  async function agregarComentario(e, postId) {
    e.preventDefault();
    if (!nuevoComentario.trim() || !currentUser) return;
    setSubiendoComentario(true);
    try {
      const imagen_url = comentImagenFile ? await uploadImagen(comentImagenFile, currentUser.id) : null;
      const metadata   = buildMetadata(comentLink, comentVideo, comentPoll);

      const { error } = await supabase.from('post_comentarios').insert({
        post_id: postId, usuario_id: currentUser.id,
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
      console.error('Error agregarComentario:', err.message);
    } finally {
      setSubiendoComentario(false);
    }
  }

  /* ── Puntos ── */
  async function awardPuntos(uid, delta, tipo, refId) {
    if (tipo && refId) {
      const { error } = await supabase.from('puntos_log').insert({ user_id: uid, tipo, referencia_id: refId });
      if (error) return; // unique constraint → ya otorgado
    }
    await supabase.rpc('incrementar_puntos', { uid, delta });
  }

  /* ── Emoji insert ── */
  function makeEmojiInserter(getText, setText, ref) {
    return (emoji) => {
      const el = ref.current;
      if (!el) { setText(t => t + emoji); return; }
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      const next  = getText().slice(0, start) + emoji + getText().slice(end);
      setText(next);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + emoji.length; el.focus(); }, 0);
    };
  }

  /* ── Render ── */
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="vista ampliada" className="lightbox-img" onClick={e => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
        </div>
      )}

      {/* Categorías */}
      <nav className="foro-categorias-nav">
        {CATEGORIAS.map(cat => (
          <button key={cat.id} onClick={() => setCategoriaActiva(cat.id)} style={{
            whiteSpace: 'nowrap', padding: '10px 16px', borderRadius: '25px',
            border: '1px solid #B08968', fontSize: '13px', fontWeight: '500', flexShrink: 0,
            background: categoriaActiva === cat.id ? '#B08968' : '#fff',
            color:      categoriaActiva === cat.id ? '#fff'    : '#B08968',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {cat.icono} {cat.nombre}
          </button>
        ))}
      </nav>

      <div style={{ width: '100%', maxWidth: '800px', padding: '15px 10px', boxSizing: 'border-box' }}>

        {/* ── Crear post ── */}
        <div className="post-card" style={{ marginBottom: '20px', borderLeft: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <form onSubmit={crearPost}>
            <input className="premium-input-field" placeholder="Título"
              value={nuevoPost.titulo}
              onChange={e => setNuevoPost(p => ({ ...p, titulo: e.target.value }))}
              style={{ fontWeight: '600', fontSize: '15px', marginBottom: '10px' }} />
            <textarea ref={postTextareaRef} className="premium-input-field"
              placeholder="Escribe algo..."
              value={nuevoPost.contenido}
              onChange={e => setNuevoPost(p => ({ ...p, contenido: e.target.value }))}
              style={{ minHeight: '90px', resize: 'none', fontSize: '14px' }} />
            <AttachmentToolbar
              panelActivo={postPanel}       setPanelActivo={setPostPanel}
              linkInput={postLink}          setLinkInput={setPostLink}
              videoInput={postVideo}        setVideoInput={setPostVideo}
              pollOpciones={postPoll}       setPollOpciones={setPostPoll}
              imagenFile={postImagenFile}   imagenPreview={postImagenPreview}
              onImagenChange={e => {
                const f = e.target.files[0];
                if (!f) return;
                setPostImagenFile(f);
                setPostImagenPreview(URL.createObjectURL(f));
                setPostPanel(null);
              }}
              onQuitarImagen={() => {
                setPostImagenFile(null); setPostImagenPreview('');
                if (postFileRef.current) postFileRef.current.value = '';
              }}
              onInsertEmoji={makeEmojiInserter(() => nuevoPost.contenido,
                v => setNuevoPost(p => ({ ...p, contenido: v })), postTextareaRef)}
              fileInputRef={postFileRef}   textareaRef={postTextareaRef}
              submitLabel="Publicar"       submitDisabled={subiendoPost}
            />
          </form>
        </div>

        {/* ── Feed ── */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#B08968' }}>Cargando comunidad... 🧪</div>
        ) : posts.length > 0 ? posts.map(post => {
          const meta = post.metadata || {};
          return (
            <div key={post.id} className="post-card">
              <div className="post-author-row">
                <Link to={`/perfil/${post.usuario_id}`} className="post-author-link">
                  {post._perfil?.avatar_url
                    ? <img src={post._perfil.avatar_url} alt={post._perfil.nombre} className="post-avatar" />
                    : <div className="post-avatar-placeholder">{(post._perfil?.nombre || '?').charAt(0).toUpperCase()}</div>
                  }
                </Link>
                <div>
                  <Link to={`/perfil/${post.usuario_id}`} className="post-author-name post-author-link">
                    {post._perfil?.nombre || 'Alquimista'}
                  </Link>
                  <span className="post-meta"> · {timeAgo(post.created_at)} · {post.categoria}</span>
                </div>
              </div>

              <div className="post-body">
                <div className="post-text-area">
                  <h3 className="post-titulo">{post.titulo}</h3>
                  <div className="post-contenido"
                    dangerouslySetInnerHTML={{ __html: renderMd(post.contenido) }}
                  />
                </div>
              </div>
              {post.imagen_url && !meta.video_id && (
                <img src={post.imagen_url} alt="imagen" className="post-full-img" onClick={() => setLightboxImg(post.imagen_url)} />
              )}

              {meta.video_id && (
                <div style={{ marginTop: 12 }}>
                  <iframe src={`https://www.youtube.com/embed/${meta.video_id}`} title="video"
                    allowFullScreen style={{ width: '100%', height: 260, border: 'none', borderRadius: 10 }} />
                </div>
              )}
              {meta.link && (
                <a href={meta.link} target="_blank" rel="noopener noreferrer" className="post-link-card">
                  🔗 {meta.link}
                </a>
              )}
              {meta.poll && (
                <div className="post-poll">
                  <p className="post-poll-title">📊 Encuesta</p>
                  {meta.poll.opciones.map((op, i) => <div key={i} className="poll-opcion-preview">{op}</div>)}
                </div>
              )}

              {/* Acciones */}
              <div className="post-actions-row">
                <button className={`post-action-btn${post._userLiked ? ' liked' : ''}`} onClick={() => toggleLike(post.id)}>
                  <ThumbsUp size={16} /><span>{post._likes}</span>
                </button>
                <button className={`post-action-btn${expandedPost === post.id ? ' active' : ''}`} onClick={() => toggleComentarios(post.id)}>
                  <MessageCircle size={16} /><span>{post._comentariosCount}</span>
                </button>
              </div>

              {/* ── Sección comentarios ── */}
              {expandedPost === post.id && (
                <div className="post-comments-section">
                  {/* Lista de comentarios */}
                  {(comentariosMap[post.id] || []).map(c => {
                    const cmeta = c.metadata || {};
                    return (
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
                          {c.imagen_url && !cmeta.video_id && (
                            <img src={c.imagen_url} alt="adjunto" style={{ maxWidth: '100%', marginTop: 8, borderRadius: 8 }} />
                          )}
                          {cmeta.video_id && (
                            <iframe src={`https://www.youtube.com/embed/${cmeta.video_id}`} title="video"
                              allowFullScreen style={{ width: '100%', height: 180, border: 'none', borderRadius: 8, marginTop: 8 }} />
                          )}
                          {cmeta.link && (
                            <a href={cmeta.link} target="_blank" rel="noopener noreferrer" className="post-link-card" style={{ marginTop: 8 }}>
                              🔗 {cmeta.link}
                            </a>
                          )}
                          {cmeta.poll && (
                            <div className="post-poll" style={{ marginTop: 8 }}>
                              <p className="post-poll-title">📊 Encuesta</p>
                              {cmeta.poll.opciones.map((op, i) => <div key={i} className="poll-opcion-preview">{op}</div>)}
                            </div>
                          )}
                          <button
                            onClick={() => toggleComentarioLike(c, post.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                              color: c._userLiked ? '#B08968' : '#9E9188',
                              fontSize: 12, padding: '4px 0', marginTop: 6,
                            }}
                          >
                            <ThumbsUp size={12} />
                            {c._likes > 0 && <span>{c._likes}</span>}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* ── Form nuevo comentario con toolbar ── */}
                  <form onSubmit={e => agregarComentario(e, post.id)} style={{ marginTop: 8 }}>
                    <textarea
                      ref={comentTextareaRef}
                      className="premium-input-field"
                      placeholder="Escribe un comentario..."
                      value={nuevoComentario}
                      onChange={e => setNuevoComentario(e.target.value)}
                      style={{ minHeight: '70px', resize: 'none', fontSize: '14px' }}
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
                </div>
              )}
            </div>
          );
        }) : (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#B08968', opacity: 0.7 }}>
            No hay publicaciones en esta categoría. ✨
          </div>
        )}
      </div>
    </div>
  );
}
