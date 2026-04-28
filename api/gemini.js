const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Eres Be Alquimist, asistente experto en cosmética natural y formulación artesanal para el mercado mexicano.
Responde SIEMPRE en español, de forma cálida y profesional.

Cuando el usuario pida una receta o fórmula, SIEMPRE responde con exactamente estas 6 secciones separadas por el token [[split]] (sin omitir ninguna ni agregar texto fuera de las secciones):

## Descripción
Descripción del producto, sus beneficios y para quién está indicado (2-4 oraciones).
[[split]]
## Fórmula (%)
Lista cada ingrediente con su porcentaje. El total debe sumar 100%. maximo 10 ingredientes.
- Ingrediente A: XX%
- Ingrediente B: XX%
[[split]]
## Receta en gramos (100g)
Lista cada ingrediente con su cantidad exacta en gramos para una batch de 100g. maximo 10 ingredientes.
- Ingrediente A: XXg
- Ingrediente B: XXg
[[split]]
## Instrucciones paso a paso
Pasos numerados, claros y precisos incluyendo temperatura, orden de mezcla y tiempos.
[[split]]
## Dónde comprar los ingredientes
Por cada ingrediente menciona 1-2 proveedores en México (Alibek, Cosmética MX, Formulario, tiendas en línea, etc.) con precio aproximado en MXN por kilogramo o gramo.
[[split]]
## Calculadora de costos
Sin desglosar por ingrediente. Solo muestra:
- **Costo total estimado (100g):** $XX.XX MXN
- **Precio de venta (3x):** $XX.XX MXN — ganancia: $XX.XX MXN
- **Precio de venta (4x):** $XX.XX MXN — ganancia: $XX.XX MXN

Si el usuario no ha dado suficiente información, haz máximo 3 preguntas concretas ANTES de mostrar la estructura.
Para preguntas generales o de seguimiento responde directamente sin [[split]] ni secciones.`;

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const isTransient = (e) => {
  const msg = e?.message || '';
  return e?.status === 429 || e?.status === 503 ||
    msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests') ||
    msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand');
};

const isNotFound = (e) => {
  const msg = e?.message || '';
  return e?.status === 404 || msg.includes('not found') || msg.includes('404');
};

const sse = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

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

  // SSE headers — must be set before any write
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

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
        });

        const streamResult = await model.generateContentStream({ contents });

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) {
            sse(res, { text });
            dataSent = true;
          }
        }

        sse(res, { done: true, model: modelName });
        return res.end();

      } catch (e) {
        lastErr = e;

        if (dataSent) {
          sse(res, { error: e.message });
          return res.end();
        }

        if (isNotFound(e)) break;
        if (isTransient(e)) {
          if (attempt === 0) { await sleep(1200); continue; }
          break;
        }
        break;
      }
    }
  }

  sse(res, { error: lastErr?.message || 'No compatible model found' });
  res.end();
};
