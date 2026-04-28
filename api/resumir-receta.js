module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { receta } = req.body || {};
  if (!receta) return res.status(400).json({ error: 'Falta receta' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });

  const prompt = `Eres un asistente de cosmética natural. A partir de esta receta, extrae la información clave y devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código:
{"titulo":"nombre corto de la receta máximo 60 caracteres","descripcion":"descripción de 2-3 oraciones para el foro","ingredientes":["ingrediente 1 con porcentaje","ingrediente 2 con porcentaje","ingrediente 3 con porcentaje","ingrediente 4 con porcentaje"],"tipo":"categoría del producto"}

Receta:
${receta.slice(0, 4000)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.2, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(500).json({ error: `Gemini error ${response.status}: ${errData?.error?.message || response.statusText}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(500).json({ error: 'Gemini no devolvió contenido' });

    // Limpiar cualquier markdown que Gemini agregue a pesar del mime type
    const clean = text.replace(/```json[\s\S]*?```|```[\s\S]*?```/g, t =>
      t.replace(/```json|```/g, '')
    ).trim();

    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
