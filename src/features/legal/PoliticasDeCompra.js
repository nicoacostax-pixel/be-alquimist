import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4A3F35', marginBottom: 10 }}>{title}</h2>
    <div style={{ fontSize: 15, color: '#5A4A3A', lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function PoliticasDeCompra() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>

        <Link to="/insumos" style={{ fontSize: 13, color: '#B08968', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← Volver a la tienda
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2D2D2D', marginBottom: 8 }}>Políticas de compra</h1>
        <p style={{ fontSize: 13, color: '#9E9188', marginBottom: 40 }}>Última actualización: mayo 2025</p>

        <Section title="1. Proceso de compra">
          <p>Al realizar un pedido en bealquimist.com aceptas nuestros términos y condiciones. El proceso de compra se completa al recibir la confirmación de pago. Nos reservamos el derecho de cancelar pedidos en caso de error en precios o disponibilidad de inventario.</p>
        </Section>

        <Section title="2. Métodos de pago">
          <p>Aceptamos pagos con tarjeta de crédito y débito (Visa, Mastercard, American Express) a través de Stripe, plataforma segura con certificación PCI-DSS. Todos los precios están expresados en pesos mexicanos (MXN) e incluyen IVA.</p>
        </Section>

        <Section title="3. Envíos">
          <p>Realizamos envíos a todo México. El tiempo de entrega estimado es de <strong>3 a 7 días hábiles</strong> a partir de la confirmación del pago. Los envíos son gratuitos en compras mayores a <strong>$1,999 MXN</strong>. Para pedidos menores, el costo de envío es de <strong>$99 MXN</strong>.</p>
          <p style={{ marginTop: 10 }}>Los miembros <strong>Alquimist PRO</strong> disfrutan de envíos gratuitos en todos sus pedidos durante su suscripción activa.</p>
        </Section>

        <Section title="4. Devoluciones y cambios">
          <p>Tienes <strong>7 días naturales</strong> a partir de la recepción de tu pedido para solicitar una devolución o cambio. El producto debe estar en su empaque original, sin abrir y sin haber sido utilizado.</p>
          <p style={{ marginTop: 10 }}>Para iniciar el proceso, escríbenos a <a href="mailto:hola@bealquimist.com" style={{ color: '#B08968' }}>hola@bealquimist.com</a> con tu número de pedido y el motivo de la devolución. No aplican devoluciones en productos que hayan sido abiertos por razones de higiene y seguridad.</p>
        </Section>

        <Section title="5. Productos dañados o incorrectos">
          <p>Si recibes un producto dañado o diferente al que ordenaste, contáctanos en un plazo de <strong>48 horas</strong> después de la entrega a través de <a href="mailto:hola@bealquimist.com" style={{ color: '#B08968' }}>hola@bealquimist.com</a>. Te pediremos evidencia fotográfica para procesar el reemplazo o reembolso sin costo adicional.</p>
        </Section>

        <Section title="6. Cancelaciones">
          <p>Puedes cancelar tu pedido sin costo alguno si aún no ha sido enviado. Una vez despachado, aplican las condiciones de devolución descritas en la sección 4. Para cancelar, escríbenos a la brevedad posible a <a href="mailto:hola@bealquimist.com" style={{ color: '#B08968' }}>hola@bealquimist.com</a>.</p>
        </Section>

        <Section title="7. Disponibilidad de productos">
          <p>Todos nuestros productos están sujetos a disponibilidad de inventario. En caso de que un producto no esté disponible después de realizar tu compra, te notificaremos de inmediato y ofreceremos un reembolso completo o un producto sustituto.</p>
        </Section>

        <Section title="8. Contacto">
          <p>Para cualquier duda sobre tu pedido o nuestras políticas de compra, escríbenos a <a href="mailto:hola@bealquimist.com" style={{ color: '#B08968' }}>hola@bealquimist.com</a>. Atendemos de lunes a viernes de 9:00 a 18:00 hrs (CDMX).</p>
        </Section>

      </div>
    </div>
  );
}
