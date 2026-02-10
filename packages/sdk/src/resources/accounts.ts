import type { MailgateClient } from '../client';
import type { GmailAccount } from '../types';

export class AccountsResource {
  constructor(private client: MailgateClient) {}

  async list() {
    return this.client.request<{ accounts: GmailAccount[] }>('/api/auth/gmail/accounts');
  }

  async connect() {
    return this.client.request<{ url: string }>('/api/auth/gmail/connect');
  }

  async disconnect(id: string) {
    return this.client.request(`/api/auth/gmail/accounts/${id}`, { method: 'DELETE' });
  }
}
