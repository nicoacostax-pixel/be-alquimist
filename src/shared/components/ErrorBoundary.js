import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <span style={{ fontSize: 48 }}>⚗️</span>
          <h2 style={{ marginTop: 16, color: '#B08968' }}>Algo salió mal</h2>
          <p style={{ color: '#666', marginBottom: 8, fontSize: 13, wordBreak: 'break-all' }}>
            {this.state.error?.message || 'Error desconocido'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#B08968', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 16, cursor: 'pointer', marginTop: 16 }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
