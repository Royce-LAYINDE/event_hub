import { CalendarDays, Edit3, MapPin, Plus, Search, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { ErrorState, LoadingState } from '../components/StateView';
import { api } from '../lib/api';
import type { EventInput, EventItem } from '../lib/types';

const emptyForm: EventInput = { title: '', description: '', startsAt: '', location: '', capacity: 50 };

function toLocalInput(value: string) {
  const date = new Date(value); date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [form, setForm] = useState<EventInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setEvents(await api.events.list()); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Erreur de chargement.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => events.filter((event) => `${event.title} ${event.location}`.toLowerCase().includes(search.toLowerCase())), [events, search]);

  function openCreate() { setEditing(null); setForm(emptyForm); setModalOpen(true); setNotice(''); }
  function openEdit(event: EventItem) {
    setEditing(event); setForm({ title: event.title, description: event.description, startsAt: toLocalInput(event.startsAt), location: event.location, capacity: event.capacity }); setModalOpen(true); setNotice('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, startsAt: new Date(form.startsAt).toISOString(), capacity: Number(form.capacity) };
    try {
      if (editing) await api.events.update(editing.id, payload); else await api.events.create(payload);
      setModalOpen(false); setNotice(editing ? 'Événement mis à jour.' : 'Événement créé.'); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  }

  async function remove(event: EventItem) {
    if (!window.confirm(`Supprimer « ${event.title} » ?`)) return;
    try { await api.events.delete(event.id); setNotice('Événement supprimé.'); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Suppression impossible.'); }
  }

  if (loading && !events.length) return <div className="page"><LoadingState label="Chargement des événements..." /></div>;
  return <div className="page">
    <div className="page-heading"><div><h1>Événements</h1></div><button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Créer un événement</button></div>
    {notice && <div className="alert alert-success notice success" role="status">{notice}</div>}
    {error && !events.length ? <ErrorState message={error} onRetry={() => void load()} /> : error && <div className="alert alert-error notice error" role="alert">{error}</div>}
    <div className="card bg-base-100 toolbar"><label className="input input-bordered search-box"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par titre ou lieu..." /></label><span>{filtered.length} événement{filtered.length > 1 ? 's' : ''}</span></div>
    <section className="cards-grid">
      {filtered.map((event) => {
        const percent = Math.round((event.registeredCount / event.capacity) * 100);
        return <article className="card bg-base-100 event-card" key={event.id}>
          <div className="event-card-top"><div className="card-actions"><button className="btn btn-square btn-ghost btn-xs" aria-label="Modifier" onClick={() => openEdit(event)}><Edit3 size={17} /></button><button className="btn btn-square btn-ghost btn-xs" aria-label="Supprimer" onClick={() => void remove(event)}><Trash2 size={17} /></button></div></div>
          <h2>{event.title}</h2><p className="event-description">{event.description}</p>
          <div className="event-meta"><span><CalendarDays size={16} /> {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.startsAt))}</span><span><MapPin size={16} /> {event.location}</span></div>
          <div className="event-capacity"><div><span><Users size={16} /> Capacité</span><strong>{event.registeredCount} / {event.capacity}</strong></div><progress className="progress progress-primary large" value={percent} max="100" /><small>{event.remainingPlaces > 0 ? `${event.remainingPlaces} places disponibles` : 'Événement complet'}</small></div>
        </article>;
      })}
      {!filtered.length && <div className="card bg-base-100 empty-card"><CalendarDays size={34} /><h2>Aucun événement</h2></div>}
    </section>

    {modalOpen && <Modal title={editing ? 'Modifier l’événement' : 'Nouvel événement'} onClose={() => setModalOpen(false)}>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <label className="field full"><span>Titre</span><input className="input input-bordered" required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Conference IA responsable" /></label>
        <label className="field full"><span>Description</span><textarea className="textarea textarea-bordered" required minLength={10} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Objectifs et contenu de l’événement..." /></label>
        <label className="field"><span>Date et heure</span><input className="input input-bordered" required type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
        <label className="field"><span>Lieu</span><input className="input input-bordered" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Auditorium DIT" /></label>
        <label className="field"><span>Capacité maximale</span><input className="input input-bordered" required type="number" min={1} max={100000} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></label>
        <div className="form-actions full"><button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Annuler</button><button className="btn btn-primary" disabled={saving}>{saving && <span className="loading loading-spinner loading-xs" />}{saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Créer l’événement'}</button></div>
      </form>
    </Modal>}
  </div>;
}
