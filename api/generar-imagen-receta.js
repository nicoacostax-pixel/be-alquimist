module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { titulo, tipo, ingredientes } = req.body || {};
  if (!titulo) return res.status(400).json({ error: 'Falta titulo' });

  const ingredientesTexto = (ingredientes || []).slice(0, 3).join(', ');
  const prompt = encodeURIComponent(
    `professional product photography natural organic cosmetic ${tipo || 'skincare'}, ${ingredientesTexto || 'botanical ingredients'}, minimalist spa, soft lighting, cream beige terracotta palette, white background, high-end beauty brand, no text`
  );

  try {
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=630&nologo=true&seed=${Date.now()}`;
    const imgRes = await fetch(url, { signal: AbortSignal.timeout(40000) });

    if (!imgRes.ok) {
      return res.status(500).json({ error: `Pollinations error ${imgRes.status}` });
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const b64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

    return res.status(200).json({ imageBase64: b64, mimeType });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
