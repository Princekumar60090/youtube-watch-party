import { useEffect, useState } from 'react';
import { fetchHealth, type HealthPayload } from '@/shared/api/healthApi';

export function HomePage() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchHealth()
      .then((payload) => {
        if (!cancelled) {
          setHealth(payload);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to reach API');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">YouTube Watch Party</p>
        <h1>Watch together in sync</h1>
        <p className="lede">
          Foundation is ready. Room create/join and realtime sync arrive in the next parts.
        </p>

        <div className="status-panel" aria-live="polite">
          <h2>Backend status</h2>
          {error && <p className="status error">{error}</p>}
          {!error && !health && <p className="status">Checking API health…</p>}
          {health && (
            <ul className="status-list">
              <li>
                <span>Status</span>
                <strong>{health.status}</strong>
              </li>
              <li>
                <span>Application</span>
                <strong>{health.application}</strong>
              </li>
              <li>
                <span>Profile</span>
                <strong>{health.activeProfiles || 'default'}</strong>
              </li>
              <li>
                <span>MongoDB</span>
                <strong>{health.mongodbEnabled ? 'enabled' : 'disabled (Part 2)'}</strong>
              </li>
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
