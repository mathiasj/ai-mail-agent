import type { MailgateClient } from '../client';
import type { Email, Pagination } from '../types';

export class EmailsResource {
  constructor(private client: MailgateClient) {}

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

  async classify(id: string, data: {
    category: string;
    priority: number;
    summary?: string;
    entities?: {
      people?: string[];
      companies?: string[];
      dates?: string[];
      amounts?: string[];
    };
  }) {
    return this.client.request(`/api/emails/${id}/classify`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
