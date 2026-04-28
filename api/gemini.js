const SYSTEM_INSTRUCTION = `Eres Be Alquimist, asistente experto en cosmética natural y formulación artesanal para el mercado mexicano.
Responde SIEMPRE en español, de forma cálida y profesional.

Cuando el usuario pida una receta o fórmula, SIEMPRE responde con exactamente estas 6 secciones separadas por el token [[split]] (sin omitir ninguna ni agregar texto fuera de las secciones):

## Descripción
Descripción del producto, sus beneficios y para quién está indicado (2-4 oraciones).
[[split]]
## Fórmula (%)
Lista cada ingrediente con su porcentaje. El total debe sumar 100%. maximo 10 ingredientes.
- Ingrediente A: XX%
- Ingrediente B: XX%
[[split]]
## Receta en gramos (100g)
Lista cada ingrediente con su cantidad exacta en gramos para una batch de 100g. maximo 10 ingredientes.
- Ingrediente A: XXg
- Ingrediente B: XXg
[[split]]
## Instrucciones paso a paso
Pasos numerados, claros y precisos incluyendo temperatura, orden de mezcla y tiempos.
[[split]]
## Dónde comprar los ingredientes
Por cada ingrediente menciona 1-2 proveedores en México (Alibek, Cosmética MX, Formulario, tiendas en línea, etc.) con precio aproximado en MXN por kilogramo o gramo.
[[split]]
## Calculadora de costos
Sin desglosar por ingrediente. Solo muestra:
- **Costo total estimado (100g):** $XX.XX MXN
- **Precio de venta (3x):** $XX.XX MXN — ganancia: $XX.XX MXN
- **Precio de venta (4x):** $XX.XX MXN — ganancia: $XX.XX MXN

Si el usuario no ha dado suficiente información, haz máximo 3 preguntas concretas ANTES de mostrar la estructura.
Para preguntas generales o de seguimiento responde directamente sin [[split]] ni secciones.`;

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
];

const isNotFound = (e) => {
  const m = e?.message || '';
  return m.includes('404') || m.includes('not found');
};

const isTransient = (e) => {
  const m = e?.message || '';
  return m.includes('429') || m.includes('quota') || m.includes('503') || m.includes('Too Many Requests');
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body = {};
  try { body = await req.json(); } catch {}

  const prompt  = (body?.prompt  || '').toString().trim();
  const history = Array.isArray(body?.history) ? body.history : [];

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Missing prompt.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const sse = (ctrl, data) =>
    ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        const contents = [
          ...history.map(m => ({
            role: m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.text }],
          })),
          { role: 'user', parts: [{ text: prompt }] },
        ];

        const candidates = [process.env.GEMINI_MODEL, ...MODEL_CANDIDATES].filter(Boolean);
        let lastErr  = null;
        let dataSent = false;

        for (const modelName of candidates) {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_INSTRUCTION,
              });

              const result = await model.generateContentStream({ contents });

              for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                  sse(controller, { text });
                  dataSent = true;
                }
              }

              sse(controller, { done: true, model: modelName });
              controller.close();
              return;

            } catch (e) {
              lastErr = e;
              if (dataSent) {
                sse(controller, { error: e.message });
                controller.close();
                return;
              }
              if (isNotFound(e)) break;
              if (isTransient(e) && attempt === 0) {
                await new Promise(r => setTimeout(r, 1200));
                continue;
              }
              break;
            }
          }
        }

        sse(controller, { error: lastErr?.message || 'No compatible model found' });
        controller.close();

      } catch (e) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
