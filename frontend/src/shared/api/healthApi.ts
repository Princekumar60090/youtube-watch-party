import { apiGet } from '@/shared/api/httpClient';

export type HealthPayload = {
  status: string;
  application: string;
  activeProfiles: string;
  mongodbEnabled: boolean;
  timestamp: string;
};

export function fetchHealth(): Promise<HealthPayload> {
  return apiGet<HealthPayload>('/health');
}
