const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async signup(email: string, password: string, name?: string) {
    return this.request<{ token: string; user: any }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{ user: any }>('/api/auth/me');
  }

  async getGmailConnectUrl() {
    return this.request<{ url: string }>('/api/auth/gmail/connect');
  }

  async getGmailAccounts() {
    return this.request<{ accounts: any[] }>('/api/auth/gmail/accounts');
  }

  async disconnectGmailAccount(id: string) {
    return this.request(`/api/auth/gmail/accounts/${id}`, { method: 'DELETE' });
  }

  // Emails
  async getEmails(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ emails: any[]; pagination: any }>(`/api/emails?${query}`);
  }

  async getEmail(id: string) {
    return this.request<{ email: any }>(`/api/emails/${id}`);
  }

  async archiveEmail(id: string) {
    return this.request(`/api/emails/${id}/archive`, { method: 'PATCH' });
  }

  async unarchiveEmail(id: string) {
    return this.request(`/api/emails/${id}/unarchive`, { method: 'PATCH' });
  }

  async getEmailStats() {
    return this.request<{ categories: any[]; unread: number }>('/api/emails/stats/overview');
  }

  // Drafts
  async generateDraft(emailId: string, template?: string) {
    return this.request('/api/drafts/generate', {
      method: 'POST',
      body: JSON.stringify({ emailId, template }),
    });
  }

  async getDrafts() {
    return this.request<{ drafts: any[] }>('/api/drafts');
  }

  async getDraft(id: string) {
    return this.request<{ draft: any }>(`/api/drafts/${id}`);
  }

  async updateDraft(id: string, content: string) {
    return this.request(`/api/drafts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async sendDraft(id: string) {
    return this.request(`/api/drafts/${id}/send`, { method: 'POST' });
  }

  async deleteDraft(id: string) {
    return this.request(`/api/drafts/${id}`, { method: 'DELETE' });
  }

  // Rules
  async getRules() {
    return this.request<{ rules: any[] }>('/api/rules');
  }

  async createRule(rule: any) {
    return this.request<{ rule: any }>('/api/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async updateRule(id: string, rule: any) {
    return this.request<{ rule: any }>(`/api/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  async toggleRule(id: string) {
    return this.request<{ enabled: boolean }>(`/api/rules/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteRule(id: string) {
    return this.request(`/api/rules/${id}`, { method: 'DELETE' });
  }

  // Payments
  async createCheckout(tier: string) {
    return this.request<{ url: string }>('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  }

  async getBillingPortal() {
    return this.request<{ url: string }>('/api/payments/portal', {
      method: 'POST',
    });
  }

  async getSubscription() {
    return this.request<{ subscription: any }>('/api/payments/subscription');
  }

  // Usage
  async getUsage() {
    return this.request<{ usage: any; limits: any; tier: string }>('/api/usage');
  }

  // SSE
  getEventStreamUrl(): string {
    const token = this.getToken();
    return `${API_URL}/api/events/stream?token=${token}`;
  }
}

export const api = new ApiClient();
