import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';

const ADMIN_EMAIL = 'taller.organico.casa@gmail.com';
const MONTHS_ES   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES     = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function buildGrid(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  let dow = first.getDay();
  if (dow === 0) dow = 6; else dow -= 1; // Mon=0 … Sun=6

  const days = [];
  for (let i = dow - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), cur: false });
  for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(year, month, d), cur: true });
  let n = 1;
  while (days.length < 42) days.push({ date: new Date(year, month + 1, n++), cur: false });

  const weeks = [];
  for (let i = 0; i < 42; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function ds(date) { return date.toISOString().slice(0, 10); }

function fmt12(hora) {
  if (!hora) return '';
  const [h, m] = hora.split(':').map(Number);
  const p = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${p}` : `${h12}:${String(m).padStart(2,'0')}${p}`;
}

function blank(date) {
  return {
    titulo: '', fecha: ds(date), hora: '', duracion: '',
    timezone: 'America/Mexico_City', es_recurrente: false,
    ubicacion: 'Llamada virtual', descripcion: '', acceso: 'todos', recordatorio: false,
  };
}

export default function Calendario() {
  const today = new Date();
  const [view,       setView]       = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [eventos,    setEventos]    = useState([]);
  const [isAdmin,    setIsAdmin]    = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState(blank(today));
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const imgRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email === ADMIN_EMAIL) setIsAdmin(true);
    });
    loadEventos();
  }, []);

  async function loadEventos() {
    const { data } = await supabase.from('eventos').select('*').order('fecha');
    setEventos(data || []);
  }

  function eventsFor(date) {
    const d = ds(date);
    return eventos.filter(e => {
      if (e.fecha === d) return true;
      if (e.es_recurrente && e.dia_semana != null) {
        let dow = date.getDay();
        if (dow === 0) dow = 6; else dow -= 1;
        return e.dia_semana === dow && new Date(e.fecha + 'T12:00:00') <= date;
      }
      return false;
    });
  }

  function openModal(date = today) {
    setForm(blank(date));
    setImgFile(null);
    setImgPreview('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.titulo.trim() || !form.fecha) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let imagen_url = null;
      if (imgFile) {
        const ext  = imgFile.name.split('.').pop();
        const path = `eventos/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('posts').upload(path, imgFile);
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);
          imagen_url = publicUrl;
        }
      }
      let dia_semana = null;
      if (form.es_recurrente) {
        const d = new Date(form.fecha + 'T12:00:00');
        dia_semana = d.getDay() === 0 ? 6 : d.getDay() - 1;
      }
      const { error } = await supabase.from('eventos').insert({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        fecha: form.fecha, hora: form.hora || null,
        duracion: form.duracion ? parseInt(form.duracion) : null,
        timezone: form.timezone, es_recurrente: form.es_recurrente,
        dia_semana, ubicacion: form.ubicacion, acceso: form.acceso,
        recordatorio: form.recordatorio, imagen_url, creado_por: user.id,
      });
      if (error) throw error;
      setShowModal(false);
      await loadEventos();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const weeks   = buildGrid(view.year, view.month);
  const todayDs = ds(today);
  const f = form;
  const setF = (patch) => setForm(prev => ({ ...prev, ...patch }));

  return (
    <div className="cal-wrapper">

      {/* ── Toolbar ── */}
      <div className="cal-toolbar">
        <button className="cal-today-btn"
          onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}>
          Hoy
        </button>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() =>
            setView(v => v.month === 0 ? { year: v.year-1, month: 11 } : { ...v, month: v.month-1 })}>
            <ChevronLeft size={18} />
          </button>
          <span className="cal-month-label">{MONTHS_ES[view.month]} {view.year}</span>
          <button className="cal-nav-btn" onClick={() =>
            setView(v => v.month === 11 ? { year: v.year+1, month: 0 } : { ...v, month: v.month+1 })}>
            <ChevronRight size={18} />
          </button>
        </div>
        {isAdmin && (
          <button className="cal-add-btn" onClick={() => openModal(today)} title="Agregar evento">
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* ── Calendar grid ── */}
      <div className="cal-grid-wrap">
        <div className="cal-header-row">
          {DAYS_ES.map(d => <div key={d} className="cal-header-cell">{d}</div>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="cal-week-row">
            {week.map(({ date, cur }, di) => {
              const d     = ds(date);
              const isT   = d === todayDs;
              const evs   = eventsFor(date);
              return (
                <div
                  key={di}
                  className={`cal-day-cell${!cur ? ' cal-other' : ''}${isT ? ' cal-today-cell' : ''}`}
                  onClick={() => isAdmin && cur && openModal(date)}
                  style={{ cursor: isAdmin && cur ? 'pointer' : 'default' }}
                >
                  <span className={`cal-day-num${isT ? ' cal-today-num' : ''}`}>{date.getDate()}</span>
                  {evs.slice(0, 3).map((ev, ei) => (
                    <div key={ei} className="cal-chip">
                      {ev.hora ? `${fmt12(ev.hora)} · ` : ''}{ev.titulo}
                    </div>
                  ))}
                  {evs.length > 3 && <div className="cal-chip-more">+{evs.length - 3} más</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Add Event Modal ── */}
      {showModal && (
        <div className="cal-overlay" onClick={() => setShowModal(false)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>

            <div className="cal-modal-head">
              <div>
                <h2 className="cal-modal-title">Agregar evento</h2>
                <p className="cal-modal-sub">¿Sin ideas? Prueba: sesión de preguntas, clase en vivo, taller o llamada grupal</p>
              </div>
              <button className="cal-modal-x" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <div className="cal-modal-body">

              {/* Title */}
              <div className="cal-field">
                <input className="cal-input" placeholder="Título" maxLength={30}
                  value={f.titulo} onChange={e => setF({ titulo: e.target.value })} />
                <span className="cal-count">{f.titulo.length} / 30</span>
              </div>

              {/* Date / Time / Duration / Timezone */}
              <div className="cal-row4">
                <div className="cal-field">
                  <label className="cal-label">Fecha</label>
                  <input type="date" className="cal-input" value={f.fecha}
                    onChange={e => setF({ fecha: e.target.value })} />
                </div>
                <div className="cal-field">
                  <label className="cal-label">Hora</label>
                  <input type="time" className="cal-input" value={f.hora}
                    onChange={e => setF({ hora: e.target.value })} />
                </div>
                <div className="cal-field">
                  <label className="cal-label">Duración</label>
                  <select className="cal-input" value={f.duracion}
                    onChange={e => setF({ duracion: e.target.value })}>
                    <option value="">--</option>
                    <option value="30">30 min</option>
                    <option value="60">1 hora</option>
                    <option value="90">1.5 horas</option>
                    <option value="120">2 horas</option>
                    <option value="180">3 horas</option>
                  </select>
                </div>
                <div className="cal-field">
                  <label className="cal-label">Zona horaria</label>
                  <select className="cal-input" value={f.timezone}
                    onChange={e => setF({ timezone: e.target.value })}>
                    <option value="America/Mexico_City">(GMT -06:00) México / CDMX</option>
                    <option value="America/Bogota">(GMT -05:00) Bogotá</option>
                    <option value="America/Lima">(GMT -05:00) Lima</option>
                    <option value="America/Santiago">(GMT -04:00) Santiago</option>
                    <option value="America/Argentina/Buenos_Aires">(GMT -03:00) Buenos Aires</option>
                    <option value="America/New_York">(GMT -05:00) Nueva York</option>
                    <option value="Europe/Madrid">(GMT +01:00) Madrid</option>
                  </select>
                </div>
              </div>

              {/* Recurring */}
              <label className="cal-check-row">
                <input type="checkbox" checked={f.es_recurrente}
                  onChange={e => setF({ es_recurrente: e.target.checked })} />
                <span>Evento recurrente (se repite cada semana el mismo día)</span>
              </label>

              {/* Location */}
              <div className="cal-field">
                <label className="cal-label">Ubicación</label>
                <input className="cal-input" placeholder="Zoom, Google Meet, presencial…"
                  value={f.ubicacion} onChange={e => setF({ ubicacion: e.target.value })} />
              </div>

              {/* Description */}
              <div className="cal-field">
                <textarea className="cal-input cal-textarea" placeholder="Descripción"
                  maxLength={300} value={f.descripcion}
                  onChange={e => setF({ descripcion: e.target.value })} />
                <span className="cal-count">{f.descripcion.length} / 300</span>
              </div>

              {/* Image + Access side by side */}
              <div className="cal-two-col">
                <div className="cal-img-box" onClick={() => imgRef.current?.click()}>
                  {imgPreview
                    ? <img src={imgPreview} alt="portada" className="cal-img-preview" />
                    : <>
                        <span className="cal-img-label">Subir imagen de portada</span>
                        <span className="cal-img-hint">1460 × 752 px</span>
                      </>
                  }
                  <input type="file" ref={imgRef} style={{ display:'none' }} accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setImgFile(file);
                      setImgPreview(URL.createObjectURL(file));
                    }} />
                </div>

                <div className="cal-access-group">
                  <p className="cal-label" style={{ marginBottom: 10 }}>Acceso</p>
                  {[
                    { label: 'Todos los miembros',   value: 'todos' },
                    { label: 'Nivel 1 o superior',   value: 'nivel1' },
                    { label: 'Nivel 2 o superior',   value: 'nivel2' },
                    { label: 'Llamada 1 a 1 con Nico', value: 'vip' },
                  ].map(opt => (
                    <label key={opt.value} className="cal-radio-row">
                      <input type="radio" name="acceso" value={opt.value}
                        checked={f.acceso === opt.value}
                        onChange={() => setF({ acceso: opt.value })} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reminder */}
              <label className="cal-check-row">
                <input type="checkbox" checked={f.recordatorio}
                  onChange={e => setF({ recordatorio: e.target.checked })} />
                <span>Enviar recordatorio por email 1 día antes</span>
              </label>

            </div>

            <div className="cal-modal-foot">
              <button className="cal-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="cal-btn-save"
                onClick={handleSave}
                disabled={saving || !f.titulo.trim() || !f.fecha}>
                {saving ? 'Guardando…' : 'Agregar'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
