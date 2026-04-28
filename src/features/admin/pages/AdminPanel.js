import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import '../../../App.css';

const emptyVariante = { nombre: '', precio: '', peso: '' };

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

function AdminPanel() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
        return;
      }
      if (ADMIN_EMAIL && session.user.email !== ADMIN_EMAIL) {
        navigate('/');
        return;
      }
      setAuthChecked(true);
    });
  }, [navigate]);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    imagen_url: '',
  });
  const [variantes, setVariantes] = useState([{ ...emptyVariante }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVarianteChange = (index, key, value) => {
    setVariantes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const addVariante = () => setVariantes((prev) => [...prev, { ...emptyVariante }]);
  const removeVariante = (index) => setVariantes((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: '',
      imagen_url: '',
    });
    setVariantes([{ ...emptyVariante }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanVariantes = variantes
      .map((v) => ({
        nombre: v.nombre.trim(),
        precio: Number(v.precio),
        peso: Number(v.peso),
      }))
      .filter((v) => v.nombre && !Number.isNaN(v.precio) && !Number.isNaN(v.peso) && v.peso > 0);

    if (!formData.nombre.trim() || !formData.descripcion.trim() || !formData.categoria.trim()) {
      setError('Nombre, descripción y categoría son obligatorios.');
      return;
    }

    if (!formData.imagen_url.trim().startsWith('http')) {
      setError('La imagen debe ser un link válido que empiece con http o https.');
      return;
    }

    if (cleanVariantes.length === 0) {
      setError('Agrega al menos una variante con nombre, precio y peso válidos.');
      return;
    }

    setLoading(true);
    const payload = {
      nombre: formData.nombre.trim(),
      slug: generateSlug(formData.nombre),
      descripcion: formData.descripcion.trim(),
      categoria: formData.categoria.trim(),
      variantes: cleanVariantes,
      imagen_url: formData.imagen_url.trim(),
    };

    const { error: insertError } = await supabase.from('productos').insert(payload);
    if (insertError) {
      setError(`No se pudo guardar en Supabase: ${insertError.message}`);
      setLoading(false);
      return;
    }

    setSuccess('Producto guardado correctamente.');
    resetForm();
    setLoading(false);
  };

  if (!authChecked) return <div className="loading-state">Verificando acceso...</div>;

  return (
    <div className="app-container login-page-wrapper">
      <div className="admin-panel-box">
        <div className="center-text">
          <div className="static-name">Panel de Control</div>
          <p className="app-subtitle-final">Alta de productos en Supabase</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group-premium">
            <label className="premium-label">Nombre del Producto</label>
            <input name="nombre" type="text" className="premium-input-field" value={formData.nombre} onChange={handleChange} required />
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Descripción</label>
            <textarea name="descripcion" className="premium-input-field admin-textarea" value={formData.descripcion} onChange={handleChange} required />
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Categoría</label>
            <input name="categoria" type="text" className="premium-input-field" value={formData.categoria} onChange={handleChange} required />
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Imagen (URL)</label>
            <input name="imagen_url" type="url" className="premium-input-field" placeholder="https://..." value={formData.imagen_url} onChange={handleChange} required />
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Variantes</label>
            <div className="admin-variantes-list">
              {variantes.map((variante, index) => (
                <div className="admin-variante-row" key={index}>
                  <input type="text" className="premium-input-field" placeholder="Nombre (ej. 10 ml)" value={variante.nombre} onChange={(e) => handleVarianteChange(index, 'nombre', e.target.value)} />
                  <input type="number" step="0.01" className="premium-input-field" placeholder="Precio" value={variante.precio} onChange={(e) => handleVarianteChange(index, 'precio', e.target.value)} />
                  <input type="number" step="0.01" className="premium-input-field" placeholder="Peso" value={variante.peso} onChange={(e) => handleVarianteChange(index, 'peso', e.target.value)} />
                  {variantes.length > 1 && (
                    <button type="button" className="admin-remove-btn" onClick={() => removeVariante(index)}>×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="admin-add-btn" onClick={addVariante}>+ Agregar variante</button>
          </div>

          {error && <p className="admin-error-text" style={{ color: '#ff4d4d', marginTop: '10px' }}>{error}</p>}
          {success && <p className="admin-success-text" style={{ color: '#2ecc71', marginTop: '10px' }}>{success}</p>}

          <button type="submit" className="premium-submit-btn" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar producto'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminPanel;

