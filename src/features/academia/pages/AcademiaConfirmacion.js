import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PASOS = [
  {
    num: '1',
    icon: '📬',
    titulo: 'Confirma tu correo electrónico',
    desc: 'Te enviamos un enlace mágico a tu correo. Haz clic en él para activar tu cuenta y acceder a todo el contenido.',
    tip: 'Si no lo ves, revisa tu carpeta de spam o promociones.',
    action: null,
  },
  {
    num: '2',
    icon: '💬',
    titulo: 'Únete al grupo de WhatsApp',
    desc: 'Conecta con la comunidad de alquimistas, comparte dudas, avances y recibe novedades exclusivas directamente en tu teléfono.',
    tip: null,
    action: {
      label: 'Unirme al grupo de WhatsApp',
      href: 'https://chat.whatsapp.com/KVN6V1jrR2YAGzRKQNvnkd?mode=gi_t',
      whatsapp: true,
    },
  },
  {
    num: '3',
    icon: '✍️',
    titulo: 'Haz tu primera publicación',
    desc: '¡Preséntate en la comunidad! Cuéntanos quién eres, por qué te interesa la cosmética natural y qué quieres aprender.',
    tip: null,
    action: {
      label: 'Ir a la comunidad →',
      href: 'https://bealquimist.com/comunidad',
      whatsapp: false,
    },
  },
  {
    num: '4',
    icon: '🚀',
    titulo: 'Explora la academia',
    desc: 'Entra a tu cuenta, conoce los cursos disponibles, participa en la comunidad y empieza tu camino como alquimista.',
    tip: null,
    action: {
      label: 'Entrar a la comunidad →',
      href: '/comunidad',
      whatsapp: false,
      internal: true,
    },
  },
];

export default function AcademiaConfirmacion() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.fbq) window.fbq('track', 'Lead');
  }, []);

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'Poppins, sans-serif',
      background: 'linear-gradient(160deg, #F3EFE8 0%, #EDE0D4 50%, #F9F5EF 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Blobs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(176,137,104,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(176,137,104,0.06)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 560, width: '100%', position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚗️</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1px solid #EDE0D4', borderRadius: 30,
            padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#B08968',
            marginBottom: 18, boxShadow: '0 2px 8px rgba(176,137,104,0.12)',
            letterSpacing: 0.5,
          }}>
            🎉 ¡Ya casi estás dentro!
          </div>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 900, color: '#2C2318', margin: '0 0 12px', lineHeight: 1.15,
          }}>
            Bienvenida a la academia
          </h1>
          <p style={{ color: '#7A6A5A', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            Completa estos 3 pasos para aprovechar al máximo tus <strong>7 días gratis</strong>.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PASOS.map((paso, i) => (
            <div
              key={i}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: '24px 28px',
                border: '1px solid #EDE0D4',
                boxShadow: '0 4px 16px rgba(176,137,104,0.08)',
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              {/* Number bubble */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #B08968, #8C6A4F)',
                color: '#fff', fontWeight: 900, fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(176,137,104,0.35)',
                fontFamily: 'Georgia, serif',
              }}>
                {paso.num}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{paso.icon}</span>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 900, color: '#2C2318', margin: 0 }}>
                    {paso.titulo}
                  </h3>
                </div>
                <p style={{ color: '#7A6A5A', fontSize: 13, lineHeight: 1.7, margin: '0 0 14px' }}>
                  {paso.desc}
                </p>
                {paso.tip && (
                  <p style={{ color: '#B08968', fontSize: 12, fontWeight: 600, margin: '0 0 14px', background: '#FBF5EE', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid #B08968' }}>
                    💡 {paso.tip}
                  </p>
                )}
                {paso.action && paso.action.internal && (
                  <button
                    onClick={() => navigate(paso.action.href)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      textDecoration: 'none', border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #B08968, #8C6A4F)',
                      color: '#fff', borderRadius: 10, padding: '11px 22px',
                      fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                      boxShadow: '0 4px 14px rgba(176,137,104,0.35)',
                    }}
                  >
                    {paso.action.label}
                  </button>
                )}
                {paso.action && !paso.action.internal && (
                  <a
                    href={paso.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      textDecoration: 'none',
                      background: paso.action.whatsapp
                        ? 'linear-gradient(135deg, #25D366, #128C7E)'
                        : 'linear-gradient(135deg, #B08968, #8C6A4F)',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '11px 22px',
                      fontSize: 14, fontWeight: 700,
                      boxShadow: paso.action.whatsapp
                        ? '0 4px 14px rgba(37,211,102,0.35)'
                        : '0 4px 14px rgba(176,137,104,0.35)',
                    }}
                  >
                    {paso.action.whatsapp && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    )}
                    {paso.action.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer link */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => navigate('/academia')}
            style={{ background: 'none', border: 'none', color: '#9E8E80', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
          >
            ← Volver a la academia
          </button>
        </div>
      </div>
    </div>
  );
}
