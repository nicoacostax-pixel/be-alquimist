import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../../App.css';
import SidebarMenu from '../../catalog/components/SidebarMenu';
import { supabase } from '../../../shared/lib/supabaseClient';

const RECIPE_LIMIT = 3;
const STORAGE_KEY  = 'ba_free_recipes';

function inlineFormat(str) {
  return str
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

function RecipeCard({ text }) {
  const sections = parseSections(text);
  if (sections.length < 2) return <MarkdownText text={text} />;

  return (
    <div className="recipe-card-response">
      {sections.map((sec, i) => {
        const meta = Object.entries(SECTION_META).find(([k]) =>
          sec.title.toLowerCase().includes(k.toLowerCase().slice(0, 8))
        );
        const { icon, color, border } = meta?.[1] || { icon: '•', color: '#F9F9F9', border: '#B08968' };
        return (
          <div key={i} className="recipe-sec" style={{ background: color, borderLeftColor: border }}>
            <div className="recipe-sec-header">
              <span className="recipe-sec-icon">{icon}</span>
              <span className="recipe-sec-title">{sec.title}</span>
            </div>
            <div className="recipe-sec-body">
              <MarkdownText text={sec.content} />
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
        <h3 className="chat-modal-title">Laboratorio gratuito agotado</h3>
        <p className="chat-modal-sub">Has usado tus <strong>3 recetas gratuitas</strong>.<br/>Inicia sesión para seguir formulando sin límites.</p>
        <Link to="/login" className="chat-login-btn">Iniciar sesión</Link>
        <button className="chat-modal-skip" onClick={onClose}>Ahora no</button>
      </div>
    </div>
  );
}

function ChatIA() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [recipeCount, setRecipeCount] = useState(
    () => parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
  );
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Progressive recipe reveal
  const recipeStepsRef = useRef(null); // stores the 6 parsed sections
  const [confirmLabel, setConfirmLabel]   = useState(null); // current question to show
  const [confirmIndex, setConfirmIndex]   = useState(0);    // which step to reveal next

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const palabras = useMemo(() => ["Crea", "Formula", "Produce", "Vende"], []);
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reversa, setReversa] = useState(false);

  const saludos = useMemo(() => [
   "¡Hola Nico! ¿Qué receta natural crearemos hoy?",
    "¡Bienvenido, Alquimista! El laboratorio te espera.",
    "Nico, ¿listo para transformar aceites en magia?",
    "Hagamos que Be Alquimist brille hoy.",
    "¿Qué activo botánico será el protagonista hoy, Nico?",
    "¡Hola, Nico! La naturaleza y la IA están listas para formular.",
    "Nico, es un buen día para revolucionar la cosmética orgánica.",
    "Bienvenido de nuevo. ¿Extractos, aceites o hidrolatos?",
    "Nico, el laboratorio está a la temperatura perfecta. ¡Empecemos!",
    "¿Listos para crear una fórmula libre de tóxicos hoy?",
    "¡Hola Nico! Tu comunidad de emprendedoras espera algo nuevo.",
    "Nico, ¿qué textura vamos a perfeccionar en esta sesión?",
    "Bienvenido, Nico. ¿Buscas una fórmula sólida o cremosa?",
    "¡Alquimia pura! Nico, ¿qué tienes en mente?",
    "Nico, vamos a elevar el estándar de la cosmética natural.",
    "¿Qué tal una sinergia de aceites esenciales para hoy, Nico?",
    "Hola Nico, transformemos plantas en productos que sí vendan.",
    "Nico, la IA está calibrada para tu próxima gran creación.",
    "¿Qué reto de formulación resolveremos hoy, Nico?",
    "¡Hola Alquimista! El éxito está en el porcentaje exacto.",
    "Nico, ¿buscas algo para el cuidado capilar o facial hoy?",
    "Bienvenido. Hagamos que Be Alquimist sea hoy tu mejor aliado.",
    "Nico, la cosmética consciente empieza con una buena idea.",
    "¡Hola Nico! ¿Listos para leer etiquetas y mejorar fórmulas?",
    "¿Qué tal un serum innovador para empezar el día, Nico?",
    "Nico, cada gota cuenta en la alquimia de hoy.",
    "¡Bienvenido! ¿Qué activo natural quieres investigar ahora?",
    "Nico, es momento de darle vida a esa nueva idea de Taller Orgánico.",
    "¿Qué tal una limpieza profunda o una hidratación intensa, Nico?",
    "¡Hola Nico! Tu laboratorio inteligente está a tus órdenes."
  ], []);

  const saludoAleatorio = useMemo(() => saludos[Math.floor(Math.random() * saludos.length)], [saludos]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

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

  const streamGemini = async (promptUsuario, historial, onChunk) => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptUsuario, history: historial }),
    });

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
          if (!(err instanceof SyntaxError)) throw err; // solo silenciar errores de parse
        }
      }
    }

    return full;
  };

  const CONFIRM_LABELS = [
    '¿Quieres ver la fórmula completa?',
    '¿Quieres ver la receta en gramos?',
    '¿Quieres ver las instrucciones paso a paso?',
    '¿Quieres calcular el costo y precio de venta?',
  ];

  // Reveal the next step when user confirms
  function handleConfirm() {
    const steps = recipeStepsRef.current;
    if (!steps) return;

    const next = confirmIndex + 1; // 1=formula, 2=recipe, 3=instructions+where, 4=cost

    let toReveal = [];
    if (next === 1) toReveal = [steps[1]];
    else if (next === 2) toReveal = [steps[2]];
    else if (next === 3) toReveal = [steps[3], steps[4]].filter(Boolean);
    else if (next === 4) toReveal = [steps[5]].filter(Boolean);

    toReveal.forEach(text => {
      setMensajes(prev => [...prev, { rol: 'ai', texto: text }]);
    });

    if (next < 4) {
      setConfirmLabel(CONFIRM_LABELS[next]);
      setConfirmIndex(next);
    } else {
      // Cost step revealed — increment counter
      setConfirmLabel(null);
      setConfirmIndex(0);
      recipeStepsRef.current = null;
      if (!isLoggedIn) {
        const nuevo = recipeCount + 1;
        setRecipeCount(nuevo);
        localStorage.setItem(STORAGE_KEY, String(nuevo));
        if (nuevo >= RECIPE_LIMIT) setShowLoginModal(true);
      }
    }
  }

  function handleSkip() {
    setConfirmLabel(null);
    setConfirmIndex(0);
    recipeStepsRef.current = null;
  }

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setConfirmLabel(null);
    setConfirmIndex(0);
    recipeStepsRef.current = null;

    const promptText     = input;
    const historialActual = [...mensajes];
    setMensajes(prev => [...prev,
      { rol: 'user', texto: promptText },
      { rol: 'ai',   texto: '', streaming: true },
    ]);
    setInput('');
    setIsLoading(true);

    const historial = historialActual.map(m => ({
      role: m.rol === 'user' ? 'user' : 'model',
      text: m.texto,
    }));

    let respuestaIA = '';
    try {
      respuestaIA = await streamGemini(promptText, historial, (accumulated) => {
        setIsLoading(false);
        setMensajes(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.streaming) copy[copy.length - 1] = { ...last, texto: accumulated };
          return copy;
        });
      });
    } catch (err) {
      respuestaIA = 'Hubo un problema al conectar con el laboratorio: ' + err.message;
    }

    setIsLoading(false);
    // Remove streaming placeholder
    setMensajes(prev => prev.filter(m => !m.streaming));

    let partes = respuestaIA.split('[[split]]').map(s => s.trim()).filter(Boolean);
    if (partes.length < 5) {
      const bySections = respuestaIA.split(/\n(?=## )/).map(s => s.trim()).filter(Boolean);
      if (bySections.length >= 5) partes = bySections;
    }

    if (partes.length >= 5) {
      recipeStepsRef.current = partes;
      setMensajes(prev => [...prev, { rol: 'ai', texto: partes[0] }]);
      setConfirmLabel(CONFIRM_LABELS[0]);
      setConfirmIndex(0);
    } else {
      for (const parte of partes) {
        await new Promise(r => setTimeout(r, 120));
        setMensajes(prev => [...prev, { rol: 'ai', texto: parte }]);
      }
    }
  };

  return (
    <div className={`app-container ${isMenuOpen ? 'menu-visible' : ''}`}>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
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
          {mensajes.map((m, i) => (
            <div key={i} className={`msg-bubble ${m.rol}`}>
              {m.rol === 'ai'
                ? m.streaming
                  ? m.texto
                    ? <MarkdownText text={m.texto.replace(/\[\[split\]\]/g, '')} />
                    : <span className="typing-dots">Analizando activos<span>.</span><span>.</span><span>.</span></span>
                  : <RecipeCard text={m.texto} />
                : m.texto
              }
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {confirmLabel && (
          <div className="chat-confirm-bar">
            <span className="chat-confirm-label">{confirmLabel}</span>
            <div className="chat-confirm-actions">
              <button onClick={handleConfirm} className="chat-confirm-yes">Sí ✓</button>
              <button onClick={handleSkip} className="chat-confirm-no">No, gracias</button>
            </div>
          </div>
        )}

        <div className="chat-interface-wrapper">
          <form className="input-box-container" onSubmit={handleEnviar}>
            <input
              type="text"
              placeholder="¿Qué quieres formular hoy?"
              className="chat-input-final"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="input-actions-row">
              <button type="button" className="action-plus-btn" onClick={() => fileInputRef.current.click()}>+</button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" />
              <button type="submit" className="send-icon-btn">➤</button>
            </div>
          </form>
        </div>

        <div className="recipe-card-bottom">
          <div className="image-placeholder"><span className="icon-leaf">🌿</span></div>
          <div className="recipe-body">
            <h2 className="recipe-title">Laboratorio Activo</h2>
            <p className="recipe-description">Escribe arriba qué quieres crear para generar una fórmula completa.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChatIA;

