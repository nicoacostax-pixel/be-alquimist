import React from 'react';
import { Paperclip, Link2, Video, Smile, BarChart2, X } from 'lucide-react';

const EMOJIS = ['😊','😍','🔥','💪','✨','🌿','🧪','💚','🌸','👏','❤️','🙏','😎','💡','⭐','🎉','👍','💫','🌺','🍃','🫶','🥰','🤩','🌟','🪴'];

function extractYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function AttachmentToolbar({
  panelActivo, setPanelActivo,
  linkInput, setLinkInput,
  videoInput, setVideoInput,
  pollOpciones, setPollOpciones,
  imagenFile, imagenPreview, onImagenChange, onQuitarImagen,
  onInsertEmoji,
  fileInputRef, textareaRef,
  onSubmit, submitLabel, submitDisabled,
  compact = false,
}) {
  return (
    <>
      {/* Previews */}
      {imagenPreview && (
        <div className="adjunto-preview">
          <img src={imagenPreview} alt="preview" style={{ maxHeight: 180, borderRadius: 8, objectFit: 'cover' }} />
          <button type="button" className="adjunto-remove" onClick={onQuitarImagen}><X size={14} /></button>
        </div>
      )}
      {linkInput.trim() && (
        <div className="adjunto-link-card">
          🔗 <a href={linkInput} target="_blank" rel="noopener noreferrer">{linkInput}</a>
          <button type="button" className="adjunto-remove" onClick={() => setLinkInput('')}><X size={14} /></button>
        </div>
      )}
      {videoInput.trim() && extractYoutubeId(videoInput) && (
        <div className="adjunto-preview">
          <iframe
            src={`https://www.youtube.com/embed/${extractYoutubeId(videoInput)}`}
            title="preview" allowFullScreen
            style={{ width: '100%', height: compact ? 160 : 200, border: 'none', borderRadius: 8 }}
          />
          <button type="button" className="adjunto-remove" onClick={() => setVideoInput('')}><X size={14} /></button>
        </div>
      )}
      {pollOpciones.some(o => o.trim()) && (
        <div className="adjunto-poll-preview">
          <span style={{ fontSize: 13, fontWeight: 600, color: '#B08968' }}>📊 Encuesta</span>
          {pollOpciones.map((op, i) => op.trim() && <div key={i} className="poll-opcion-preview">{op}</div>)}
        </div>
      )}

      {/* Paneles contextuales */}
      {panelActivo === 'link' && (
        <div className="toolbar-panel">
          <input className="premium-input-field" placeholder="https://..." value={linkInput}
            onChange={e => setLinkInput(e.target.value)} autoFocus style={{ flex: 1 }} />
          <button type="button" className="panel-confirm-btn" onClick={() => setPanelActivo(null)}>Listo</button>
        </div>
      )}
      {panelActivo === 'video' && (
        <div className="toolbar-panel">
          <input className="premium-input-field" placeholder="https://youtube.com/watch?v=..." value={videoInput}
            onChange={e => setVideoInput(e.target.value)} autoFocus style={{ flex: 1 }} />
          <button type="button" className="panel-confirm-btn" onClick={() => setPanelActivo(null)}>Listo</button>
        </div>
      )}
      {panelActivo === 'emoji' && (
        <div className="toolbar-panel emoji-grid">
          {EMOJIS.map(em => (
            <button key={em} type="button" className="emoji-btn"
              onClick={() => { onInsertEmoji(em); setPanelActivo(null); }}>{em}</button>
          ))}
        </div>
      )}
      {panelActivo === 'poll' && (
        <div className="toolbar-panel" style={{ flexDirection: 'column' }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#666' }}>Opciones de la encuesta</p>
          {pollOpciones.map((op, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input className="premium-input-field" placeholder={`Opción ${i + 1}`} value={op}
                onChange={e => { const c = [...pollOpciones]; c[i] = e.target.value; setPollOpciones(c); }}
                style={{ flex: 1 }} />
              {pollOpciones.length > 2 && (
                <button type="button" className="adjunto-remove" style={{ position: 'static' }}
                  onClick={() => setPollOpciones(pollOpciones.filter((_, j) => j !== i))}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {pollOpciones.length < 5 && (
            <button type="button" className="panel-add-opcion"
              onClick={() => setPollOpciones([...pollOpciones, ''])}>+ Agregar opción</button>
          )}
          <button type="button" className="panel-confirm-btn" style={{ marginTop: 8 }}
            onClick={() => setPanelActivo(null)}>Listo</button>
        </div>
      )}

      {/* Barra inferior */}
      <div className="post-form-footer">
        <div className="post-toolbar">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }}
            accept="image/*,video/*,application/pdf" onChange={onImagenChange} />
          <button type="button" className={`toolbar-btn${imagenFile ? ' active' : ''}`} title="Adjuntar imagen"
            onClick={() => fileInputRef.current.click()}><Paperclip size={18} /></button>
          <button type="button" className={`toolbar-btn${panelActivo === 'link' ? ' active' : ''}`} title="Link"
            onClick={() => setPanelActivo(p => p === 'link' ? null : 'link')}><Link2 size={18} /></button>
          <button type="button" className={`toolbar-btn${panelActivo === 'video' ? ' active' : ''}`} title="YouTube"
            onClick={() => setPanelActivo(p => p === 'video' ? null : 'video')}><Video size={18} /></button>
          <button type="button" className={`toolbar-btn${panelActivo === 'poll' ? ' active' : ''}`} title="Encuesta"
            onClick={() => setPanelActivo(p => p === 'poll' ? null : 'poll')}><BarChart2 size={18} /></button>
          <button type="button" className={`toolbar-btn${panelActivo === 'emoji' ? ' active' : ''}`} title="Emoji"
            onClick={() => setPanelActivo(p => p === 'emoji' ? null : 'emoji')}><Smile size={18} /></button>
        </div>
        <button type="submit" className="premium-submit-btn" disabled={submitDisabled}
          style={{ padding: '10px 28px', margin: 0, width: 'auto', minWidth: 110 }}>
          {submitDisabled ? 'Enviando...' : submitLabel}
        </button>
      </div>
    </>
  );
}
