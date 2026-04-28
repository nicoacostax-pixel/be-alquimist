import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('App crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <span style={{ fontSize: 48 }}>⚗️</span>
          <h2 style={{ marginTop: 16, color: '#B08968' }}>Algo salió mal</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>El laboratorio tuvo un problema. Intenta recargar la página.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#B08968', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 16, cursor: 'pointer' }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
