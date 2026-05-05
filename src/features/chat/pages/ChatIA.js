import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../App.css';
import SidebarMenu from '../../catalog/components/SidebarMenu';
import { useElementos } from '../../../shared/context/ElementosContext';
import ElementosModal from '../../../shared/components/ElementosModal';
import ShareRecetaBtn from '../components/ShareRecetaBtn';
import { supabase } from '../../../shared/lib/supabaseClient';

const STORAGE_KEY = 'ba_free_recipes';

function inlineFormat(str) {
  return str
    .replace(/https?:\/\/[^\s<>"')]+/g, url =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code>$1</code>');
}

function MarkdownText({ text }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="md-text">
      {blocks.map((block, bi) => {
        if (/^\d+\.\s/.test(block)) {
          const items = block.split(/\n/).filter(Boolean);
          return (
            <ol key={bi} className="md-ol">
              {items.map((item, ii) => (
                <li key={ii} dangerouslySetInnerHTML={{ __html: inlineFormat(item.replace(/^\d+\.\s*/, '')) }} />
              ))}
            </ol>
          );
        }
        if (/^[\*\-]\s/.test(block)) {
          const items = block.split(/\n/).filter(Boolean);
          return (
            <ul key={bi} className="md-ul">
              {items.map((item, ii) => (
                <li key={ii} dangerouslySetInnerHTML={{ __html: inlineFormat(item.replace(/^[\*\-]\s*/, '')) }} />
              ))}
            </ul>
          );
        }
        const html = block.split('\n').map(line => inlineFormat(line)).join('<br/>');
        return <p key={bi} className="md-p" dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}

const SECTION_META = {
  'Descripción':               { icon: '📝', color: '#FFF8F2', border: '#B08968' },
  'Fórmula (%)':               { icon: '🧪', color: '#F2FFF5', border: '#4CAF50' },
  'Receta en gramos (100g)':   { icon: '⚖️', color: '#F2F6FF', border: '#5B8DEF' },
  'Instrucciones paso a paso': { icon: '📋', color: '#FFFDF2', border: '#E6B800' },
  'Dónde comprar los ingredientes': { icon: '🛒', color: '#F9F2FF', border: '#9C6ADE' },
  'Calculadora de costos':     { icon: '💰', color: '#F2FFF8', border: '#26A69A' },
};

function parseSections(text) {
  const parts = text.split(/\n(?=## )/);
  const sections = parts
    .map(part => {
      const m = part.match(/^## (.+)\n([\s\S]*)/);
      if (!m) return null;
      return { title: m[1].trim(), content: m[2].trim() };
    })
    .filter(Boolean);
  return sections;
}

function ComprarButtons({ content }) {
  const items = [];
  content.split('\n').forEach(line => {
    const url  = line.match(/https?:\/\/[^\s)>\]]+/);
    const name = line.match(/\*{1,2}([^*\n]+)\*{1,2}/);
    if (url && name) items.push({ nombre: name[1].trim(), url: url[0] });
  });
  if (items.length === 0) return <MarkdownText text={content} />;
  return (
    <div className="comprar-btns">
      {items.map((item, i) => (
        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="comprar-btn">
          🛒 {item.nombre}
        </a>
      ))}
    </div>
  );
}

function RecipeCard({ text }) {
  const sections = parseSections(text);
  if (sections.length === 0) return <MarkdownText text={text} />;

  return (
    <div className="recipe-card-response">
      {sections.map((sec, i) => {
        const meta = Object.entries(SECTION_META).find(([k]) =>
          sec.title.toLowerCase().includes(k.toLowerCase().slice(0, 8))
        );
        const { icon, color, border } = meta?.[1] || { icon: '•', color: '#F9F9F9', border: '#B08968' };
        const isComprar = sec.title.toLowerCase().includes('comprar');
        return (
          <div key={i} className="recipe-sec" style={{ background: color, borderLeftColor: border }}>
            <div className="recipe-sec-header">
              <span className="recipe-sec-icon">{icon}</span>
              <span className="recipe-sec-title">{sec.title}</span>
            </div>
            <div className="recipe-sec-body">
              {isComprar
                ? <ComprarButtons content={sec.content} />
                : <MarkdownText text={sec.content} />
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoginModal({ onClose }) {
  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <span className="chat-modal-icon">🔒</span>
        <h3 className="chat-modal-title">Función exclusiva</h3>
        <p className="chat-modal-sub">La <strong>calculadora de costos</strong> es exclusiva de <strong>Alquimista PRO</strong>.<br/>Conviértete en PRO para desbloquearla.</p>
        <button className="chat-login-btn" onClick={onClose} style={{background:'#B08968'}}>Ver planes</button>
        <button className="chat-modal-skip" onClick={onClose}>Crear otra receta</button>
      </div>
    </div>
  );
}

function LimitModal({ onClose }) {
  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <span className="chat-modal-icon">🧪</span>
        <h3 className="chat-modal-title">Receta gratuita agotada</h3>
        <p className="chat-modal-sub">Puedes crear <strong>1 receta gratuita</strong> sin registrarte.<br/>Inicia sesión para seguir formulando sin límites.</p>
        <Link to="/login" className="chat-login-btn">Iniciar sesión</Link>
        <button className="chat-modal-skip" onClick={onClose}>Ahora no</button>
      </div>
    </div>
  );
}

/* ── Top 5 recetas de la semana ─────────────────────────── */
function RecetasSemana() {
  const [recetas, setRecetas] = useState([]);

  useEffect(() => {
    async function load() {
      const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .gte('created_at', hace7);

      if (!likes || likes.length === 0) return;

      const conteo = {};
      likes.forEach(l => { conteo[l.post_id] = (conteo[l.post_id] || 0) + 1; });
      const topIds = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);

      const { data: posts } = await supabase
        .from('posts')
        .select('id, titulo, imagen_url, usuario_id, perfiles(nombre)')
        .in('id', topIds)
        .eq('categoria', 'Recetas');

      if (!posts) return;
      const ordenados = topIds
        .map(id => posts.find(p => p.id === id))
        .filter(Boolean)
        .map(p => ({ ...p, _likes: conteo[p.id] || 0 }));
      setRecetas(ordenados);
    }
    load();
  }, []);

  if (recetas.length === 0) return null;

  return (
    <div className="home-recetas-section">
      <h3 className="home-recetas-title">🔥 Recetas de la semana</h3>
      <div className="home-recetas-grid">
        {recetas.map(r => (
          <div key={r.id} className="home-receta-card">
            {r.imagen_url
              ? <img src={r.imagen_url} alt={r.titulo} className="home-receta-img" />
              : <div className="home-receta-img-placeholder">🌿</div>
            }
            <div className="home-receta-info">
              <p className="home-receta-nombre">{r.titulo}</p>
              <span className="home-receta-meta">
                {r.perfiles?.nombre && <span>{r.perfiles.nombre} · </span>}
                ❤️ {r._likes}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEST_DEFAULT_IMG = 'https://via.placeholder.com/400x300/F3EFE8/B08968?text=🌿';

function destParseBlocks(desc) {
  if (!desc) return null;
  try {
    const p = JSON.parse(desc);
    if (Array.isArray(p) && p.length > 0) return p;
  } catch {}
  return [{ type: 'text', content: desc }];
}

function DestRenderBlocks({ descripcion }) {
  const blocks = destParseBlocks(descripcion);
  if (!blocks) return null;
  return (
    <div className="bib-blocks">
      {blocks.map((block, i) =>
        block.type === 'h1'
          ? <h3 key={i} className="bib-block-h1">{block.content}</h3>
          : block.type === 'image'
            ? (
              <figure key={i} className="bib-block-figure">
                <img src={block.content} alt={block.caption || ''} className="bib-block-image" />
                {block.caption && <figcaption className="bib-block-caption">{block.caption}</figcaption>}
              </figure>
            )
          : <p key={i} className="bib-block-text">{block.content}</p>
      )}
    </div>
  );
}

/* ── Recetas destacadas (admin) ──────────────────────────── */
function RecetasDestacadas() {
  const [recetas,  setRecetas]  = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    supabase
      .from('recetas_destacadas')
      .select('id, titulo, categoria, descripcion, imagen_url, orden')
      .eq('activa', true)
      .order('orden', { ascending: true })
      .then(({ data }) => { if (data) setRecetas(data); });
  }, []);

  if (recetas.length === 0) return null;

  const previewText = r => {
    try {
      const b = JSON.parse(r.descripcion);
      const first = Array.isArray(b) ? b.find(x => x.type === 'text')?.content : null;
      return (first || r.descripcion || '').slice(0, 90);
    } catch { return (r.descripcion || '').slice(0, 90); }
  };

  return (
    <div className="home-recetas-section">
      <h3 className="home-recetas-title">✨ Recetas destacadas de la semana</h3>
      <div className="biblioteca-grid">
        {recetas.map(r => (
          <button key={r.id} className="bib-card" onClick={() => setSelected(r)}>
            <div className="bib-card-img-wrap">
              <img
                src={r.imagen_url || DEST_DEFAULT_IMG}
                alt={r.titulo}
                className="bib-card-img"
                onError={e => { e.target.src = DEST_DEFAULT_IMG; }}
              />
            </div>
            <div className="bib-card-body">
              {r.categoria && <span className="bib-card-cat">{r.categoria}</span>}
              <h3 className="bib-card-name">{r.titulo}</h3>
              <p className="bib-card-desc">{previewText(r)}…</p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="bib-modal-overlay" onClick={() => setSelected(null)}>
          <div className="bib-modal" onClick={e => e.stopPropagation()}>
            <button className="bib-modal-close" onClick={() => setSelected(null)}>✕</button>
            {selected.imagen_url && (
              <img src={selected.imagen_url} alt={selected.titulo} className="bib-modal-img"
                onError={e => { e.target.src = DEST_DEFAULT_IMG; }} />
            )}
            <div className="bib-modal-body">
              {selected.categoria && <span className="bib-card-cat">{selected.categoria}</span>}
              <h2 className="bib-modal-name">{selected.titulo}</h2>
              <DestRenderBlocks descripcion={selected.descripcion} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatIA() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { data, mimeType, previewUrl }
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const { elementos, esPro, isLoggedIn, userId, isInitializing, deducir } = useElementos();
  const navigate = useNavigate();

  const [recipeCount, setRecipeCount] = useState(
    () => parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
  );
  const [showLoginModal,    setShowLoginModal]    = useState(false);
  const [showLimitModal,    setShowLimitModal]    = useState(false);
  const [showElementosModal,setShowElementosModal]= useState(false);

  const palabras = useMemo(() => ["Crea", "Formula", "Produce", "Vende"], []);
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reversa, setReversa] = useState(false);

  const saludos = useMemo(() => [
   "¡Hola chica! ¿Qué receta natural crearemos hoy?",
    "¡Bienvenida, Alquimista! El laboratorio te espera.",
    "Chica, ¿lista para transformar aceites en magia?",
    "Hagamos que Be Alquimist brille hoy.",
    "¿Qué activo botánico será el protagonista hoy, chica?",
    "¡Hola, chica! La naturaleza y la IA están listas para formular.",
    "Chica, es un buen día para revolucionar la cosmética orgánica.",
    "Bienvenida de nuevo. ¿Extractos, aceites o hidrolatos?",
    "Chica, el laboratorio está a la temperatura perfecta. ¡Empecemos!",
    "¿Lista para crear una fórmula libre de tóxicos hoy?",
    "¡Hola chica! Tu comunidad de emprendedoras espera algo nuevo.",
    "Chica, ¿qué textura vamos a perfeccionar en esta sesión?",
    "Bienvenida, chica. ¿Buscas una fórmula sólida o cremosa?",
    "¡Alquimia pura! Chica, ¿qué tienes en mente?",
    "Chica, vamos a elevar el estándar de la cosmética natural.",
    "¿Qué tal una sinergia de aceites esenciales para hoy, chica?",
    "Hola chica, transformemos plantas en productos que sí vendan.",
    "Chica, la IA está calibrada para tu próxima gran creación.",
    "¿Qué reto de formulación resolveremos hoy?",
    "¡Hola Alquimista! El éxito está en el porcentaje exacto.",
    "Chica, ¿buscas algo para el cuidado capilar o facial hoy?",
    "Bienvenido. Hagamos que Be Alquimist sea hoy tu mejor aliado.",
    "Chica, la cosmética consciente empieza con una buena idea.",
    "¡Hola chica! ¿Lista para leer etiquetas y mejorar fórmulas?",
    "¿Qué tal un serum innovador para empezar el díía, chica?",
    "¡Bienvenida! ¿Qué activo natural quieres investigar ahora?",
    "Chica, es momento de darle vida a esa nueva idea de Be Alquimist",
    "¿Qué tal una limpieza profunda o una hidratación intensa, chica?",
    "¡Hola chica! Tu laboratorio inteligente está a tus órdenes."
  ], []);

  const saludoAleatorio = useMemo(() => saludos[Math.floor(Math.random() * saludos.length)], [saludos]);


  useEffect(() => {
    if (subIndex === palabras[index].length + 1 && !reversa) {
      setTimeout(() => setReversa(true), 1500);
      return;
    }
    if (subIndex === 0 && reversa) {
      setReversa(false);
      setIndex((prev) => (prev + 1) % palabras.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reversa ? -1 : 1));
    }, reversa ? 50 : 100);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reversa, palabras]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const original = reader.result;
      // Compress to max 900px and 0.75 JPEG quality to stay under Vercel's 4.5MB body limit
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        const data = compressed.split(',')[1];
        setPendingImage({ data, mimeType: 'image/jpeg', previewUrl: compressed });
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const streamGemini = async (promptUsuario, historial, onChunk, image = null) => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptUsuario, history: historial, image }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || `Error ${res.status}`);
    }

    // Fallback para browsers que no soportan ReadableStream (Android WebView antiguo)
    if (!res.body || !res.body.getReader) {
      const text = await res.text();
      let full = '';
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) { full += parsed.text; onChunk(full); }
        } catch (err) {
          if (!(err instanceof SyntaxError)) throw err;
        }
      }
      return full;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full   = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) {
            full += parsed.text;
            onChunk(full);
          }
        } catch (err) {
          if (!(err instanceof SyntaxError)) throw err;
        }
      }
    }

    return full;
  };

  // Detect confirm question from last AI message
  const lastAiMsg = useMemo(
    () => [...mensajes].filter(m => m.rol === 'ai' && !m.streaming).pop(),
    [mensajes]
  );
  const confirmQuestion = useMemo(() => {
    if (!lastAiMsg?.texto) return null;
    const m = lastAiMsg.texto.match(/¿[Qq]uieres[^?]+\?/);
    return m ? m[0] : null;
  }, [lastAiMsg]);
  const isCalculadoraConfirm = !!(confirmQuestion && /calculadora/i.test(confirmQuestion));

  // Compila toda la receta de la conversación (todos los mensajes AI con secciones ##)
  const recetaCompleta = useMemo(() => {
    return mensajes
      .filter(m => m.rol === 'ai' && !m.streaming && parseSections(m.texto).length > 0)
      .map(m => m.texto)
      .join('\n\n');
  }, [mensajes]);

  const enviar = async (text, image = null) => {
    if (!text.trim() && !image || isLoading) return;

    const historialActual = [...mensajes].filter(m => !m.streaming);
    setMensajes(prev => [...prev.filter(m => !m.streaming),
      { rol: 'user', texto: text, imagePreview: image?.previewUrl || null },
      { rol: 'ai',   texto: '', streaming: true },
    ]);
    setIsLoading(true);

    const historial = historialActual.map(m => ({
      role: m.rol === 'user' ? 'user' : 'model',
      text: m.texto,
    }));

    const apiImage = image ? { data: image.data, mimeType: image.mimeType } : null;

    let respuestaIA = '';
    try {
      respuestaIA = await streamGemini(text || '', historial, (accumulated) => {
        setIsLoading(false);
        setMensajes(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.streaming) copy[copy.length - 1] = { ...last, texto: accumulated };
          return copy;
        });
      }, apiImage);
    } catch (err) {
      respuestaIA = 'Hubo un problema al conectar con el laboratorio: ' + err.message;
    }

    setIsLoading(false);

    const esInicioReceta = /¿Quieres ver la fórmula completa\?/i.test(respuestaIA);

    if (esInicioReceta) {
      if (!isLoggedIn) {
        // Usuario no logueado: 1 receta gratuita
        if (recipeCount >= 1) {
          setMensajes(prev => prev.filter(m => !m.streaming));
          setShowLimitModal(true);
          return;
        }
        setRecipeCount(1);
        localStorage.setItem(STORAGE_KEY, '1');
      } else {
        // Usuario logueado: descontar 1 elemento
        const ok = await deducir();
        if (!ok) {
          setMensajes(prev => prev.filter(m => !m.streaming));
          setShowElementosModal(true);
          return;
        }
      }
    }

    setMensajes(prev => [
      ...prev.filter(m => !m.streaming),
      { rol: 'ai', texto: respuestaIA },
    ]);

    // Guardar receta desde PASO 1 (descripción generada)
    if (esInicioReceta) {
      const nombre = (text || historialActual.find(m => m.rol === 'user')?.texto || 'Receta').slice(0, 120);
      fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId || null, nombre, contenido: respuestaIA }),
      }).catch(() => {});
    }
  };

  function handleConfirm() {
    if (isCalculadoraConfirm && !esPro) {
      setShowLoginModal(true);
      return;
    }
    enviar('Sí');
  }

  function handleSkip() {
    enviar('No, gracias');
  }

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!input.trim() && !pendingImage) return;
    const text = input;
    const img = pendingImage;
    setInput('');
    setPendingImage(null);
    enviar(text, img);
  };

  if (isInitializing) {
    return (
      <div className="chat-init-loading">
        <div className="chat-init-spinner" />
      </div>
    );
  }

  return (
    <>
      {isLoggedIn && !esPro && (
        <Link to="/pro" className="pro-float-btn">Únete a PRO ✨</Link>
      )}
      {isLoggedIn && (
        <>
          <button className="elementos-banner" onClick={() => setShowElementosModal(true)}>
            <div className="elementos-banner-inner">
              <span className="elementos-banner-icon">⚗️</span>
              <span className="elementos-banner-text">
                {esPro
                  ? '∞ Elementos ilimitados — Alquimista PRO'
                  : elementos <= 0
                  ? '⚠️ Recarga elementos para seguir formulando'
                  : `${elementos} Elemento${elementos !== 1 ? 's' : ''} disponible${elementos !== 1 ? 's' : ''} para formular`}
              </span>
              <span className="elementos-banner-arrow">›</span>
            </div>
          </button>
          <div className="elementos-banner-spacer" />
        </>
      )}
    <div className={`app-container ${isMenuOpen ? 'menu-visible' : ''}`}>
      {showLoginModal    && <LoginModal    onClose={() => { setShowLoginModal(false);    setMensajes([]); }} />}
      {showLimitModal    && <LimitModal    onClose={() => { setShowLimitModal(false);    setMensajes([]); }} />}
      {showElementosModal && <ElementosModal onClose={() => setShowElementosModal(false)} />}
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <header className="app-header-final">
        <div className="header-left-section">
          <div className="static-name">Be Alquimist</div>
          <div className="dynamic-action">
            {`${palabras[index].substring(0, subIndex)}`}
            <span className="cursor-premium">|</span>
          </div>
          <p className="app-subtitle-final">Cosmética natural con IA</p>
        </div>
        <button className="menu-hamburguesa-btn" onClick={() => setIsMenuOpen(true)}>
          <div className="barras-menu"></div><div className="barras-menu"></div><div className="barras-menu"></div>
        </button>
      </header>

      <main className="content">
        <p className="welcome-text">{saludoAleatorio}</p>
        <hr className="divider" />

        <div className="chat-window">
          {mensajes.map((m, i) => {
            const isLast = i === mensajes.length - 1;
            return (
              <div key={i} className={`msg-bubble ${m.rol}`}>
                {m.rol === 'user' && m.imagePreview && (
                  <img src={m.imagePreview} alt="Etiqueta" className="msg-image-preview" />
                )}
                {m.rol === 'ai'
                  ? m.streaming
                    ? m.texto
                      ? <MarkdownText text={m.texto} />
                      : <span className="typing-dots">Analizando activos<span>.</span><span>.</span><span>.</span></span>
                    : <RecipeCard text={m.texto} />
                  : m.texto
                }
                {isLast && parseSections(m.texto).length >= 1 && parseSections(recetaCompleta).length >= 2 && (
                  <ShareRecetaBtn recetaCompleta={recetaCompleta} />
                )}
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {confirmQuestion && !isLoading && (
          <div className="chat-confirm-bar">
            <span className="chat-confirm-label">{confirmQuestion}</span>
            <div className="chat-confirm-actions">
              <button onClick={handleConfirm} className="chat-confirm-yes">Sí ✓</button>
              <button onClick={handleSkip} className="chat-confirm-no">No, gracias</button>
            </div>
          </div>
        )}

        <div className="chat-interface-wrapper">
          <form className="input-box-container" onSubmit={handleEnviar}>
            {pendingImage && (
              <div className="image-pending-wrap">
                <img src={pendingImage.previewUrl} alt="Etiqueta seleccionada" className="image-pending-thumb" />
                <button type="button" className="image-pending-remove" onClick={() => setPendingImage(null)}>×</button>
              </div>
            )}
            <input
              type="text"
              placeholder={pendingImage ? "Describe qué quieres analizar (opcional)" : "¿Qué quieres formular hoy?"}
              className="chat-input-final"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="input-actions-row">
              <button type="button" className="action-plus-btn" title="Subir etiqueta de producto" onClick={() => fileInputRef.current.click()}>+</button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
              <button type="submit" className="send-icon-btn">➤</button>
            </div>
          </form>
        </div>

        <RecetasSemana />
        <RecetasDestacadas />
      </main>
      {isLoggedIn && !esPro && (
        <button className="pro-float-btn" onClick={() => navigate('/pro')}>
          Únete a PRO
        </button>
      )}
    </div>
    </>
  );
}

export default ChatIA;

