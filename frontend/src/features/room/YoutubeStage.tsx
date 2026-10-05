import { useEffect, useRef } from 'react';
import {
  loadYoutubeApi,
  YT_STATE,
  type YoutubePlayer,
} from '@/shared/youtube/loadYoutubeApi';

type YoutubeStageProps = {
  videoId: string | null;
  playState: string;
  currentTime: number;
  canControl: boolean;
  onLocalPlay: (currentTime: number) => void;
  onLocalPause: (currentTime: number) => void;
};

const APPLY_GUARD_MS = 1000;

export function YoutubeStage({
  videoId,
  playState,
  currentTime,
  canControl,
  onLocalPlay,
  onLocalPause,
}: YoutubeStageProps) {
  const playerRef = useRef<YoutubePlayer | null>(null);
  const readyRef = useRef(false);
  const ignoreUntilRef = useRef(0);
  const lastVideoIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onLocalPlay, onLocalPause, canControl });

  callbacksRef.current = { onLocalPlay, onLocalPause, canControl };

  useEffect(() => {
    let cancelled = false;

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
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              readyRef.current = true;
              ignoreUntilRef.current = Date.now() + APPLY_GUARD_MS;
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
          },
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      readyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;

    ignoreUntilRef.current = Date.now() + APPLY_GUARD_MS;

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
    <div className="stage">
      <div className="stage-frame">
        <div id="watchparty-player" className="stage-player" />
        {!videoId && (
          <div className="stage-empty">
            <p className="stage-kicker">Waiting for a reel</p>
            <h2>Drop a YouTube link to light up the room</h2>
          </div>
        )}
      </div>
    </div>
  );
}
