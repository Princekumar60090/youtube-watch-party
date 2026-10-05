import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { validateVideoInput } from '@/shared/lib/validation';

type PlaybackDockProps = {
  canControl: boolean;
  playState: string;
  currentTime: number;
  duration: number;
  captionsOn: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSkip: (deltaSeconds: number) => void;
  onToggleCaptions: () => void;
  onChangeVideo: (input: string) => void;
  onScrubbingChange?: (scrubbing: boolean) => void;
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
  duration,
  captionsOn,
  onPlay,
  onPause,
  onSeek,
  onSkip,
  onToggleCaptions,
  onChangeVideo,
  onScrubbingChange,
}: PlaybackDockProps) {
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(currentTime);
  const scrubbingRef = useRef(false);
  const scrubValueRef = useRef(currentTime);

  useEffect(() => {
    if (!scrubbingRef.current) {
      setScrubValue(currentTime || 0);
      scrubValueRef.current = currentTime || 0;
    }
  }, [currentTime]);

  const setScrubbingState = (next: boolean) => {
    scrubbingRef.current = next;
    setScrubbing(next);
    onScrubbingChange?.(next);
  };

  const commitScrub = () => {
    if (!scrubbingRef.current) return;
    const value = scrubValueRef.current;
    setScrubbingState(false);
    onSeek(value);
  };

  const beginScrub = (event: ReactPointerEvent<HTMLInputElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setScrubbingState(true);
  };

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

  const safeDuration = Math.max(duration || 0, 0);
  const progressMax = safeDuration > 0 ? safeDuration : Math.max(scrubValue, 1);

  if (!canControl) {
    return (
      <div className="dock dock-readonly">
        <div>
          <p className="dock-note">Watching only — playback is controlled by the host or moderator.</p>
          <p className="dock-hint">If the video is paused, please wait for them to resume it.</p>
        </div>
        <div className="dock-meta">
          <span>{playState === 'playing' ? 'Playing' : 'Paused'}</span>
          <span>
            {formatTime(currentTime)}
            {safeDuration > 0 ? ` / ${formatTime(safeDuration)}` : ''}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="dock">
      <div className="progress-block">
        <input
          className={`progress-bar ${scrubbing ? 'is-scrubbing' : ''}`}
          type="range"
          min={0}
          max={progressMax}
          step={0.1}
          value={Math.min(scrubValue, progressMax)}
          aria-label="Video progress"
          onPointerDown={beginScrub}
          onPointerMove={(event) => {
            if (!scrubbingRef.current) return;
            const next = Number(event.currentTarget.value);
            scrubValueRef.current = next;
            setScrubValue(next);
          }}
          onChange={(event) => {
            const next = Number(event.target.value);
            scrubValueRef.current = next;
            setScrubValue(next);
            if (!scrubbingRef.current) {
              setScrubbingState(true);
            }
          }}
          onPointerUp={commitScrub}
          onPointerCancel={commitScrub}
          onLostPointerCapture={commitScrub}
        />
        <div className="progress-times">
          <span>{formatTime(scrubValue)}</span>
          <span>{safeDuration > 0 ? formatTime(safeDuration) : '--:--'}</span>
        </div>
      </div>

      <div className="dock-controls">
        <button type="button" className="control-btn" onClick={() => onSkip(-10)} title="Back 10 seconds">
          −10s
        </button>
        <button
          type="button"
          className="control-btn primary"
          onClick={() => (playState === 'playing' ? onPause() : onPlay())}
        >
          {playState === 'playing' ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="control-btn" onClick={() => onSkip(10)} title="Forward 10 seconds">
          +10s
        </button>
        <button
          type="button"
          className={`control-btn ${captionsOn ? 'active' : ''}`}
          onClick={onToggleCaptions}
        >
          {captionsOn ? 'Captions on' : 'Captions off'}
        </button>
      </div>

      <form className="video-form" onSubmit={submitVideo}>
        <label htmlFor="video-input">YouTube link</label>
        <div className="video-form-row">
          <input
            id="video-input"
            value={videoInput}
            onChange={(event) => setVideoInput(event.target.value)}
            placeholder="Paste a YouTube URL or video ID"
            autoComplete="off"
          />
          <button type="submit" className="control-btn accent">
            Load video
          </button>
        </div>
        {error && <p className="field-error">{error}</p>}
      </form>
    </div>
  );
}
