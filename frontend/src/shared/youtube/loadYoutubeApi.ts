type YoutubeNamespace = {
  Player: new (
    elementId: string,
    options: {
      videoId?: string;
      playerVars?: Record<string, string | number | boolean>;
      events?: {
        onReady?: (event: { target: YoutubePlayer }) => void;
        onStateChange?: (event: { data: number; target: YoutubePlayer }) => void;
        onError?: (event: { data: number }) => void;
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
  getDuration: () => number;
  getPlayerState: () => number;
  loadModule?: (module: string) => void;
  unloadModule?: (module: string) => void;
  setOption?: (module: string, option: string, value: unknown) => void;
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
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export function youtubeErrorMessage(code: number): string {
  switch (code) {
    case 2:
      return 'This YouTube link looks invalid. Please check the URL and try again.';
    case 5:
      return 'This video can’t play in the embedded player. Try a different video.';
    case 100:
      return 'This video is unavailable. It may be private or removed.';
    case 101:
    case 150:
      return 'The video owner doesn’t allow playback in embedded players. Try another video.';
    default:
      return 'We couldn’t play this video right now. Please try another YouTube link.';
  }
}
