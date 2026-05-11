require('dotenv').config();
const { sendEmail } = require('../api/_resend');

async function main() {
  await sendEmail({
    to: 'nico.acosta.x@gmail.com',
    subject: '✅ Confirmación de tu compra en Be Alquimist',
    bloques: [
      { type: 'h1', content: '¡Gracias por tu compra, Nico! 🕯️' },
      { type: 'text', content: 'Hemos recibido tu pago correctamente. Aquí están los detalles de tu pedido:' },
      { type: 'divider' },
      { type: 'h2', content: 'Resumen del pedido' },
      { type: 'text', content: 'Monto pagado: $1499.00 MXN\nNombre: Nico Acosta\nCorreo: nico.acosta.x@gmail.com' },
      { type: 'divider' },
      { type: 'text', content: 'En breve recibirás más información sobre tu pedido. Si tienes alguna duda, responde este correo o contáctanos por WhatsApp.' },
      { type: 'button', content: 'Ir a Be Alquimist', url: 'https://bealquimist.com', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  });
  console.log('Correo enviado a nico.acosta.x@gmail.com');
}

main().catch(console.error);
