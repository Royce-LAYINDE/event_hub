import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '../components/Router';
import { ErrorState, LoadingState } from '../components/StateView';
import { api } from '../lib/api';
import type { EventItem, Participant, Registration, RegistrationStats } from '../lib/types';

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function DashboardPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<RegistrationStats>({ total: 0, confirmed: 0, cancelled: 0, byEvent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [eventData, participantData, registrationData, statsData] = await Promise.all([
        api.events.list(), api.participants.list(), api.registrations.list(), api.registrations.stats(),
      ]);
      setEvents(eventData); setParticipants(participantData); setRegistrations(registrationData); setStats(statsData);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Les services sont indisponibles.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const participantById = useMemo(() => new Map(participants.map((item) => [item.id, item])), [participants]);
  const eventById = useMemo(() => new Map(events.map((item) => [item.id, item])), [events]);
  const upcoming = events.filter((item) => new Date(item.startsAt) >= new Date()).slice(0, 3);
  const featuredEvent = upcoming[0];
  const secondaryEvent = upcoming[1];
  const recentRegistration = registrations[0];
  const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0);
  const registeredPlaces = events.reduce((sum, event) => sum + event.registeredCount, 0);
  const fillRate = totalCapacity ? Math.round((registeredPlaces / totalCapacity) * 100) : 0;

  if (loading) return <div className="page"><LoadingState /></div>;
  if (error) return <div className="page"><ErrorState message={error} onRetry={() => void load()} /></div>;

  return (
    <div className="page dashboard-page">
      <div className="page-heading dashboard-heading">
        <div><h1>Bonjour Admin,</h1></div>
        <Link className="btn btn-primary" to="/events">Nouvel événement</Link>
      </div>

      <div className="spotlight-grid">
        <section className="featured-event" aria-label="Événement principal">
          {featuredEvent ? (
            <>
              <div className="featured-event-body">
                <div className="featured-date">
                  <strong>{new Date(featuredEvent.startsAt).getDate()}</strong>
                  <span>{new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(featuredEvent.startsAt))}</span>
                  <i aria-hidden="true" />
                  <div className="featured-dots" aria-hidden="true"><b /><b /><b /><b /></div>
                </div>
                <div className="featured-copy">
                  <h2>{featuredEvent.title}</h2>
                  <p><MapPin size={20} /> {featuredEvent.location}</p>
                  <p><CalendarDays size={20} /> {dateLabel(featuredEvent.startsAt)}</p>
                </div>
              </div>
              <div className="featured-capacity">
                <strong>{featuredEvent.registeredCount}</strong>
                <span>/ {featuredEvent.capacity} — {featuredEvent.remainingPlaces} places</span>
              </div>
            </>
          ) : <div className="featured-empty"><strong>Aucun événement programmé</strong></div>}
        </section>

        <aside className="dashboard-aside">
          <section className="dashboard-stats" aria-label="Indicateurs">
            <article className="dashboard-stat stat-events"><span><i />Événements</span><strong>{events.length}</strong></article>
            <article className="dashboard-stat stat-participants"><span><i />Participants</span><strong>{participants.length}</strong></article>
            <article className="dashboard-stat stat-registrations"><span><i />Inscriptions actives</span><strong>{stats.confirmed}</strong></article>
            <article className="dashboard-stat stat-fill"><span><i />Taux de remplissage</span><strong>{fillRate}%</strong></article>
          </section>

          <section className="recent-activity">
            <h2>Activité récente</h2>
            {recentRegistration ? (
              <article className="recent-registration">
                <div className="recent-avatar">{participantById.get(recentRegistration.participantId)?.name.split(' ').map((word) => word[0]).slice(0, 2).join('') ?? 'AS'}</div>
                <div>
                  <strong>{participantById.get(recentRegistration.participantId)?.name ?? 'Participant'}</strong>
                  <p>{recentRegistration.status === 'CONFIRMED' ? 'Inscrit à' : 'Inscription annulée pour'} {eventById.get(recentRegistration.eventId)?.title ?? 'un événement'}</p>
                  <small>{dateLabel(recentRegistration.createdAt)}</small>
                </div>
              </article>
            ) : <p className="recent-empty">Aucune activité récente</p>}
          </section>

          {secondaryEvent && (
            <article className="secondary-event">
              <div className="secondary-date"><strong>{new Date(secondaryEvent.startsAt).getDate()}</strong><span>{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(secondaryEvent.startsAt))}</span></div>
              <div className="secondary-copy"><h3>{secondaryEvent.title}</h3><p><MapPin size={15} />{secondaryEvent.location}</p><p><CalendarDays size={15} />{dateLabel(secondaryEvent.startsAt)}</p></div>
              <div className="secondary-capacity"><i /><span>{secondaryEvent.registeredCount} / {secondaryEvent.capacity}</span><strong>{secondaryEvent.remainingPlaces} places</strong></div>
            </article>
          )}

          <nav className="dashboard-links" aria-label="Actions rapides">
            <Link to="/events">Voir tous les événements <ArrowRight size={18} /></Link>
            <Link to="/registrations">Gérer les inscriptions <ArrowRight size={18} /></Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}
