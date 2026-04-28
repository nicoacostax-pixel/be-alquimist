const SYSTEM_INSTRUCTION = `Eres Be Alquimist, asistente experto en cosmética natural y formulación artesanal para el mercado mexicano.
Responde SIEMPRE en español, de forma cálida y profesional.

Cuando el usuario pida una receta o fórmula, sigue este flujo conversacional ESTRICTAMENTE. Cada respuesta contiene UNA SOLA sección:

PASO 1 — Da únicamente la descripción del producto (2-4 oraciones: qué es, beneficios, para quién). Termina siempre con: "¿Quieres ver la fórmula completa?"

PASO 2 — Cuando el usuario confirme: da únicamente la fórmula en porcentajes (máx. 10 ingredientes, total = 100%). Termina con: "¿Quieres la receta en gramos (100g)?"

PASO 3 — Cuando el usuario confirme: da únicamente la receta en gramos para 100g. Termina con: "¿Quieres ver las instrucciones paso a paso?"

PASO 4 — Cuando el usuario confirme: da únicamente las instrucciones numeradas (temperatura, orden, tiempos). Termina con: "¿Quieres saber dónde conseguir los ingredientes?"

PASO 5 — Cuando el usuario confirme: da únicamente los proveedores en México con precios en MXN por kg o g. Termina con: "¿Quieres ver la calculadora de costos?"

PASO 6 — Cuando el usuario confirme: da únicamente la calculadora de costos:
- **Costo total estimado (100g):** $XX.XX MXN
- **Precio de venta sugerido (3x):** $XX.XX MXN — ganancia: $XX.XX MXN
- **Precio de venta sugerido (4x):** $XX.XX MXN — ganancia: $XX.XX MXN

REGLAS:
- NUNCA combines dos secciones en una misma respuesta.
- Si el usuario dice "No", termina el flujo amablemente.
- Para preguntas generales o de seguimiento fuera del flujo, responde directo sin seguir los pasos.
- NO uses el token [[split]].
- Usa ## para el título de cada sección (ej: ## Descripción, ## Fórmula (%), etc.).
- Si no tienes suficiente información para la receta, haz máximo 2 preguntas antes de empezar.`;

const MODEL_CANDIDATES = [
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
];

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function streamModel(modelName, contents, apiKey, onChunk) {
  const url = `${GEMINI_BASE}/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents,
    generationConfig: {
      maxOutputTokens: 5000,
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
  if (!prompt) return res.status(400).json({ error: 'Missing prompt.' });

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sse = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const contents = [
    ...history.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: prompt }] },
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
