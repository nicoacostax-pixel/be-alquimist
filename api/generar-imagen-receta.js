const IMAGE_MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp',
];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { titulo, tipo, ingredientes } = req.body || {};
  if (!titulo) return res.status(400).json({ error: 'Falta titulo' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });

  const ingredientesTexto = (ingredientes || []).slice(0, 4).join(', ');
  const prompt = `Professional product photography of a natural organic cosmetic ${tipo || 'skincare product'}, artisan handmade, botanical ingredients including ${ingredientesTexto || 'natural oils and plant extracts'}, minimalist spa aesthetic, soft natural lighting, cream beige and terracotta color palette, clean white background, high-end beauty brand style, no text, no labels`;

  const errors = [];

  for (const model of IMAGE_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        errors.push(`${model}: ${response.status} — ${data?.error?.message || JSON.stringify(data)}`);
        continue;
      }

      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

      if (!imagePart) {
        errors.push(`${model}: respuesta OK pero sin imagen. Parts: ${JSON.stringify(parts).slice(0, 200)}`);
        continue;
      }

      return res.status(200).json({
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
      });
    } catch (err) {
      errors.push(`${model}: ${err.message}`);
    }
  }

  return res.status(500).json({ error: errors.join(' | ') });
};
