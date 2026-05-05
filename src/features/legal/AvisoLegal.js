import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#4A3F35', marginBottom: 10 }}>{title}</h2>
    <div style={{ fontSize: 15, color: '#5A4A3A', lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function AvisoLegal() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>

        <Link to="/insumos" style={{ fontSize: 13, color: '#B08968', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← Volver a la tienda
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2D2D2D', marginBottom: 8 }}>Aviso legal</h1>
        <p style={{ fontSize: 13, color: '#9E9188', marginBottom: 40 }}>Última actualización: mayo 2025</p>

        <Section title="1. Identificación del titular">
          <p>El sitio web bealquimist.com es operado por <strong>Be Alquimist</strong>, con domicilio en México. Para cualquier consulta puedes contactarnos en <a href="mailto:hola@bealquimist.com" style={{ color: '#B08968' }}>hola@bealquimist.com</a>.</p>
        </Section>

        <Section title="2. Objeto">
          <p>Be Alquimist es una plataforma de comercio electrónico especializada en la venta de insumos para cosmética natural, complementada con herramientas de inteligencia artificial para la formulación de cosméticos. El acceso y uso del sitio implica la aceptación plena de las condiciones establecidas en este aviso legal.</p>
        </Section>

        <Section title="3. Propiedad intelectual">
          <p>Todos los contenidos de bealquimist.com —incluyendo textos, imágenes, logotipos, diseño, código fuente y recetas generadas por nuestra IA— son propiedad de Be Alquimist o de sus respectivos titulares y están protegidos por las leyes de propiedad intelectual aplicables en México.</p>
          <p style={{ marginTop: 10 }}>Queda prohibida la reproducción, distribución, transformación o comunicación pública de cualquier elemento del sitio sin autorización expresa y por escrito de Be Alquimist.</p>
        </Section>

        <Section title="4. Uso de la plataforma">
          <p>El usuario se compromete a utilizar la plataforma de conformidad con la ley, la moral, el orden público y las presentes condiciones. Queda expresamente prohibido:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Utilizar la plataforma con fines ilícitos o que vulneren derechos de terceros.</li>
            <li>Introducir virus u otros elementos que puedan dañar los sistemas informáticos.</li>
            <li>Intentar acceder a áreas restringidas del sitio sin autorización.</li>
            <li>Reproducir o explotar comercialmente los contenidos sin autorización.</li>
          </ul>
        </Section>

        <Section title="5. Información sobre productos">
          <p>Be Alquimist realiza sus mejores esfuerzos para que la información sobre los productos (descripciones, imágenes, precios) sea exacta y actualizada. Sin embargo, pueden existir errores tipográficos o discrepancias que no generan obligación contractual. Nos reservamos el derecho de corregir dichos errores en cualquier momento.</p>
        </Section>

        <Section title="6. Uso de inteligencia artificial">
          <p>Las recetas y fórmulas generadas por nuestro asistente de IA son orientativas y tienen fines educativos. Be Alquimist no se hace responsable del uso que el usuario haga de dichas fórmulas ni de los resultados obtenidos al aplicarlas. Se recomienda realizar pruebas de seguridad y estabilidad antes de usar cualquier fórmula cosmética.</p>
        </Section>

        <Section title="7. Limitación de responsabilidad">
          <p>Be Alquimist no será responsable de daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la plataforma. La responsabilidad máxima de Be Alquimist se limita al importe pagado por el usuario en la transacción que originó el daño.</p>
        </Section>

        <Section title="8. Legislación aplicable">
          <p>El presente aviso legal se rige por la legislación mexicana, en particular por la Ley Federal de Protección al Consumidor, el Código de Comercio y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes en México.</p>
        </Section>

        <Section title="9. Modificaciones">
          <p>Be Alquimist se reserva el derecho de modificar este aviso legal en cualquier momento. Los cambios serán publicados en esta misma página con la fecha de actualización correspondiente.</p>
        </Section>

      </div>
    </div>
  );
}
