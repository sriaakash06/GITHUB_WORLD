import React from 'react';
import { useNavigate } from 'react-router-dom';

const COPY = {
  'not-found': { icon: '🔍', title: 'No such village' },
  'rate-limit': { icon: '⏳', title: 'GitHub is rate-limiting us' },
  network: { icon: '📡', title: "Couldn't reach GitHub" },
  unknown: { icon: '🧱', title: "Couldn't build that world" },
};

export function ErrorScreen({ username, error, onRetry }) {
  const navigate = useNavigate();
  const { icon, title } = COPY[error?.kind] || COPY.unknown;

  return (
    <div id="login-screen">
      <div className="login-card">
        <span className="login-icon">{icon}</span>
        <h1>Git<span>Ville</span></h1>
        <h2 className="error-title">{title}</h2>
        <p>{error?.message || 'Something went wrong loading this world.'}</p>

        <div className="error-actions">
          {error?.kind !== 'not-found' && (
            <button type="button" id="enter-btn" onClick={onRetry}>
              Try again
            </button>
          )}
          <button
            type="button"
            className="ghost-btn"
            onClick={() => navigate('/', { replace: true })}
          >
            Try a different username
          </button>
        </div>

        {error?.kind === 'rate-limit' && (
          <p className="login-hint">
            GitHub allows 60 unauthenticated requests per hour per IP address.
          </p>
        )}
        {error?.kind === 'not-found' && username && (
          <p className="login-hint">Check the spelling of “{username}”.</p>
        )}
      </div>
    </div>
  );
}
