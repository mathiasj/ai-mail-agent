import type { MailGateClient } from '../client';
import type { Email, Pagination } from '../types';

export class EmailsResource {
  constructor(private client: MailGateClient) {}

  async list(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.client.request<{ emails: Email[]; pagination: Pagination }>(
      `/api/emails?${query}`
    );
  }

  async get(id: string) {
    return this.client.request<{ email: Email }>(`/api/emails/${id}`);
  }

  async archive(id: string) {
    return this.client.request(`/api/emails/${id}/archive`, { method: 'PATCH' });
  }

  async unarchive(id: string) {
    return this.client.request(`/api/emails/${id}/unarchive`, { method: 'PATCH' });
  }

  async getStats() {
    return this.client.request<{ categories: any[]; unread: number }>(
      '/api/emails/stats/overview'
    );
  }
}
