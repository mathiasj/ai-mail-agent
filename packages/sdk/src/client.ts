export interface MailGateClientOptions {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
}

export class MailGateClient {
  private baseUrl: string;
  private apiKey?: string;
  private bearerToken?: string;

  constructor(options: MailGateClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.bearerToken = options.bearerToken;
  }

  setToken(token: string | null) {
    this.bearerToken = token ?? undefined;
  }

  getToken(): string | undefined {
    return this.bearerToken;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const err = new Error(error.error || 'Request failed') as Error & { status: number };
      err.status = response.status;
      throw err;
    }

    return response.json();
  }

  async requestRaw(path: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    }

    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });
  }

  getEventStreamUrl(): string {
    if (this.bearerToken) {
      return `${this.baseUrl}/api/events/stream?token=${this.bearerToken}`;
    }
    return `${this.baseUrl}/api/events/stream`;
  }
}
