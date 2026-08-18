import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal modal-open event-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="modal-box modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
          <button className="btn btn-square btn-ghost btn-sm icon-button" onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}
