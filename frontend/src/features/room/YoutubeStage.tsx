import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  loadYoutubeApi,
  youtubeErrorMessage,
  YT_STATE,
  type YoutubePlayer,
} from '@/shared/youtube/loadYoutubeApi';

export type YoutubeStageHandle = {
  getCurrentTime: () => number;
  getDuration: () => number;
  setCaptions: (enabled: boolean) => void;
};

type YoutubeStageProps = {
  videoId: string | null;
  playState: string;
  currentTime: number;
  canControl: boolean;
  onLocalPlay: (currentTime: number) => void;
  onLocalPause: (currentTime: number) => void;
  onTick?: (currentTime: number, duration: number) => void;
};

const APPLY_GUARD_MS = 1200;

export const YoutubeStage = forwardRef<YoutubeStageHandle, YoutubeStageProps>(
  function YoutubeStage(
    {
      videoId,
      playState,
      currentTime,
      canControl,
      onLocalPlay,
      onLocalPause,
      onTick,
    },
    ref,
  ) {
    const playerRef = useRef<YoutubePlayer | null>(null);
    const readyRef = useRef(false);
    const ignoreUntilRef = useRef(0);
    const lastVideoIdRef = useRef<string | null>(null);
    const captionsOnRef = useRef(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const callbacksRef = useRef({ onLocalPlay, onLocalPause, canControl, onTick });

    callbacksRef.current = { onLocalPlay, onLocalPause, canControl, onTick };

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => playerRef.current?.getCurrentTime() || 0,
      getDuration: () => playerRef.current?.getDuration() || 0,
      setCaptions: (enabled: boolean) => {
        const player = playerRef.current;
        if (!player) return;
        captionsOnRef.current = enabled;
        try {
          if (enabled) {
            player.loadModule?.('captions');
            player.setOption?.('captions', 'track', {});
          } else {
            player.unloadModule?.('captions');
          }
        } catch {
          // Some videos do not expose caption modules.
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;
      let tickTimer: number | undefined;

      loadYoutubeApi()
        .then((YT) => {
          if (cancelled) return;
          playerRef.current = new YT.Player('watchparty-player', {
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              fs: 1,
              cc_load_policy: 0,
              iv_load_policy: 3,
              origin: window.location.origin,
            },
            events: {
              onReady: () => {
                readyRef.current = true;
                ignoreUntilRef.current = Date.now() + APPLY_GUARD_MS;
                setPlayerError(null);
                if (videoId) {
                  playerRef.current?.cueVideoById(videoId, currentTime || 0);
                  lastVideoIdRef.current = videoId;
                }
              },
              onStateChange: (event) => {
                if (Date.now() < ignoreUntilRef.current) return;
                if (!callbacksRef.current.canControl) return;
                const time = event.target.getCurrentTime() || 0;
                if (event.data === YT_STATE.PLAYING) {
                  callbacksRef.current.onLocalPlay(time);
                }
                if (event.data === YT_STATE.PAUSED) {
                  callbacksRef.current.onLocalPause(time);
                }
              },
              onError: (event) => {
                setPlayerError(youtubeErrorMessage(event.data));
              },
            },
          });

          tickTimer = window.setInterval(() => {
            const player = playerRef.current;
            if (!player || !readyRef.current) return;
            callbacksRef.current.onTick?.(
              player.getCurrentTime() || 0,
              player.getDuration() || 0,
            );
          }, 500);
        })
        .catch(() => {
          setPlayerError('Unable to load the YouTube player. Please refresh and try again.');
        });

      return () => {
        cancelled = true;
        readyRef.current = false;
        if (tickTimer) window.clearInterval(tickTimer);
        playerRef.current?.destroy();
        playerRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const player = playerRef.current;
      if (!player || !readyRef.current) return;

      ignoreUntilRef.current = Date.now() + APPLY_GUARD_MS;
      setPlayerError(null);

      if (videoId && videoId !== lastVideoIdRef.current) {
        lastVideoIdRef.current = videoId;
        if (playState === 'playing') {
          player.loadVideoById(videoId, currentTime || 0);
        } else {
          player.cueVideoById(videoId, currentTime || 0);
        }
        return;
      }

      if (!videoId) return;

      const localTime = player.getCurrentTime() || 0;
      if (Math.abs(localTime - (currentTime || 0)) > 1.25) {
        player.seekTo(currentTime || 0, true);
      }

      const state = player.getPlayerState();
      if (playState === 'playing' && state !== YT_STATE.PLAYING && state !== YT_STATE.BUFFERING) {
        player.playVideo();
      }
      if (playState === 'paused' && state === YT_STATE.PLAYING) {
        player.pauseVideo();
      }
    }, [videoId, playState, currentTime]);

    return (
      <div className={`stage ${canControl ? '' : 'stage-locked'}`}>
        <div className="stage-frame">
          <div id="watchparty-player" className="stage-player" />
          {!canControl && <div className="stage-blocker" aria-hidden="true" />}
          {!videoId && !playerError && (
            <div className="stage-empty">
              <p className="stage-kicker">No video yet</p>
              <h2>Paste a YouTube link below to start watching together</h2>
            </div>
          )}
          {playerError && (
            <div className="stage-empty stage-error">
              <p className="stage-kicker">Playback issue</p>
              <h2>{playerError}</h2>
            </div>
          )}
        </div>
      </div>
    );
  },
);
