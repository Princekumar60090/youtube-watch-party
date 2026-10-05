import { REACTION_EMOJIS } from '@/shared/types/room';

type ReactionBarProps = {
  enabled: boolean;
  isHost: boolean;
  connectionLive: boolean;
  onReact: (emoji: string) => void;
};

export function ReactionBar({ enabled, isHost, connectionLive, onReact }: ReactionBarProps) {
  const canReact = connectionLive && (enabled || isHost);

  return (
    <div className="reaction-bar">
      <div className="reaction-bar-copy">
        <p className="rail-kicker">Reactions</p>
        <p className="reaction-hint">
          {canReact
            ? 'Tap an emoji — everyone in the room will see it.'
            : 'Reactions unlock when the host turns them on.'}
        </p>
      </div>
      <div className="reaction-buttons" role="group" aria-label="Emoji reactions">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="reaction-btn"
            disabled={!canReact}
            onClick={() => onReact(emoji)}
            aria-label={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
