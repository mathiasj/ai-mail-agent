import type { MailgateClient } from '../client';
import type { Rule, FilteringRule } from '../types';

export class RulesResource {
  constructor(private client: MailgateClient) {}

  async list() {
    return this.client.request<{ rules: Rule[] }>('/api/rules');
  }

  async create(rule: Omit<Rule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    return this.client.request<{ rule: Rule }>('/api/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async get(id: string) {
    return this.client.request<{ rule: Rule }>(`/api/rules/${id}`);
  }

  async update(id: string, rule: Partial<Rule>) {
    return this.client.request<{ rule: Rule }>(`/api/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  async toggle(id: string) {
    return this.client.request<{ enabled: boolean }>(`/api/rules/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async delete(id: string) {
    return this.client.request(`/api/rules/${id}`, { method: 'DELETE' });
  }

  // Filtering rules (enhanced, for dashboard)
  async listFiltering() {
    return this.client.request<{ rules: FilteringRule[] }>('/api/filtering-rules');
  }

  async createFiltering(rule: Omit<FilteringRule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    return this.client.request<{ rule: FilteringRule }>('/api/filtering-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async updateFiltering(id: string, rule: Partial<FilteringRule>) {
    return this.client.request<{ rule: FilteringRule }>(`/api/filtering-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    });
  }

  async toggleFiltering(id: string) {
    return this.client.request<{ enabled: boolean }>(`/api/filtering-rules/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteFiltering(id: string) {
    return this.client.request(`/api/filtering-rules/${id}`, { method: 'DELETE' });
  }
}
