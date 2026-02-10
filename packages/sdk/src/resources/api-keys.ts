import type { MailgateClient } from '../client';
import type { ApiKey, ApiKeyPermissions } from '../types';

export class ApiKeysResource {
  constructor(private client: MailgateClient) {}

  async list() {
    return this.client.request<{ apiKeys: ApiKey[] }>('/api/api-keys');
  }

  async create(data: {
    name: string;
    permissions?: Partial<ApiKeyPermissions>;
    monthlyQuota?: number;
    expiresAt?: string;
  }) {
    return this.client.request<{ apiKey: ApiKey; rawKey: string }>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get(id: string) {
    return this.client.request<{ apiKey: ApiKey }>(`/api/api-keys/${id}`);
  }

  async revoke(id: string) {
    return this.client.request(`/api/api-keys/${id}/revoke`, { method: 'POST' });
  }
}
