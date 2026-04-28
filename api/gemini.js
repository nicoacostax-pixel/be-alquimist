import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // 1. Configuración de seguridad y métodos
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });
  }

  const prompt = (req.body?.prompt || '').toString().trim();
  if (!prompt) {
    return res.status(400).json({ error: 'Falta el prompt del usuario.' });
  }

  const systemStyle = [
    'Eres Be Alquimist, un asistente experto en cosmética natural.',
    'Responde en español, de forma clara y accionable.',
    'Cuando des fórmulas, incluye porcentajes y un paso a paso breve.',
    'Si faltan datos, haz 1-3 preguntas concretas antes de asumir.',
  ].join(' ');

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  // 2. Priorizamos 1.5-flash porque es el que tiene la cuota más estable y gratuita
  const modelCandidates = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-lite-preview-02-05',
    'gemini-pro',
  ];

  let lastErr = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`${systemStyle}\n\nUsuario: ${prompt}`);
      const response = await result.response;
      const text = response.text();
      
      return res.status(200).json({ text, model: modelName });
    } catch (e) {
      lastErr = e;
      // Si es error de cuota (429) o no encontrado (404), intentamos con el siguiente
      if (e.status === 429 || e.status === 404 || e.message.includes('quota')) {
        continue;
      }
      break; 
    }
  }

  return res.status(500).json({
    error: 'Hubo un problema al conectar con el laboratorio',
    details: lastErr?.message
  });
}