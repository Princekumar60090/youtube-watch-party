type YoutubeNamespace = {
  Player: new (
    elementId: string,
    options: {
      videoId?: string;
      playerVars?: Record<string, string | number | boolean>;
      events?: {
        onReady?: (event: { target: YoutubePlayer }) => void;
        onStateChange?: (event: { data: number; target: YoutubePlayer }) => void;
      };
    },
  ) => YoutubePlayer;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
    ENDED: number;
  };
};

export type YoutubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loadingPromise: Promise<YoutubeNamespace> | null = null;

export function loadYoutubeApi(): Promise<YoutubeNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) {
        resolve(window.YT);
      } else {
        reject(new Error('YouTube API failed to initialize'));
      }
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export const YT_STATE = {
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;
