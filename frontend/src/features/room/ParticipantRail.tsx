import type { Participant, RoomRole } from '@/shared/types/room';

type ParticipantRailProps = {
  participants: Participant[];
  selfUserId: string;
  canManage: boolean;
  onAssignRole: (userId: string, role: RoomRole) => void;
  onRemove: (userId: string) => void;
  onTransferHost: (userId: string) => void;
};

const ASSIGNABLE: RoomRole[] = ['MODERATOR', 'PARTICIPANT', 'VIEWER'];

export function ParticipantRail({
  participants,
  selfUserId,
  canManage,
  onAssignRole,
  onRemove,
  onTransferHost,
}: ParticipantRailProps) {
  return (
    <aside className="rail">
      <div className="rail-head">
        <p className="rail-kicker">In the booth</p>
        <h2>{participants.length} watching</h2>
      </div>

      <ul className="rail-list">
        {participants.map((participant, index) => {
          const isSelf = participant.userId === selfUserId;
          const isHost = participant.role === 'HOST';
          return (
            <li
              key={participant.userId}
              className={`rail-item ${isSelf ? 'is-self' : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div>
                <strong>{participant.username}</strong>
                <span className={`role-chip role-${participant.role.toLowerCase()}`}>
                  {participant.role}
                </span>
              </div>

              {canManage && !isSelf && !isHost && (
                <div className="rail-actions">
                  <select
                    aria-label={`Role for ${participant.username}`}
                    value={participant.role}
                    onChange={(event) =>
                      onAssignRole(participant.userId, event.target.value as RoomRole)
                    }
                  >
                    {ASSIGNABLE.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => onTransferHost(participant.userId)}>
                    Make host
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onRemove(participant.userId)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
