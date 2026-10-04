function required(name: string, value: string | undefined, fallback: string): string {
  const resolved = value?.trim() || fallback;
  if (!resolved) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return resolved.replace(/\/$/, '');
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
