import { env } from '@/shared/config/env';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data: T;
};

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!payload.success) {
    throw new ApiError(payload.message || 'API request failed', response.status);
  }

  return payload.data;
}
