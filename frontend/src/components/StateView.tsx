import { AlertCircle } from 'lucide-react';

export function LoadingState({ label = 'Chargement des donnees...' }: { label?: string }) {
  return <div className="card bg-base-100 state-card"><span className="loading loading-spinner loading-md text-primary" aria-hidden="true" /><p>{label}</p></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="card bg-base-100 state-card error-state"><AlertCircle size={28} /><h3>Connexion impossible</h3><p>{message}</p>{onRetry && <button className="btn btn-soft btn-primary btn-sm" onClick={onRetry}>Reessayer</button>}</div>;
}
