const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load env from project root regardless of where the process is started from.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false });

const PORT = process.env.PORT || 5050;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing GEMINI_API_KEY. Create a .env file with GEMINI_API_KEY=...');
} else {
  // eslint-disable-next-line no-console
  console.log(`GEMINI_API_KEY loaded (length=${String(GEMINI_API_KEY).length})`);
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/gemini', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ error: 'Server not configured (missing GEMINI_API_KEY).' });
    }

    const prompt = (req.body?.prompt || '').toString().trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt.' });
    }

    const preferredModel = (process.env.GEMINI_MODEL || '').trim();
    const modelCandidates = [
      preferredModel,
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro',
    ].filter(Boolean);

    const systemStyle = [
      'Eres Be Alquimist, un asistente experto en cosmética natural.',
      'Responde en español, de forma clara y accionable.',
      'Cuando des fórmulas, incluye porcentajes y un paso a paso breve.',
      'Si faltan datos, haz 1-3 preguntas concretas antes de asumir.',
    ].join(' ');

    let lastErr = null;
    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(`${systemStyle}\n\nUsuario: ${prompt}`);
        const text = result?.response?.text?.() || '';
        return res.json({ text, model: modelName });
      } catch (e) {
        lastErr = e;
        // If a model is not available for this API key/version, try the next one.
        // Most common symptom is 404 Not Found with "model ... is not found".
        const status = e?.status;
        if (status === 404) continue;
        break;
      }
    }

    throw lastErr || new Error('No compatible model found');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Gemini error:', err);
    return res.status(500).json({
      error: 'Gemini request failed.',
      details: err && typeof err === 'object' ? { name: err.name, message: err.message } : { message: String(err) },
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});

