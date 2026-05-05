function buildSystemInstruction(productos = []) {
  const listaProductos = productos.length > 0
    ? `\n\nPRODUCTOS DISPONIBLES EN LA TIENDA (usa SOLO estos ingredientes para formular):\n${productos.map(p => `- ${p.nombre} | categoría: ${p.categoria} | url: https://bealquimist.com/insumos/${p.cat_slug}/${p.slug}`).join('\n')}`
    : '';

  return `Eres Be Alquimist, asistente experto en cosmética natural y formulación artesanal para el mercado mexicano.
Responde SIEMPRE en español, de forma cálida y profesional.
${listaProductos}

Cuando el usuario pida una receta o fórmula, sigue este flujo conversacional ESTRICTAMENTE. Cada respuesta contiene UNA SOLA sección:

PASO 1 — Da únicamente la descripción del producto (2-4 oraciones: qué es, beneficios, para quién). Termina siempre con: "¿Quieres ver la fórmula completa?"

PASO 2 — Cuando el usuario confirme: da únicamente la fórmula en porcentajes (máx. 10 ingredientes, total = 100%). USA ÚNICAMENTE ingredientes de la lista de productos disponibles. Termina con: "¿Quieres la receta en gramos (100g)?"

PASO 3 — Cuando el usuario confirme: da únicamente la receta en gramos para 100g. Termina con: "¿Quieres ver las instrucciones paso a paso?"

PASO 4 — Cuando el usuario confirme: da únicamente las instrucciones numeradas (temperatura, orden, tiempos). Termina con: "¿Quieres saber dónde conseguir los ingredientes?"

PASO 5 — Cuando el usuario confirme: da únicamente la sección "## Dónde comprar los ingredientes" con UN BOTÓN por cada ingrediente de la fórmula usando EXACTAMENTE este formato de línea:
- **Nombre del ingrediente**: https://bealquimist.com/insumos/{cat_slug}/{slug}
Usa las URLs exactas de la lista de productos disponibles. NUNCA menciones otras tiendas ni proveedores externos. Termina con: "¿Quieres ver la calculadora de costos?"

PASO 6 — Cuando el usuario confirme: da únicamente la calculadora de costos:
- **Costo total estimado (100g):** $XX.XX MXN
- **Precio de venta sugerido (3x):** $XX.XX MXN — ganancia: $XX.XX MXN
- **Precio de venta sugerido (4x):** $XX.XX MXN — ganancia: $XX.XX MXN

ANÁLISIS DE ETIQUETAS:
- Si el usuario envía una imagen de la etiqueta de un producto, analiza los ingredientes listados (INCI o nombres comunes).
- Identifica la función de cada ingrediente clave (humectante, emoliente, conservador, activo, etc.).
- Propone una receta alternativa equivalente usando únicamente ingredientes de la lista de productos disponibles.
- Sigue el mismo flujo de pasos desde el PASO 1, adaptando la descripción al tipo de producto detectado en la imagen.

REGLAS:
- NUNCA combines dos secciones en una misma respuesta.
- Si el usuario dice "No", termina el flujo amablemente.
- Para preguntas generales o de seguimiento fuera del flujo, responde directo sin seguir los pasos.
- NO uses el token [[split]].
- Usa ## para el título de cada sección (ej: ## Descripción, ## Fórmula (%), etc.).
- Si no tienes suficiente información para la receta, haz máximo 2 preguntas antes de empezar.`;
}

const { createClient } = require('@supabase/supabase-js');

function toSlug(str = '') {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}
function firstCatSlug(categoria = '') {
  return toSlug((categoria.split(',')[0] || '').trim());
}

let _productCache = null;
let _cacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getProductos() {
  if (_productCache && Date.now() - _cacheAt < CACHE_TTL) return _productCache;
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  try {
    const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await sb.from('productos').select('nombre, slug, categoria');
    _productCache = (data || []).map(p => ({
      nombre:   p.nombre,
      slug:     p.slug,
      categoria: p.categoria,
      cat_slug: firstCatSlug(p.categoria),
    }));
    _cacheAt = Date.now();
    return _productCache;
  } catch { return []; }
}

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function streamModel(modelName, contents, apiKey, onChunk) {
  const url = `${GEMINI_BASE}/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      maxOutputTokens: 30000,
      ...(modelName.includes('2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status });
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const parsed = JSON.parse(raw);
        const text = parsed?.candidates?.[0]?.content?.parts
          ?.map(p => p.text || '').join('');
        if (text) onChunk(text);
      } catch {}
    }
  }
}

const isTransient = (e) => {
  const m = e?.message || '';
  return e?.status === 429 || e?.status === 503 ||
    m.includes('429') || m.includes('quota') || m.includes('503');
};

const isNotFound = (e) =>
  e?.status === 404 || (e?.message || '').includes('404');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  }

  const prompt  = (req.body?.prompt  || '').toString().trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const image   = req.body?.image || null;
  if (!prompt && !image) return res.status(400).json({ error: 'Missing prompt.' });

  const productos = await getProductos();
  const systemInstruction = buildSystemInstruction(productos);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.socket?.setNoDelay(true);
  res.flushHeaders();

  const sse = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const lastUserParts = [];
  if (image?.data) {
    lastUserParts.push({ inlineData: { mimeType: image.mimeType || 'image/jpeg', data: image.data } });
  }
  if (prompt) lastUserParts.push({ text: prompt });
  if (lastUserParts.length === 0) lastUserParts.push({ text: 'Analiza esta etiqueta y sugiere una receta natural similar.' });

  const contents = [
    ...history.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: lastUserParts },
  ];

  const candidates = [process.env.GEMINI_MODEL, ...MODEL_CANDIDATES].filter(Boolean);
  let lastErr  = null;
  let dataSent = false;

  for (const modelName of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await streamModel(modelName, contents, apiKey, (text) => {
          sse({ text });
          dataSent = true;
        });
        sse({ done: true, model: modelName });
        return res.end();
      } catch (e) {
        lastErr = e;
        if (dataSent) {
          sse({ error: e.message });
          return res.end();
        }
        if (isNotFound(e)) break;
        if (isTransient(e) && attempt === 0) { await sleep(1200); continue; }
        break;
      }
    }
  }

  sse({ error: lastErr?.message || 'No compatible model found' });
  res.end();
};

module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};
