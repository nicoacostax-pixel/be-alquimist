module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { titulo, tipo, ingredientes } = req.body || {};
  if (!titulo) return res.status(400).json({ error: 'Falta titulo' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });

  const ingredientesTexto = (ingredientes || []).slice(0, 4).join(', ');
  const prompt = `Professional product photography of a natural organic cosmetic ${tipo || 'skincare product'}, artisan handmade, botanical ingredients including ${ingredientesTexto || 'natural oils and plant extracts'}, minimalist spa aesthetic, soft natural lighting, cream beige and terracotta color palette, clean white background, high-end beauty brand style, no text, no labels`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: '16:9' },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: `Imagen error ${response.status}: ${err?.error?.message || response.statusText}` });
    }

    const data = await response.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return res.status(500).json({ error: 'No se generó imagen' });

    return res.status(200).json({ imageBase64: b64 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
