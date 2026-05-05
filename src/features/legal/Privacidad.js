import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4A3F35', marginBottom: 10 }}>{title}</h2>
    <div style={{ fontSize: 15, color: '#5A4A3A', lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function Privacidad() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>

        <Link to="/insumos" style={{ fontSize: 13, color: '#B08968', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← Volver a la tienda
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2D2D2D', marginBottom: 8 }}>Política de privacidad</h1>
        <p style={{ fontSize: 13, color: '#9E9188', marginBottom: 40 }}>Última actualización: mayo 2025</p>

        <Section title="1. Responsable del tratamiento">
          <p>Be Alquimist es el responsable del tratamiento de tus datos personales recopilados a través de bealquimist.com. Para cualquier consulta relacionada con el manejo de tu información, puedes contactarnos en <a href="mailto:hola@bealquimist.com" style={{ color: '#B08968' }}>hola@bealquimist.com</a>.</p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <p>Recopilamos la siguiente información cuando utilizas nuestra plataforma:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Datos de registro:</strong> nombre, correo electrónico y número de teléfono.</li>
            <li><strong>Datos de compra:</strong> dirección de envío, información de pago (procesada de forma segura por Stripe, nunca almacenamos datos de tarjeta).</li>
            <li><strong>Datos de uso:</strong> páginas visitadas, interacciones con el chat de IA, recetas generadas.</li>
            <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y sistema operativo.</li>
          </ul>
        </Section>

        <Section title="3. Finalidad del tratamiento">
          <p>Utilizamos tus datos para:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Gestionar tu cuenta y pedidos.</li>
            <li>Enviarte confirmaciones de compra y actualizaciones de envío.</li>
            <li>Mejorar nuestra plataforma y personalizar tu experiencia.</li>
            <li>Enviarte comunicaciones de marketing (solo si has dado tu consentimiento).</li>
            <li>Cumplir con obligaciones legales.</li>
          </ul>
        </Section>

        <Section title="4. Base legal del tratamiento">
          <p>El tratamiento de tus datos se basa en la ejecución del contrato de compraventa, tu consentimiento explícito para comunicaciones comerciales y el cumplimiento de obligaciones legales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.</p>
        </Section>

        <Section title="5. Compartición de datos con terceros">
          <p>No vendemos ni cedemos tus datos personales a terceros. Únicamente compartimos información con proveedores de servicios estrictamente necesarios para operar la plataforma:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Stripe:</strong> procesamiento de pagos.</li>
            <li><strong>Supabase:</strong> almacenamiento de datos.</li>
            <li><strong>Resend:</strong> envío de correos transaccionales.</li>
            <li><strong>Google (Gemini):</strong> generación de recetas con IA.</li>
          </ul>
          <p style={{ marginTop: 10 }}>Todos estos proveedores cuentan con sus propias políticas de privacidad y medidas de seguridad.</p>
        </Section>

        <Section title="6. Cookies y tecnologías de seguimiento">
          <p>Utilizamos cookies esenciales para el funcionamiento de la plataforma y cookies de análisis (Meta Pixel) para medir el rendimiento de nuestras campañas publicitarias. Puedes desactivar las cookies no esenciales desde la configuración de tu navegador.</p>
        </Section>

        <Section title="7. Retención de datos">
          <p>Conservamos tus datos personales mientras tu cuenta esté activa o sea necesario para cumplir con nuestras obligaciones legales. Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento.</p>
        </Section>

        <Section title="8. Tus derechos (ARCO)">
          <p>Conforme a la LFPDPPP, tienes derecho a:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos incorrectos o incompletos.</li>
            <li><strong>Cancelación:</strong> solicitar la eliminación de tus datos.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos.</li>
          </ul>
          <p style={{ marginTop: 10 }}>Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:hola@bealquimist.com" style={{ color: '#B08968' }}>hola@bealquimist.com</a>.</p>
        </Section>

        <Section title="9. Seguridad">
          <p>Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos no autorizados, pérdida o alteración. Sin embargo, ningún sistema es 100% seguro, por lo que te recomendamos mantener tu contraseña confidencial.</p>
        </Section>

        <Section title="10. Cambios a esta política">
          <p>Podemos actualizar esta política de privacidad en cualquier momento. Te notificaremos sobre cambios significativos por correo electrónico o mediante un aviso destacado en la plataforma.</p>
        </Section>

      </div>
    </div>
  );
}
