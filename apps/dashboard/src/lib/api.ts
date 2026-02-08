import {
  MailGateClient,
  AuthResource,
  AccountsResource,
  ApiKeysResource,
  RulesResource,
} from '@mailgate/sdk';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

const client = new MailGateClient({ baseUrl: API_URL });
const authResource = new AuthResource(client);
const accountsResource = new AccountsResource(client);
const apiKeysResource = new ApiKeysResource(client);
const rulesResource = new RulesResource(client);

class DashboardApi {
  setToken(token: string | null) {
    client.setToken(token);
    if (token) {
      localStorage.setItem('dashboard_token', token);
    } else {
      localStorage.removeItem('dashboard_token');
    }
  }

  getToken(): string | null {
    const existing = client.getToken();
    if (existing) return existing;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard_token');
      if (stored) client.setToken(stored);
      return stored;
    }
    return null;
  }

  private ensureToken() {
    if (!client.getToken() && typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard_token');
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

  // Accounts
  async getAccounts() {
    return this.wrapRequest(() => accountsResource.list());
  }

  async connectAccount() {
    return this.wrapRequest(() => accountsResource.connect());
  }

  async disconnectAccount(id: string) {
    return this.wrapRequest(() => accountsResource.disconnect(id));
  }

  // API Keys
  async getApiKeys() {
    return this.wrapRequest(() => apiKeysResource.list());
  }

  async createApiKey(data: {
    name: string;
    permissions?: { canRead: boolean; canWrite: boolean; canDelete: boolean };
    monthlyQuota?: number;
    expiresAt?: string;
  }) {
    return this.wrapRequest(() => apiKeysResource.create(data));
  }

  async revokeApiKey(id: string) {
    return this.wrapRequest(() => apiKeysResource.revoke(id));
  }

  // Filtering Rules
  async getFilteringRules() {
    return this.wrapRequest(() => rulesResource.listFiltering());
  }

  async createFilteringRule(rule: any) {
    return this.wrapRequest(() => rulesResource.createFiltering(rule));
  }

  async updateFilteringRule(id: string, rule: any) {
    return this.wrapRequest(() => rulesResource.updateFiltering(id, rule));
  }

  async toggleFilteringRule(id: string) {
    return this.wrapRequest(() => rulesResource.toggleFiltering(id));
  }

  async deleteFilteringRule(id: string) {
    return this.wrapRequest(() => rulesResource.deleteFiltering(id));
  }

  // Audit
  async getAuditLogs(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.wrapRequest(() =>
      client.request<{ logs: any[]; pagination: any }>(`/api/audit?${query}`)
    );
  }

  // Usage
  async getUsage() {
    return this.wrapRequest(() =>
      client.request<{ usage: any; limits: any; tier: string }>('/api/usage')
    );
  }

  // Analytics
  async getAnalytics() {
    return this.wrapRequest(() => client.request<any>('/api/analytics/overview'));
  }

  // Payments
  async createCheckout(tier: string) {
    return this.wrapRequest(() =>
      client.request<{ url: string }>('/api/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier, product: 'dashboard' }),
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
}

export const dashboardApi = new DashboardApi();
