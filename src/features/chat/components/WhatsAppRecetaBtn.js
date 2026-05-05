import React from 'react';

const WA_NUMBER = '524921365983';

function parseSections(text) {
  return text.split(/\n(?=## )/).map(part => {
    const m = part.match(/^## (.+)\n([\s\S]*)/);
    if (!m) return null;
    return { title: m[1].trim(), content: m[2].trim() };
  }).filter(Boolean);
}

function buildMsg(recetaCompleta) {
  const sections = parseSections(recetaCompleta);

  const formulaSection = sections.find(s =>
    s.title.toLowerCase().includes('fórmula') || s.title.toLowerCase().includes('formula')
  );
  const compraSection = sections.find(s =>
    s.title.toLowerCase().includes('comprar') || s.title.toLowerCase().includes('ingredientes')
  );

  // Extraer ingredientes con porcentaje de la sección Fórmula
  const formula = [];
  if (formulaSection) {
    formulaSection.content.split('\n').forEach(line => {
      const m = line.match(/[-*]\s*\*{0,2}([^:*\n]+)\*{0,2}\s*[:\-–]\s*(\d[\d.,]*\s*%)/);
      if (m) formula.push({ nombre: m[1].trim(), pct: m[2].trim() });
    });
  }

  // Extraer links de "Dónde comprar"
  const links = {};
  if (compraSection) {
    compraSection.content.split('\n').forEach(line => {
      const url  = line.match(/https?:\/\/[^\s)>\]]+/);
      const name = line.match(/\*{1,2}([^*\n]+)\*{1,2}/);
      if (url && name) links[name[1].trim().toLowerCase()] = url[0];
    });
  }

  let msg = '🌿 *Receta formulada con Be Alquimist*\n\n';

  if (formula.length > 0) {
    msg += '📋 *Lista de ingredientes:*\n';
    formula.forEach(({ nombre, pct }) => {
      msg += `• ${nombre} — ${pct}\n`;
      // buscar link por nombre parcial
      const found = Object.entries(links).find(([k]) =>
        k.includes(nombre.toLowerCase().slice(0, 7)) ||
        nombre.toLowerCase().includes(k.slice(0, 7))
      );
      if (found) msg += `  🛒 ${found[1]}\n`;
    });
  } else if (compraSection) {
    // Si no hay fórmula parseada, usar la sección de compra directamente
    msg += '🛒 *Ingredientes y dónde comprarlos:*\n';
    compraSection.content.split('\n').forEach(line => {
      const clean = line.replace(/\*\*/g, '').replace(/^[-*]\s*/, '').trim();
      if (clean) msg += `• ${clean}\n`;
    });
  }

  msg += '\n_Fórmula creada con Be Alquimist IA_ ⚗️\nhttps://bealquimist.com';
  return msg;
}

export default function WhatsAppRecetaBtn({ recetaCompleta }) {
  const handleClick = () => {
    const msg = buildMsg(recetaCompleta);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      className="wa-receta-btn"
      onClick={handleClick}
      title="Enviar ingredientes por WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="16" height="16" fill="none">
        <path d="M16 2C8.268 2 2 8.268 2 16c0 2.47.647 4.788 1.778 6.8L2 30l7.4-1.744A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#fff"/>
        <path d="M23.07 19.44c-.32-.16-1.892-.934-2.185-1.04-.292-.107-.505-.16-.718.16-.213.32-.825 1.04-.013 1.307.293.107 1.038.373 1.972.24.587-.086 1.12-.32 1.56-.693.32-.267.48-.587.16-.747zM16.08 7.2C11.2 7.2 7.2 11.2 7.2 16.08c0 1.747.48 3.387 1.307 4.8L7.2 24.8l4.053-1.28c1.36.747 2.934 1.173 4.613 1.173 4.88 0 8.88-4 8.88-8.88 0-4.893-3.893-8.613-8.667-8.613zm4.507 12.373c-.187.533-.96 1.013-1.6 1.147-.427.08-.987.16-2.88-.613-2.4-1.013-3.947-3.44-4.053-3.6-.107-.16-.854-1.147-.854-2.187 0-1.04.534-1.546.72-1.76.187-.213.427-.267.56-.267.133 0 .267 0 .373.004.134 0 .267.04.4.347.16.373.56 1.413.613 1.52.053.107.08.24.013.373-.16.32-.32.507-.427.64-.16.187-.32.387-.16.667.48.8 1.12 1.493 1.867 2.027.64.48 1.333.773 1.6.88.267.107.427.08.587-.053.16-.133.693-.8.88-1.08.187-.267.373-.213.627-.12.267.107 1.653.787 1.947.933.293.147.48.213.547.32.067.107.067.64-.12 1.173z" fill="#25D366"/>
      </svg>
      Pedir ingredientes por WhatsApp
    </button>
  );
}
