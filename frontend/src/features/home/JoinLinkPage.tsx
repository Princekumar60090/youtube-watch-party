import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@/shared/api/httpClient';
import { getRoomById, joinRoomById } from '@/shared/api/roomApi';
import { validateUsername } from '@/shared/lib/validation';
import { loadRoomSessionFor, saveRoomSession } from '@/shared/session/roomSessionStorage';

export function JoinLinkPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams<{ roomId: string }>();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!roomId.trim()) {
      setLoadingRoom(false);
      setFormError('This invite link is invalid.');
      return;
    }

    const existing = loadRoomSessionFor(roomId);
    if (existing) {
      navigate(`/rooms/${roomId}`, { replace: true });
      return;
    }

    let cancelled = false;
    setLoadingRoom(true);
    getRoomById(roomId)
      .then((room) => {
        if (cancelled) return;
        setRoomCode(room.roomCode);
        setFormError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError) {
          setFormError(error.message || 'This room could not be found.');
        } else {
          setFormError('Unable to reach the server. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoom(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, roomId]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!roomId.trim()) {
      setFormError('This invite link is invalid.');
      return;
    }

    const usernameError = validateUsername(username);
    setErrors(usernameError ? { username: usernameError } : {});
    setFormError(null);
    if (usernameError) return;

    setSubmitting(true);
    try {
      const session = await joinRoomById(roomId.trim(), username.trim());
      saveRoomSession(session);
      navigate(`/rooms/${session.room.roomId}`, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError('Unable to join this room. Please try again.');
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
        <h1>Join this watch party</h1>
        <p className="landing-lede">
          You opened an invite link. Enter your name to join as a participant — no room code needed.
        </p>

        {loadingRoom ? (
          <p className="landing-status">Checking invite…</p>
        ) : formError && !roomCode ? (
          <div className="join-link-error">
            <p className="form-error">{formError}</p>
            <Link to="/" className="text-link">
              Go to home
            </Link>
          </div>
        ) : (
          <form className="entry-form" onSubmit={onSubmit} noValidate>
            {roomCode && (
              <p className="join-link-meta">
                Room code <strong>{roomCode}</strong>
              </p>
            )}

            <label htmlFor="join-link-username">Name</label>
            <input
              id="join-link-username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your name"
              autoComplete="nickname"
              maxLength={24}
              autoFocus
            />
            {errors.username && <p className="field-error">{errors.username}</p>}
            {formError && <p className="form-error">{formError}</p>}

            <button type="submit" className="entry-submit" disabled={submitting}>
              {submitting ? 'Joining…' : 'Join room'}
            </button>

            <Link to="/" className="text-link join-link-home">
              Back to home
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
