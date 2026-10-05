import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ChatChannel, ChatMessage, ChatPermissions } from '@/shared/types/room';

type RoomChatPanelProps = {
  isHost: boolean;
  selfUserId: string;
  permissions: ChatPermissions;
  everyoneMessages: ChatMessage[];
  hostMessages: ChatMessage[];
  connectionLive: boolean;
  onSetPermissions: (next: Partial<ChatPermissions>) => void;
  onSendChat: (channel: ChatChannel, text: string) => void;
};

function formatClock(timestamp?: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function RoomChatPanel({
  isHost,
  selfUserId,
  permissions,
  everyoneMessages,
  hostMessages,
  connectionLive,
  onSetPermissions,
  onSendChat,
}: RoomChatPanelProps) {
  const [channel, setChannel] = useState<ChatChannel>('EVERYONE');
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const messages = channel === 'HOST' ? hostMessages : everyoneMessages;
  const channelEnabled =
    channel === 'HOST' ? permissions.chatWithHostEnabled : permissions.chatWithEveryoneEnabled;
  const canSend = connectionLive && (isHost || channelEnabled);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, channel]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !canSend) return;
    onSendChat(channel, text);
    setDraft('');
  };

  return (
    <section className="chat-panel">
      <div className="chat-head">
        <p className="rail-kicker">Live chat</p>
        <h2>Room chat</h2>
        <p className="rail-hint">Messages are live only — nothing is saved.</p>
      </div>

      {isHost && (
        <div className="chat-permissions">
          <label className="chat-toggle">
            <input
              type="checkbox"
              checked={permissions.chatWithHostEnabled}
              onChange={(event) =>
                onSetPermissions({ chatWithHostEnabled: event.target.checked })
              }
            />
            <span>Allow chat with host</span>
          </label>
          <label className="chat-toggle">
            <input
              type="checkbox"
              checked={permissions.chatWithEveryoneEnabled}
              onChange={(event) =>
                onSetPermissions({ chatWithEveryoneEnabled: event.target.checked })
              }
            />
            <span>Allow chat with everyone</span>
          </label>
          <label className="chat-toggle">
            <input
              type="checkbox"
              checked={permissions.reactionsEnabled}
              onChange={(event) => onSetPermissions({ reactionsEnabled: event.target.checked })}
            />
            <span>Allow emoji reactions</span>
          </label>
        </div>
      )}

      <div className="chat-tabs" role="tablist" aria-label="Chat channels">
        <button
          type="button"
          role="tab"
          aria-selected={channel === 'EVERYONE'}
          className={channel === 'EVERYONE' ? 'is-active' : ''}
          onClick={() => setChannel('EVERYONE')}
        >
          Everyone
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={channel === 'HOST'}
          className={channel === 'HOST' ? 'is-active' : ''}
          onClick={() => setChannel('HOST')}
        >
          Host
        </button>
      </div>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 ? (
          <p className="chat-empty">
            {channel === 'HOST'
              ? 'Private messages with the host will show here.'
              : 'No messages yet. Say hello when chat is open.'}
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderUserId === selfUserId;
            return (
              <article
                key={message.messageId}
                className={`chat-bubble ${mine ? 'is-mine' : ''}`}
              >
                <header>
                  <strong>{mine ? 'You' : message.senderUsername}</strong>
                  <span>{formatClock(message.timestamp)}</span>
                </header>
                <p>{message.text}</p>
              </article>
            );
          })
        )}
      </div>

      {!canSend && (
        <p className="chat-locked">
          {!connectionLive
            ? 'Reconnect to send messages.'
            : channel === 'HOST'
              ? 'Waiting for the host to allow chat with host.'
              : 'Waiting for the host to allow chat with everyone.'}
        </p>
      )}

      <form className="chat-compose" onSubmit={submit}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={
            channel === 'HOST' ? 'Message the host…' : 'Message everyone…'
          }
          maxLength={300}
          disabled={!canSend}
          aria-label={channel === 'HOST' ? 'Message the host' : 'Message everyone'}
        />
        <button type="submit" className="control-btn primary" disabled={!canSend || !draft.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
