import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/shared/api/httpClient';
import { createRoom, joinRoomByCode } from '@/shared/api/roomApi';
import { validateRoomCode, validateUsername } from '@/shared/lib/validation';
import { saveRoomSession } from '@/shared/session/roomSessionStorage';

type Mode = 'create' | 'join';

export function HomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('create');
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const headline = useMemo(
    () => (mode === 'create' ? 'Open a room. Keep every screen in lockstep.' : 'Enter the code. Drop into the same frame.'),
    [mode],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const usernameError = validateUsername(username);
    if (usernameError) nextErrors.username = usernameError;
    if (mode === 'join') {
      const codeError = validateRoomCode(roomCode);
      if (codeError) nextErrors.roomCode = codeError;
    }
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const session =
        mode === 'create'
          ? await createRoom(username.trim())
          : await joinRoomByCode(roomCode.trim().toUpperCase(), username.trim());
      saveRoomSession(session);
      navigate(`/rooms/${session.room.roomId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError('Unable to reach the server. Is the backend running?');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="landing">
      <div className="landing-glow" aria-hidden="true" />
      <div className="landing-grain" aria-hidden="true" />

      <section className="landing-shell">
        <p className="brand-mark">WatchParty</p>
        <h1>{headline}</h1>
        <p className="landing-lede">
          A shared YouTube booth with host controls, live sync, and roles that actually enforce
          themselves.
        </p>

        <div className="mode-switch" role="tablist" aria-label="Room entry mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            className={mode === 'create' ? 'active' : ''}
            onClick={() => setMode('create')}
          >
            Create room
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'join'}
            className={mode === 'join' ? 'active' : ''}
            onClick={() => setMode('join')}
          >
            Join room
          </button>
        </div>

        <form className="entry-form" onSubmit={onSubmit} noValidate>
          <label htmlFor="username">Display name</label>
          <input
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g. Nova"
            autoComplete="nickname"
            maxLength={24}
          />
          {errors.username && <p className="field-error">{errors.username}</p>}

          {mode === 'join' && (
            <>
              <label htmlFor="roomCode">Room code</label>
              <input
                id="roomCode"
                name="roomCode"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                autoComplete="off"
                maxLength={8}
              />
              {errors.roomCode && <p className="field-error">{errors.roomCode}</p>}
            </>
          )}

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" className="entry-submit" disabled={submitting}>
            {submitting ? 'Connecting…' : mode === 'create' ? 'Start the party' : 'Enter room'}
          </button>
        </form>
      </section>
    </main>
  );
}
