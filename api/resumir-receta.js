module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { receta } = req.body || {};
  if (!receta) return res.status(400).json({ error: 'Falta receta' });

  const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key no configurada' });

  const prompt = `Eres un asistente de cosmética natural. A partir de esta receta completa, extrae la información clave y devuelve un JSON con esta estructura exacta (sin markdown, sin explicaciones, solo el JSON):
{
  "titulo": "nombre corto y atractivo de la receta (máx 60 chars)",
  "descripcion": "descripción breve de 2-3 oraciones para el foro",
  "ingredientes": ["ingrediente 1 con %", "ingrediente 2 con %", "ingrediente 3 con %", "ingrediente 4 con %"],
  "tipo": "categoría del producto (ej: Sérum facial, Crema corporal, Champú, etc.)"
}

Receta:
${receta.slice(0, 4000)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
        }),
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
