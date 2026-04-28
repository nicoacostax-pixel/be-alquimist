const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const systemStyle = [
  'Eres Be Alquimist, un asistente experto en cosmética natural.',
  'Responde en español, de forma clara y accionable.',
  'Cuando des fórmulas, incluye porcentajes y un paso a paso breve.',
  'Si faltan datos, haz 1-3 preguntas concretas antes de asumir.',
].join(' ');

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server not configured (missing GEMINI_API_KEY).' });
  }

  const prompt = (req.body?.prompt || '').toString().trim();
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt.' });
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const modelCandidates = [
    (process.env.GEMINI_MODEL || '').trim(),
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-pro',
  ].filter(Boolean);

  let lastErr = null;
  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`${systemStyle}\n\nUsuario: ${prompt}`);
      const text = result?.response?.text?.() || '';
      return res.status(200).json({ text, model: modelName });
    } catch (e) {
      lastErr = e;
      if (e?.status === 404) continue;
      break;
    }
  }

  const err = lastErr || new Error('No compatible model found');
  return res.status(500).json({
    error: 'Gemini request failed.',
    details: { name: err.name, message: err.message },
  });
};
