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
  'gemini-1.5-flash-latest',
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'Server not configured',
      details: { message: 'GEMINI_API_KEY environment variable is missing' },
    });
  }

  const prompt  = (req.body?.prompt  || '').toString().trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];

  if (!prompt) return res.status(400).json({ error: 'Missing prompt.' });

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  // Build Gemini conversation history format
  const contents = [
    ...history.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: prompt }] },
  ];

  let lastErr = null;
  const candidates = [process.env.GEMINI_MODEL, ...MODEL_CANDIDATES].filter(Boolean);

  for (const modelName of candidates) {
    // Each model gets up to 2 attempts on transient errors
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        });
        const result = await model.generateContent({ contents });
        const text = result?.response?.text?.() || '';
        return res.status(200).json({ text, model: modelName });
      } catch (e) {
        lastErr = e;
        if (isNotFound(e)) break; // skip to next model immediately
        if (isTransient(e)) {
          if (attempt === 0) { await sleep(1200); continue; } // retry once after delay
          break; // second attempt also failed → next model
        }
        // non-retryable error
        break;
      }
    }
  }

  const err = lastErr || new Error('No compatible model found');
  return res.status(500).json({
    error: 'Gemini request failed.',
    details: { name: err.name, message: err.message },
  });
};
