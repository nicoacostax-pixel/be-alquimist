import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../../App.css';
import SidebarMenu from '../../catalog/components/SidebarMenu';

function ChatIA() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const enviarAGemini = async (promptUsuario) => {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptUsuario }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('API error:', json);
        throw new Error(json.details?.message || json.error || 'Error del servidor');
      }
      return json.text || '';
    } catch (error) {
      console.error("Error técnico detallado:", error.message);
      return "Hubo un problema al conectar con el laboratorio: " + error.message;
    }
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { rol: 'user', texto: input };
    setMensajes(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const respuestaIA = await enviarAGemini(input);

    setMensajes(prev => [...prev, { rol: 'ai', texto: respuestaIA }]);
    setIsLoading(false);
  };

  return (
    <div className={`app-container ${isMenuOpen ? 'menu-visible' : ''}`}>
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
            <div key={i} className={`msg-bubble ${m.rol}`}>{m.texto}</div>
          ))}
          {isLoading && <div className="msg-bubble ai typing">Analizando activos...</div>}
          <div ref={scrollRef} />
        </div>

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

