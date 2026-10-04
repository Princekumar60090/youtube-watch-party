import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/features/home/HomePage';
import { RoomPage } from '@/features/room/RoomPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/rooms/:roomId" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
