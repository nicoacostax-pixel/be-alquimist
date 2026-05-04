const { sendEmail, getTemplate, supabase } = require('./_resend');

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const claims = JSON.parse(json);
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch { return null; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { action, token } = req.body || {};

  // Verificar admin
  const adminEmail = process.env.ADMIN_EMAIL || process.env.REACT_APP_ADMIN_EMAIL;
  const claims = decodeJwt(token);
  if (!claims?.email) return res.status(401).json({ error: 'Token inválido o expirado' });
  if (adminEmail && claims.email !== adminEmail) return res.status(403).json({ error: 'Acceso denegado' });

  try {
    // ── Guardar plantilla ──────────────────────────────────────────
    if (action === 'saveTemplate') {
      const { id, nombre, asunto, fuente, bloques } = req.body;
      const { error } = await supabase.from('email_plantillas').upsert({
        id, nombre, asunto, fuente, bloques, updated_at: new Date().toISOString(),
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    }

    // ── Obtener plantilla ──────────────────────────────────────────
    if (action === 'getTemplate') {
      const { id } = req.body;
      const tpl = await getTemplate(id);
      return res.json({ template: tpl });
    }

    // ── Listar plantillas ──────────────────────────────────────────
    if (action === 'listTemplates') {
      const { data, error } = await supabase
        .from('email_plantillas')
        .select('id, nombre, asunto, updated_at')
        .order('updated_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ templates: data });
    }

    // ── Eliminar plantilla ─────────────────────────────────────────
    if (action === 'deleteTemplate') {
      const { id } = req.body;
      const { error } = await supabase.from('email_plantillas').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    }

    // ── Enviar email de prueba ─────────────────────────────────────
    if (action === 'sendTest') {
      const { asunto, fuente, bloques, to } = req.body;
      if (!to) return res.status(400).json({ error: 'Falta el email de destino' });
      await sendEmail({ to, subject: asunto, bloques, fuente });
      return res.json({ ok: true });
    }

    // ── Enviar campaña a todos los leads ───────────────────────────
    if (action === 'sendCampaign') {
      const { asunto, fuente, bloques } = req.body;
      const { data: leads, error: leadsErr } = await supabase.from('leads').select('email');
      if (leadsErr) return res.status(500).json({ error: leadsErr.message });

      const emails = [...new Set(leads.map(l => l.email).filter(Boolean))];
      if (emails.length === 0) return res.json({ ok: true, total: 0, failed: 0 });

      // Enviar en lotes de 10 para no saturar Resend
      const BATCH = 10;
      let failed = 0;
      for (let i = 0; i < emails.length; i += BATCH) {
        const batch = emails.slice(i, i + BATCH);
        const results = await Promise.allSettled(
          batch.map(email => sendEmail({ to: email, subject: asunto, bloques, fuente }))
        );
        failed += results.filter(r => r.status === 'rejected').length;
      }

      return res.json({ ok: true, total: emails.length, failed });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
