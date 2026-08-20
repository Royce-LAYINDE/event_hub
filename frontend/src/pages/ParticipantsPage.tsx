import { Edit3, Mail, Phone, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { ErrorState, LoadingState } from '../components/StateView';
import { api } from '../lib/api';
import type { Participant, ParticipantInput, ParticipantType } from '../lib/types';

const emptyForm: ParticipantInput = { name: '', email: '', phone: '', type: 'STUDENT' };
const typeLabels: Record<ParticipantType, string> = { STUDENT: 'Étudiant', PROFESSOR: 'Professeur', EXTERNAL: 'Externe' };
const typeBadges: Record<ParticipantType, string> = { STUDENT: 'badge-info', PROFESSOR: 'badge-secondary', EXTERNAL: 'badge-warning' };

export function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false); const [editing, setEditing] = useState<Participant | null>(null);
  const [form, setForm] = useState<ParticipantInput>(emptyForm); const [saving, setSaving] = useState(false);

  const load = useCallback(async () => { setLoading(true); setError(''); try { setParticipants(await api.participants.list()); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Erreur de chargement.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => participants.filter((p) => `${p.name} ${p.email}`.toLowerCase().includes(search.toLowerCase())), [participants, search]);

  function openCreate() { setEditing(null); setForm(emptyForm); setModalOpen(true); setNotice(''); }
  function openEdit(participant: Participant) { setEditing(participant); setForm({ name: participant.name, email: participant.email, phone: participant.phone, type: participant.type }); setModalOpen(true); setNotice(''); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try { if (editing) await api.participants.update(editing.id, form); else await api.participants.create(form); setModalOpen(false); setNotice(editing ? 'Profil mis a jour.' : 'Participant ajoute.'); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Enregistrement impossible.'); } finally { setSaving(false); }
  }
  async function remove(participant: Participant) {
    if (!window.confirm(`Supprimer ${participant.name} ?`)) return;
    try { await api.participants.delete(participant.id); setNotice('Participant supprime.'); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Suppression impossible.'); }
  }

  if (loading && !participants.length) return <div className="page"><LoadingState label="Chargement des participants..." /></div>;
  return <div className="page">
    <div className="page-heading"><div><h1>Participants</h1></div><button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Ajouter un participant</button></div>
    {notice && <div className="alert alert-success notice success" role="status">{notice}</div>}
    {error && !participants.length ? <ErrorState message={error} onRetry={() => void load()} /> : error && <div className="alert alert-error notice error" role="alert">{error}</div>}
    <div className="card bg-base-100 toolbar"><label className="input input-bordered search-box"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un nom ou un email..." /></label><span>{filtered.length} profil{filtered.length > 1 ? 's' : ''}</span></div>
    <section className="card bg-base-100 table-panel">
      <div className="data-table">
        <table className="table table-zebra participants-table">
          <thead><tr><th>Participant</th><th>Contact</th><th>Type</th><th>Ajoute le</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((participant) => <tr key={participant.id}>
              <td><div className="person-cell"><div className="avatar placeholder"><div className="person-avatar">{participant.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div></div><div><strong>{participant.name}</strong></div></div></td>
              <td><div className="contact-cell"><span><Mail size={14} /> {participant.email}</span><span><Phone size={14} /> {participant.phone}</span></div></td>
              <td><span className={`badge badge-soft ${typeBadges[participant.type]} type-badge`}>{typeLabels[participant.type]}</span></td>
              <td><span className="muted-cell">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(participant.createdAt))}</span></td>
              <td><div className="row-actions"><button className="btn btn-square btn-ghost btn-xs" onClick={() => openEdit(participant)} aria-label="Modifier"><Edit3 size={17} /></button><button className="btn btn-square btn-ghost btn-xs" onClick={() => void remove(participant)} aria-label="Supprimer"><Trash2 size={17} /></button></div></td>
            </tr>)}
            {!filtered.length && <tr><td colSpan={5}><div className="table-empty"><UserRound size={30} /><p>Aucun participant trouve.</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
    {modalOpen && <Modal title={editing ? 'Modifier le participant' : 'Nouveau participant'} onClose={() => setModalOpen(false)}>
      <form className="form-grid" onSubmit={(event) => void submit(event)}>
        <label className="field full"><span>Nom complet</span><input className="input input-bordered" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prenom et nom" /></label>
        <label className="field"><span>Adresse email</span><input className="input input-bordered" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nom@exemple.com" /></label>
        <label className="field"><span>Telephone</span><input className="input input-bordered" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+221 77 000 00 00" /></label>
        <label className="field full"><span>Type de participant</span><select className="select select-bordered" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ParticipantType })}><option value="STUDENT">Étudiant</option><option value="PROFESSOR">Professeur</option><option value="EXTERNAL">Externe</option></select></label>
        <div className="form-actions full"><button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Annuler</button><button className="btn btn-primary" disabled={saving}>{saving && <span className="loading loading-spinner loading-xs" />}{saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter le participant'}</button></div>
      </form>
    </Modal>}
  </div>;
}
