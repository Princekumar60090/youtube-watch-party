import { Link, useNavigate, useParams } from 'react-router-dom';
import { ParticipantRail } from '@/features/room/ParticipantRail';
import { PlaybackDock } from '@/features/room/PlaybackDock';
import { YoutubeStage } from '@/features/room/YoutubeStage';
import { useRoomController } from '@/features/room/useRoomController';

export function RoomPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams<{ roomId: string }>();
  const room = useRoomController(roomId);

  if (room.bootError || !room.session) {
    return (
      <main className="room-fallback">
        <p className="brand-mark">WatchParty</p>
        <h1>Room unavailable</h1>
        <p>{room.bootError || 'Missing local session for this room.'}</p>
        <Link to="/" className="text-link">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="room">
      <header className="room-top">
        <div>
          <p className="brand-mark compact">WatchParty</p>
          <h1>Room {room.roomCode}</h1>
          <p className="room-sub">
            Signed in as <strong>{room.username}</strong> · {room.role}
          </p>
        </div>

        <div className="room-top-actions">
          <div className={`pulse-pill pulse-${room.connection}`} aria-live="polite">
            <span />
            {room.connection === 'live'
              ? 'Synced live'
              : room.connection === 'connecting'
                ? 'Connecting'
                : room.connection === 'reconnecting'
                  ? 'Reconnecting'
                  : 'Offline'}
          </div>
          <button
            type="button"
            className="ghost-btn"
            onClick={async () => {
              await navigator.clipboard.writeText(room.roomCode);
            }}
          >
            Copy code
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              room.leave();
              navigate('/');
            }}
          >
            Leave
          </button>
        </div>
      </header>

      <div className="room-layout">
        <section className="room-main">
          <YoutubeStage
            videoId={room.playback.videoId}
            playState={room.playback.playState}
            currentTime={room.playback.currentTime}
            canControl={room.canControl}
            onLocalPlay={(time) => room.play(time)}
            onLocalPause={(time) => room.pause(time)}
          />
          <PlaybackDock
            canControl={room.canControl}
            playState={room.playback.playState}
            currentTime={room.playback.currentTime}
            onPlay={() => room.play(room.playback.currentTime)}
            onPause={() => room.pause(room.playback.currentTime)}
            onSeek={(time) => room.seek(time)}
            onChangeVideo={(input) => room.changeVideo(input)}
          />
        </section>

        <ParticipantRail
          participants={room.participants}
          selfUserId={room.userId}
          canManage={room.canManage}
          onAssignRole={room.assignRole}
          onRemove={room.removeParticipant}
          onTransferHost={room.transferHost}
        />
      </div>

      <div className="toast-stack" aria-live="polite">
        {room.toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </main>
  );
}
