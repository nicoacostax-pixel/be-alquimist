const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
  'gemini-2.5-flash-lite',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const isNotFound = (e) => {
  const m = e?.message || '';
  return m.includes('404') || m.includes('not found');
};

const isTransient = (e) => {
  const m = e?.message || '';
  return m.includes('429') || m.includes('quota') || m.includes('503') || m.includes('Too Many Requests');
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  }

  const prompt  = (req.body?.prompt  || '').toString().trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  if (!prompt) return res.status(400).json({ error: 'Missing prompt.' });

  // SSE headers — flushHeaders() forces them to the client before any body
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sse = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: modelName.includes('2.5')
            ? { thinkingConfig: { thinkingBudget: 0 } }
            : {},
        });

        const result = await model.generateContentStream({ contents });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            sse({ text });
            dataSent = true;
          }
        }

        sse({ done: true, model: modelName });
        return res.end();

      } catch (e) {
        lastErr = e;
        if (dataSent) {
          sse({ error: e.message });
          return res.end();
        }
        if (isNotFound(e)) break;
        if (isTransient(e) && attempt === 0) {
          await sleep(1200);
          continue;
        }
        break;
      }
    }
  }

  sse({ error: lastErr?.message || 'No compatible model found' });
  res.end();
};
