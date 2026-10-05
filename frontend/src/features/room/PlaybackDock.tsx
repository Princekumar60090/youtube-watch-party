import { useEffect, useState, type FormEvent } from 'react';
import { validateVideoInput } from '@/shared/lib/validation';

type PlaybackDockProps = {
  canControl: boolean;
  playState: string;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onChangeVideo: (input: string) => void;
};

function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlaybackDock({
  canControl,
  playState,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
}: PlaybackDockProps) {
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [seekDraft, setSeekDraft] = useState(String(Math.floor(currentTime || 0)));

  useEffect(() => {
    setSeekDraft(String(Math.floor(currentTime || 0)));
  }, [currentTime]);

  const submitVideo = (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateVideoInput(videoInput);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onChangeVideo(videoInput.trim());
    setVideoInput('');
  };

  if (!canControl) {
    return (
      <div className="dock dock-readonly">
        <p className="dock-note">You’re in watch mode. Playback follows the host/moderator.</p>
        <div className="dock-meta">
          <span>{playState === 'playing' ? 'Live sync' : 'Paused sync'}</span>
          <span>{formatTime(currentTime)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dock">
      <div className="dock-controls">
        <button
          type="button"
          className="control-btn"
          onClick={() => (playState === 'playing' ? onPause() : onPlay())}
        >
          {playState === 'playing' ? 'Pause' : 'Play'}
        </button>
        <label className="seek-field">
          <span>Seek</span>
          <input
            type="number"
            min={0}
            step={1}
            value={seekDraft}
            onChange={(event) => setSeekDraft(event.target.value)}
            onBlur={() => {
              const value = Number(seekDraft);
              if (!Number.isNaN(value) && value >= 0) onSeek(value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                const value = Number(seekDraft);
                if (!Number.isNaN(value) && value >= 0) onSeek(value);
              }
            }}
          />
          <em>{formatTime(currentTime)}</em>
        </label>
      </div>

      <form className="video-form" onSubmit={submitVideo}>
        <label htmlFor="video-input">Cue YouTube</label>
        <div className="video-form-row">
          <input
            id="video-input"
            value={videoInput}
            onChange={(event) => setVideoInput(event.target.value)}
            placeholder="Paste YouTube URL or video id"
            autoComplete="off"
          />
          <button type="submit" className="control-btn accent">
            Load
          </button>
        </div>
        {error && <p className="field-error">{error}</p>}
      </form>
    </div>
  );
}
