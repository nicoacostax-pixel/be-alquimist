const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME  = 'Be Alquimist';

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(str) {
  return String(str || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function buildEmailHtml(bloques = [], fuente = 'Georgia, serif') {
  const blocks = bloques.map(b => {
    switch (b.type) {
      case 'h1':
        return `<h1 style="font-family:${fuente};color:#4A3F35;font-size:28px;line-height:1.3;margin:24px 0 12px;padding:0;">${esc(b.content)}</h1>`;
      case 'h2':
        return `<h2 style="font-family:${fuente};color:#6B5B4E;font-size:20px;line-height:1.4;margin:20px 0 8px;padding:0;">${esc(b.content)}</h2>`;
      case 'text':
        return `<p style="font-family:${fuente};color:#4A3F35;font-size:15px;line-height:1.7;margin:0 0 16px;padding:0;">${esc(b.content).replace(/\n/g,'<br/>')}</p>`;
      case 'image':
        return `<img src="${escAttr(b.content)}" alt="${escAttr(b.caption||'')}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:16px auto;" />`
             + (b.caption ? `<p style="text-align:center;color:#9E9188;font-size:12px;font-family:Arial,sans-serif;margin:-8px 0 16px;">${esc(b.caption)}</p>` : '');
      case 'button':
        return `<div style="text-align:center;margin:28px 0;"><a href="${escAttr(b.url||'#')}" style="display:inline-block;background:${escAttr(b.color||'#B08968')};color:#ffffff;padding:13px 36px;border-radius:8px;text-decoration:none;font-family:${fuente};font-size:15px;font-weight:bold;letter-spacing:0.5px;">${esc(b.content||'Botón')}</a></div>`;
      case 'divider':
        return `<hr style="border:none;border-top:1px solid #EDE0D4;margin:28px 0;" />`;
      default:
        return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Be Alquimist</title>
</head>
<body style="margin:0;padding:0;background-color:#F9F5F0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td style="background:#4A3F35;padding:28px 40px;text-align:center;">
          <p style="color:#F5EDE3;margin:0;font-family:Georgia,serif;font-size:22px;letter-spacing:3px;">⚗️ BE ALQUIMIST</p>
        </td></tr>
        <tr><td style="padding:40px;">
          ${blocks}
        </td></tr>
        <tr><td style="background:#F5EDE3;padding:20px 40px;text-align:center;">
          <p style="color:#9E9188;font-size:12px;font-family:Arial,sans-serif;margin:0;">
            © ${new Date().getFullYear()} Be Alquimist
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail({ to, subject, bloques, fuente }) {
  const html = buildEmailHtml(bloques, fuente);
  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
  if (error) throw new Error(error.message);
  return data;
}

async function getTemplate(id) {
  const { data } = await supabase.from('email_plantillas').select('*').eq('id', id).maybeSingle();
  return data;
}

module.exports = { buildEmailHtml, sendEmail, getTemplate, supabase };
