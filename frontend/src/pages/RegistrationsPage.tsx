import { CalendarCheck, CheckCircle2, Plus, Search, TicketX, UserRoundCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { ErrorState, LoadingState } from '../components/StateView';
import { api } from '../lib/api';
import type { EventItem, Participant, Registration } from '../lib/types';

export function RegistrationsPage() {
  const [events, setEvents] = useState<EventItem[]>([]); const [participants, setParticipants] = useState<Participant[]>([]); const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false); const [eventId, setEventId] = useState(''); const [participantId, setParticipantId] = useState(''); const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const [eventData, participantData, registrationData] = await Promise.all([api.events.list(), api.participants.list(), api.registrations.list()]); setEvents(eventData); setParticipants(participantData); setRegistrations(registrationData); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Erreur de chargement.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const eventById = useMemo(() => new Map(events.map((x) => [x.id, x])), [events]); const participantById = useMemo(() => new Map(participants.map((x) => [x.id, x])), [participants]);
  const filtered = registrations.filter((r) => `${eventById.get(r.eventId)?.title} ${participantById.get(r.participantId)?.name}`.toLowerCase().includes(search.toLowerCase()));
  const confirmed = registrations.filter((r) => r.status === 'CONFIRMED').length;

  function openCreate() { setEventId(events.find((x) => x.remainingPlaces > 0)?.id ?? ''); setParticipantId(participants[0]?.id ?? ''); setModalOpen(true); setNotice(''); }
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { await api.registrations.create(eventId, participantId); setModalOpen(false); setNotice('Inscription confirmée.'); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Inscription impossible.'); } finally { setSaving(false); } }
  async function cancel(registration: Registration) { if (!window.confirm('Annuler cette inscription ?')) return; try { await api.registrations.cancel(registration.id); setNotice('Inscription annulée.'); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Annulation impossible.'); } }

  if (loading && !registrations.length) return <div className="page"><LoadingState label="Chargement des inscriptions..." /></div>;
  return <div className="page">
    <div className="page-heading"><div><h1>Inscriptions</h1></div><button className="btn btn-primary" onClick={openCreate} disabled={!events.length || !participants.length}><Plus size={18} /> Nouvelle inscription</button></div>
    {notice && <div className="alert alert-success notice success" role="status">{notice}</div>}
    {error && !events.length ? <ErrorState message={error} onRetry={() => void load()} /> : error && <div className="alert alert-error notice error" role="alert">{error}</div>}
    <section className="mini-stats"><div className="card bg-base-100"><CheckCircle2 /><span><strong>{confirmed}</strong> confirmées</span></div><div className="card bg-base-100"><TicketX /><span><strong>{registrations.length - confirmed}</strong> annulées</span></div><div className="card bg-base-100"><CalendarCheck /><span><strong>{events.length}</strong> événements</span></div></section>
    <div className="card bg-base-100 toolbar"><label className="input input-bordered search-box"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un participant ou un événement..." /></label><span>{filtered.length} inscription{filtered.length > 1 ? 's' : ''}</span></div>
    <section className="card bg-base-100 table-panel"><div className="data-table">
      <table className="table table-zebra registrations-table">
        <thead><tr><th>Participant</th><th>Evenement</th><th>Date d’inscription</th><th>Statut</th><th>Action</th></tr></thead>
        <tbody>
          {filtered.map((registration) => <tr key={registration.id}>
            <td><div className="person-cell"><div className="avatar placeholder"><div className="person-avatar small">{(participantById.get(registration.participantId)?.name ?? 'P').split(' ').map((x) => x[0]).slice(0, 2).join('')}</div></div><div><strong>{participantById.get(registration.participantId)?.name ?? 'Participant supprime'}</strong><small>{participantById.get(registration.participantId)?.email}</small></div></div></td>
            <td><div><strong>{eventById.get(registration.eventId)?.title ?? 'Événement supprimé'}</strong><small className="block-small">{eventById.get(registration.eventId)?.location}</small></div></td>
            <td><span className="muted-cell">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(registration.createdAt))}</span></td>
            <td><span className={`badge badge-soft ${registration.status === 'CONFIRMED' ? 'badge-success' : 'badge-error'} status-badge`}>{registration.status === 'CONFIRMED' ? 'Confirmée' : 'Annulée'}</span></td>
            <td>{registration.status === 'CONFIRMED' ? <button className="btn btn-ghost btn-xs text-error" onClick={() => void cancel(registration)}>Annuler</button> : <span className="muted-cell">—</span>}</td>
          </tr>)}
          {!filtered.length && <tr><td colSpan={5}><div className="table-empty"><UserRoundCheck size={30} /><p>Aucune inscription trouvée.</p></div></td></tr>}
        </tbody>
      </table>
    </div></section>
    {modalOpen && <Modal title="Nouvelle inscription" onClose={() => setModalOpen(false)}>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <label className="field full"><span>Événement</span><select className="select select-bordered" required value={eventId} onChange={(e) => setEventId(e.target.value)}><option value="" disabled>Sélectionner...</option>{events.map((x) => <option key={x.id} value={x.id} disabled={x.remainingPlaces === 0}>{x.title} · {x.remainingPlaces} place(s)</option>)}</select></label>
        <label className="field full"><span>Participant</span><select className="select select-bordered" required value={participantId} onChange={(e) => setParticipantId(e.target.value)}><option value="" disabled>Sélectionner...</option>{participants.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.email}</option>)}</select></label>
        <div className="form-actions full"><button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Annuler</button><button className="btn btn-primary" disabled={saving || !eventId || !participantId}>{saving && <span className="loading loading-spinner loading-xs" />}{saving ? 'Vérification...' : 'Confirmer l’inscription'}</button></div>
      </form>
    </Modal>}
  </div>;
}
