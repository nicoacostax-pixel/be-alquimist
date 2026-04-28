const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Eres Be Alquimist, asistente experto en cosmética natural y formulación artesanal para el mercado mexicano.
Responde SIEMPRE en español, de forma cálida y profesional.

Cuando el usuario pida una receta o fórmula, SIEMPRE estructura tu respuesta con estas 6 secciones exactas (sin omitir ninguna):

## Descripción
Descripción del producto, sus beneficios y para quién está indicado (2-4 oraciones).

## Fórmula (%)
Lista cada ingrediente con su porcentaje. El total debe sumar 100%.
- Ingrediente A: XX%
- Ingrediente B: XX%

## Receta en gramos (100g)
Lista cada ingrediente con su cantidad exacta en gramos para una batch de 100g.
- Ingrediente A: XXg
- Ingrediente B: XXg

## Instrucciones paso a paso
Pasos numerados, claros y precisos incluyendo temperatura, orden de mezcla y tiempos.

## Dónde comprar los ingredientes
Por cada ingrediente menciona 1-2 proveedores en México (Alibek, Cosmética MX, Formulario, tiendas en línea, etc.) con precio aproximado en MXN por kilogramo o gramo.

## Calculadora de costos
Tabla con: ingrediente | cantidad usada | precio aprox por gramo | costo
Luego calcula:
- **Costo total de materiales:** $XX.XX MXN (por 100g)
- **Precio sugerido de venta (3x margen):** $XX.XX MXN
- **Precio sugerido de venta (4x margen):** $XX.XX MXN
- **Precio por unidad (ej. frasco de 50g):** $XX.XX MXN

Si el usuario no ha dado suficiente información para formular, haz máximo 3 preguntas concretas ANTES de mostrar la estructura.
Para preguntas generales o de seguimiento responde directamente sin usar la estructura de secciones.`;

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
];

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
      const msg = e?.message || '';
      const skip = e?.status === 404 || e?.status === 429 ||
        msg.includes('not found') || msg.includes('404') ||
        msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests');
      if (skip) continue;
      break;
    }
  }

  const err = lastErr || new Error('No compatible model found');
  return res.status(500).json({
    error: 'Gemini request failed.',
    details: { name: err.name, message: err.message },
  });
};
