import { useMemo, useState } from 'react';
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
const PAGE_SIZE = 10;

export function ParticipantRail({
  participants,
  selfUserId,
  canManage,
  onAssignRole,
  onRemove,
  onTransferHost,
}: ParticipantRailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(participants.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return participants.slice(start, start + PAGE_SIZE);
  }, [participants, currentPage]);

  return (
    <aside className="rail">
      <div className="rail-head">
        <p className="rail-kicker">In the room</p>
        <h2>{participants.length} watching</h2>
        {canManage && (
          <p className="rail-hint">Click a participant to manage their role.</p>
        )}
      </div>

      <ul className="rail-list">
        {pageItems.map((participant, index) => {
          const isSelf = participant.userId === selfUserId;
          const isHost = participant.role === 'HOST';
          const expanded = expandedId === participant.userId;
          const canOpenActions = canManage && !isSelf && !isHost;

          return (
            <li
              key={participant.userId}
              className={`rail-item ${isSelf ? 'is-self' : ''} ${expanded ? 'is-open' : ''}`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <button
                type="button"
                className="rail-person"
                onClick={() => {
                  if (!canOpenActions) return;
                  setExpandedId((current) =>
                    current === participant.userId ? null : participant.userId,
                  );
                }}
                aria-expanded={canOpenActions ? expanded : undefined}
              >
                <span className="rail-person-main">
                  <strong>{participant.username}</strong>
                  <span className={`role-chip role-${participant.role.toLowerCase()}`}>
                    {participant.role}
                  </span>
                </span>
                {canOpenActions && <span className="rail-chevron">{expanded ? '−' : '+'}</span>}
              </button>

              {canOpenActions && expanded && (
                <div className="rail-actions">
                  <label className="rail-action-label">
                    Role
                    <select
                      aria-label={`Role for ${participant.username}`}
                      value={
                        ASSIGNABLE.includes(participant.role)
                          ? participant.role
                          : 'PARTICIPANT'
                      }
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
                  </label>
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

      {totalPages > 1 && (
        <div className="rail-pagination">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </button>
        </div>
      )}
    </aside>
  );
}
