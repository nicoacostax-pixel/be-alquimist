const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, nombre } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY no configurada' });

  const resend = new Resend(apiKey);
  const firstName = (nombre || 'Alquimista').split(' ')[0];

  try {
    await resend.emails.send({
      from: 'Be Alquimist <hola@bealquimist.com>',
      to: email,
      subject: '¡Bienvenida al laboratorio, Alquimista! 🌿',
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#B08968;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:1px;">Be Alquimist</p>
              <p style="margin:6px 0 0;font-size:13px;color:#F4EFE8;letter-spacing:2px;text-transform:uppercase;">Cosmética Natural con IA</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#2D2D2D;">¡Hola, ${firstName}! 🌿</p>
              <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                Bienvenida al laboratorio. Ya eres parte de la comunidad de Alquimistas que transforma ingredientes naturales en cosméticos increíbles.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Con tu cuenta nueva tienes <strong style="color:#B08968;">3 elementos gratis</strong> para comenzar a formular recetas con IA. Se recargan automáticamente cada 24 horas.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#B08968;border-radius:24px;">
                    <a href="https://bealquimist.com" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Ir al laboratorio →
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #EDE8E1;margin:0 0 24px;" />

              <!-- Tips -->
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#B08968;text-transform:uppercase;letter-spacing:1px;">Lo que puedes hacer</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#555;">⚗️ &nbsp;Generar fórmulas completas con porcentajes</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#555;">🛒 &nbsp;Comprar insumos de cosmética natural</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#555;">💬 &nbsp;Compartir recetas con la comunidad</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#555;">📚 &nbsp;Explorar la biblioteca de ingredientes</td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #EDE8E1;margin:24px 0;" />

              <!-- PRO Upsell -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#FDF6EE;border-radius:12px;border:1px solid #E8D9C5;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#B08968;text-transform:uppercase;letter-spacing:1.5px;">Alquimist Pro</p>
                    <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#2D2D2D;">Lleva tu formulación al siguiente nivel</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;">
                      Por solo <strong style="color:#B08968;">$149 MXN al mes</strong> desbloqueas elementos ilimitados para formular con IA y envíos gratuitos en todos tus pedidos durante el mes.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                      <tr>
                        <td style="font-size:14px;color:#555;padding:4px 0;">✨ &nbsp;Elementos ilimitados para formular</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#555;padding:4px 0;">🚚 &nbsp;Envíos gratuitos todo el mes</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#555;padding:4px 0;">⚗️ &nbsp;Acceso prioritario a nuevas funciones</td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#2D2D2D;border-radius:24px;">
                          <a href="https://bealquimist.com/pro" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                            Quiero ser PRO →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F7F3EE;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">
                Recibiste este correo porque te registraste en bealquimist.com<br/>
                © ${new Date().getFullYear()} Be Alquimist
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error enviando email de bienvenida:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
