import type { MailGateClient } from '../client';
import type { Draft } from '../types';

export class DraftsResource {
  constructor(private client: MailGateClient) {}

  async generate(emailId: string, template?: string) {
    return this.client.request('/api/drafts/generate', {
      method: 'POST',
      body: JSON.stringify({ emailId, template }),
    });
  }

  async list() {
    return this.client.request<{ drafts: Draft[] }>('/api/drafts');
  }

  async get(id: string) {
    return this.client.request<{ draft: Draft }>(`/api/drafts/${id}`);
  }

  async update(id: string, content: string) {
    return this.client.request(`/api/drafts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async send(id: string) {
    return this.client.request(`/api/drafts/${id}/send`, { method: 'POST' });
  }

  async delete(id: string) {
    return this.client.request(`/api/drafts/${id}`, { method: 'DELETE' });
  }
}
