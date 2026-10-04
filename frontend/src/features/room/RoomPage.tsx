import { Link, useParams } from 'react-router-dom';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Room shell</p>
        <h1>Room {roomId}</h1>
        <p className="lede">
          Player, participants, and WebSocket sync will be wired in later parts.
        </p>
        <Link className="text-link" to="/">
          Back to home
        </Link>
      </section>
    </main>
  );
}
