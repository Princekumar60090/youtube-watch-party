import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ParticipantRail } from '@/features/room/ParticipantRail';
import { PlaybackDock } from '@/features/room/PlaybackDock';
import { YoutubeStage, type YoutubeStageHandle } from '@/features/room/YoutubeStage';
import { useRoomController } from '@/features/room/useRoomController';

export function RoomPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams<{ roomId: string }>();
  const room = useRoomController(roomId);
  const playerRef = useRef<YoutubeStageHandle>(null);
  const [duration, setDuration] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(false);

  if (room.bootError || !room.session) {
    return (
      <main className="room-fallback">
        <p className="brand-mark">WatchParty</p>
        <h1>Room unavailable</h1>
        <p>{room.bootError || 'Please join this room from the home page first.'}</p>
        <Link to="/" className="text-link">
          Back to home
        </Link>
      </main>
    );
  }

  const activeTime =
    room.playback.playState === 'playing' ? displayTime : room.playback.currentTime;

  return (
    <main className="room">
      <header className="room-top">
        <div className="room-top-copy">
          <p className="brand-mark compact">WatchParty</p>
          <h1>Room {room.roomCode}</h1>
          <p className="room-sub">
            Signed in as <strong>{room.username}</strong>
            <span className="dot-sep">·</span>
            <span>{room.role}</span>
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
              try {
                await navigator.clipboard.writeText(room.roomCode);
                room.notify('Room code copied', 'success');
              } catch {
                room.notify('Could not copy the room code', 'error');
              }
            }}
          >
            Copy code
          </button>
          <button
            type="button"
            className="ghost-btn leave-btn"
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
            ref={playerRef}
            videoId={room.playback.videoId}
            playState={room.playback.playState}
            currentTime={room.playback.currentTime}
            canControl={room.canControl}
            onLocalPlay={(time) => room.play(time)}
            onLocalPause={(time) => room.pause(time)}
            onTick={(time, nextDuration) => {
              setDisplayTime(time);
              if (nextDuration > 0) setDuration(nextDuration);
            }}
          />
          <PlaybackDock
            canControl={room.canControl}
            playState={room.playback.playState}
            currentTime={activeTime}
            duration={duration}
            captionsOn={captionsOn}
            onPlay={() => {
              const time = playerRef.current?.getCurrentTime() ?? room.playback.currentTime;
              room.play(time);
            }}
            onPause={() => {
              const time = playerRef.current?.getCurrentTime() ?? room.playback.currentTime;
              room.pause(time);
            }}
            onSeek={(time) => room.seek(time)}
            onSkip={(delta) => {
              const now = playerRef.current?.getCurrentTime() ?? room.playback.currentTime;
              const max = playerRef.current?.getDuration() || duration || now + Math.abs(delta);
              const next = Math.max(0, Math.min(max, now + delta));
              room.seek(next);
            }}
            onToggleCaptions={() => {
              const next = !captionsOn;
              setCaptionsOn(next);
              playerRef.current?.setCaptions(next);
            }}
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
