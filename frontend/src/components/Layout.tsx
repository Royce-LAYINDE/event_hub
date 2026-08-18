import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from './Router';

const navigation = [
  { to: '/', label: 'Vue d’ensemble', end: true },
  { to: '/events', label: 'Événements' },
  { to: '/participants', label: 'Participants' },
  { to: '/registrations', label: 'Inscriptions' },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="global-header">
        <div className="global-header-inner">
          <Link className="top-brand" to="/" aria-label="EventHub - Accueil">
            <span className="brand-logo-frame" aria-hidden="true">
              <span className="dit-logo-main">
                <strong className="dit-mark">DIT</strong>
                <span className="dit-lockup">
                  <b>DAKAR</b><b>INSTITUTE OF</b><b>TECHNOLOGY</b>
                  <svg viewBox="0 0 72 30" role="presentation">
                    <path d="M5 23 28 6l22 16L67 5" />
                    <circle cx="5" cy="23" r="4" /><circle cx="28" cy="6" r="4" /><circle cx="50" cy="22" r="4" /><circle cx="67" cy="5" r="4" />
                  </svg>
                </span>
              </span>
              <span className="dit-tagline">L’école de l’Intelligence Artificielle</span>
            </span>
            <span className="brand-product-name">EventHub</span>
          </Link>
          <nav className="header-nav" aria-label="Navigation principale">
            {navigation.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'header-nav-link active' : 'header-nav-link'}>
                {label}
              </NavLink>
            ))}
          </nav>
          <label className="input top-search">
            <Search size={18} />
            <input aria-label="Recherche globale" placeholder="Rechercher un événement, participant..." />
          </label>
          <div className="top-actions">
            <div className="avatar placeholder"><div className="top-avatar">AS</div></div>
          </div>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
