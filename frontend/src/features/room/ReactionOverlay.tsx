type FloatingReaction = {
  key: string;
  emoji: string;
  senderUsername: string;
  left: number;
};

type ReactionOverlayProps = {
  reactions: FloatingReaction[];
};

export function ReactionOverlay({ reactions }: ReactionOverlayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="reaction-overlay" aria-hidden="true">
      {reactions.map((reaction) => (
        <div
          key={reaction.key}
          className="reaction-float"
          style={{ left: `${reaction.left}%` }}
        >
          <span className="reaction-float-emoji">{reaction.emoji}</span>
          <span className="reaction-float-name">{reaction.senderUsername}</span>
        </div>
      ))}
    </div>
  );
}
