import { Layout } from './components/Layout';
import { usePathname } from './components/Router';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { RegistrationsPage } from './pages/RegistrationsPage';

export default function App() {
  const pathname = usePathname();
  const page = pathname === '/' ? <DashboardPage />
    : pathname === '/events' ? <EventsPage />
      : pathname === '/participants' ? <ParticipantsPage />
        : pathname === '/registrations' ? <RegistrationsPage />
          : <div className="page"><h1>Page introuvable</h1><p>Cette page n’existe pas.</p></div>;
  return (
    <Layout>
      {page}
    </Layout>
  );
}
