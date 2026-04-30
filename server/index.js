const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');

// Load env from project root regardless of where the process is started
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false });

const PORT = process.env.PORT || 5050;
const app  = express();

app.use(cors({ origin: '*' }));

// ── Stripe webhook: raw body MUST come before express.json() ──────────────────
app.post('/api/stripe-webhook', express.raw({ type: '*/*' }), (req, res) => {
  require('../api/stripe-webhook')(req, res);
});

// ── JSON body parser (10 MB for image uploads) ────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── API routes (mount each Vercel-style handler) ──────────────────────────────
const API_ROUTES = [
  'gemini',
  'admin',
  'cuenta',
  'comprar-elementos',
  'create-payment-intent',
  'generar-imagen-receta',
  'resumir-receta',
  'leads',
  'recetas',
];

for (const name of API_ROUTES) {
  app.all(`/api/${name}`, (req, res) => {
    require(`../api/${name}`)(req, res);
  });
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Serve React production build ───────────────────────────────────────────────
const buildDir = path.join(__dirname, '..', 'build');
app.use(express.static(buildDir));

// ── React Router: serve index.html for all non-API paths ──────────────────────
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ready → http://0.0.0.0:${PORT}`);
});
