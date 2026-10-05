import { env } from '@/shared/config/env';

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data?: T;
  errorCode?: string;
  fieldErrors?: Array<{ field: string; message: string; rejectedValue?: unknown }>;
};

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  if (!response.ok || !payload.success) {
    const fieldErrors: Record<string, string> = {};
    for (const error of payload.fieldErrors ?? []) {
      fieldErrors[error.field] = error.message;
    }
    throw new ApiError(
      payload.message || `Request failed with status ${response.status}`,
      response.status,
      fieldErrors,
    );
  }

  return payload.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}
