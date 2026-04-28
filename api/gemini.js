const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `Eres Be Alquimist, asistente experto en cosmética natural y formulación artesanal.
Responde siempre en español, de forma clara, cálida y accionable.
Cuando des fórmulas incluye porcentajes exactos y un paso a paso numerado.
Si el usuario no da suficiente información, haz máximo 3 preguntas concretas antes de asumir.
Usa formato Markdown: **negrita** para términos clave, listas numeradas para pasos, listas con guiones para ingredientes.`;

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
