import { MailGateClient, AuthResource, EmailsResource, DraftsResource, RulesResource } from '@mailgate/sdk';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

const client = new MailGateClient({ baseUrl: API_URL });
const authResource = new AuthResource(client);
const emailsResource = new EmailsResource(client);
const draftsResource = new DraftsResource(client);
const rulesResource = new RulesResource(client);

// Backward-compatible API wrapper that matches the old interface exactly
class ApiClient {
  setToken(token: string | null) {
    client.setToken(token);
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    const existing = client.getToken();
    if (existing) return existing;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token');
      if (stored) client.setToken(stored);
      return stored;
    }
    return null;
  }

  private ensureToken() {
    if (!client.getToken() && typeof window !== 'undefined') {
      const stored = localStorage.getItem('token');
      if (stored) client.setToken(stored);
    }
  }

  private async wrapRequest<T>(fn: () => Promise<T>): Promise<T> {
    this.ensureToken();
    try {
      return await fn();
    } catch (err: any) {
      if (err.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw err;
    }
  }

  // Auth
  async signup(email: string, password: string, name?: string) {
    return this.wrapRequest(() => authResource.signup(email, password, name));
  }

  async login(email: string, password: string) {
    return this.wrapRequest(() => authResource.login(email, password));
  }

  async getMe() {
    return this.wrapRequest(() => authResource.getMe());
  }

  async getGmailConnectUrl() {
    return this.wrapRequest(() => authResource.getGmailConnectUrl());
  }

  async getGmailAccounts() {
    return this.wrapRequest(() => authResource.getGmailAccounts());
  }

  async disconnectGmailAccount(id: string) {
    return this.wrapRequest(() => authResource.disconnectGmailAccount(id));
  }

  // Emails
  async getEmails(params: Record<string, string> = {}) {
    return this.wrapRequest(() => emailsResource.list(params));
  }

  async getEmail(id: string) {
    return this.wrapRequest(() => emailsResource.get(id));
  }

  async archiveEmail(id: string) {
    return this.wrapRequest(() => emailsResource.archive(id));
  }

  async unarchiveEmail(id: string) {
    return this.wrapRequest(() => emailsResource.unarchive(id));
  }

  async getEmailStats() {
    return this.wrapRequest(() => emailsResource.getStats());
  }

  // Drafts
  async generateDraft(emailId: string, template?: string) {
    return this.wrapRequest(() => draftsResource.generate(emailId, template));
  }

  async getDrafts() {
    return this.wrapRequest(() => draftsResource.list());
  }

  async getDraft(id: string) {
    return this.wrapRequest(() => draftsResource.get(id));
  }

  async updateDraft(id: string, content: string) {
    return this.wrapRequest(() => draftsResource.update(id, content));
  }

  async sendDraft(id: string) {
    return this.wrapRequest(() => draftsResource.send(id));
  }

  async deleteDraft(id: string) {
    return this.wrapRequest(() => draftsResource.delete(id));
  }

  // Rules
  async getRules() {
    return this.wrapRequest(() => rulesResource.list());
  }

  async createRule(rule: any) {
    return this.wrapRequest(() => rulesResource.create(rule));
  }

  async updateRule(id: string, rule: any) {
    return this.wrapRequest(() => rulesResource.update(id, rule));
  }

  async toggleRule(id: string) {
    return this.wrapRequest(() => rulesResource.toggle(id));
  }

  async deleteRule(id: string) {
    return this.wrapRequest(() => rulesResource.delete(id));
  }

  // Payments
  async createCheckout(tier: string) {
    return this.wrapRequest(() =>
      client.request<{ url: string }>('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier }),
      })
    );
  }

  async getBillingPortal() {
    return this.wrapRequest(() =>
      client.request<{ url: string }>('/api/payments/portal', { method: 'POST' })
    );
  }

  async getSubscription() {
    return this.wrapRequest(() =>
      client.request<{ subscription: any }>('/api/payments/subscription')
    );
  }

  // Analytics
  async getAnalytics() {
    return this.wrapRequest(() => client.request<any>('/api/analytics/overview'));
  }

  async exportEmails(format: 'json' | 'csv', params: Record<string, string> = {}) {
    this.ensureToken();
    const query = new URLSearchParams({ format, ...params }).toString();
    const response = await client.requestRaw(`/api/export?${query}`);
    if (format === 'csv') {
      return response.text();
    }
    return response.json();
  }

  // Usage
  async getUsage() {
    return this.wrapRequest(() =>
      client.request<{ usage: any; limits: any; tier: string }>('/api/usage')
    );
  }

  // SSE
  getEventStreamUrl(): string {
    this.ensureToken();
    return client.getEventStreamUrl();
  }
}

export const api = new ApiClient();
