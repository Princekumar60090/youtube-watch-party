export function validateUsername(username: string): string | null {
  const value = username.trim().replace(/\s+/g, ' ');
  if (!value) return 'Username is required';
  if (value.length < 2 || value.length > 24) return 'Username must be 2–24 characters';
  if (!/^[A-Za-z0-9_ ]+$/.test(value)) {
    return 'Use letters, numbers, spaces, or underscores only';
  }
  return null;
}

export function validateRoomCode(roomCode: string): string | null {
  const value = roomCode.trim().toUpperCase();
  if (!value) return 'Room code is required';
  if (value.length < 6 || value.length > 8) return 'Room code must be 6–8 characters';
  if (!/^[A-Z0-9]+$/.test(value)) return 'Room code may contain only letters and numbers';
  return null;
}

export function validateVideoInput(input: string): string | null {
  const value = input.trim();
  if (!value) return 'Paste a YouTube URL or video id';
  if (value.length < 6) return 'Video input looks too short';
  return null;
}
