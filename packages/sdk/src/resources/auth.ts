import type { MailgateClient } from '../client';
import type { GmailAccount } from '../types';

export class AuthResource {
  constructor(private client: MailgateClient) {}

  async signup(email: string, password: string, name?: string) {
    return this.client.request<{ token: string; user: any }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.client.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.client.request<{ user: any }>('/api/auth/me');
  }

  async getGmailConnectUrl() {
    return this.client.request<{ url: string }>('/api/auth/gmail/connect');
  }

  async getGmailAccounts() {
    return this.client.request<{ accounts: GmailAccount[] }>('/api/auth/gmail/accounts');
  }

  async disconnectGmailAccount(id: string) {
    return this.client.request(`/api/auth/gmail/accounts/${id}`, { method: 'DELETE' });
  }

  async regenerateWebhookSecret() {
    return this.client.request<{ webhookSecret: string }>('/api/auth/webhook-secret/regenerate', {
      method: 'POST',
    });
  }
}
