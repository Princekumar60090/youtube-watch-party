function firstUrlToken(raw: string): string {
  // Vercel paste mistakes sometimes put the same URL twice on separate lines.
  const token = raw
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .find((part) => /^https?:\/\//i.test(part) || /^wss?:\/\//i.test(part));
  return (token || raw.trim()).replace(/\/$/, '');
}

function required(name: string, value: string | undefined, fallback: string): string {
  const resolved = firstUrlToken(value?.trim() || fallback);
  if (!resolved) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return resolved;
}

export const env = {
  apiBaseUrl: required(
    'VITE_API_BASE_URL',
    import.meta.env.VITE_API_BASE_URL,
    'http://localhost:8080/api/v1',
  ),
  wsUrl: required(
    'VITE_WS_URL',
    import.meta.env.VITE_WS_URL,
    'http://localhost:8080/ws',
  ),
} as const;
