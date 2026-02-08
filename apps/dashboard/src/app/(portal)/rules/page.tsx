'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';

export default function FilteringRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    fromDomain: '',
    fromRegex: '',
    subject_contains: '',
    subjectRegex: '',
    classify: '',
    archive: false,
    mark_read: false,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dashboardApi
      .getFilteringRules()
      .then((data) => setRules(data.rules))
      .finally(() => setLoading(false));
  }, []);

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await dashboardApi.createFilteringRule({
        name: form.name,
        conditions: {
          ...(form.fromDomain && { fromDomain: form.fromDomain }),
          ...(form.fromRegex && { fromRegex: form.fromRegex }),
          ...(form.subject_contains && { subject_contains: form.subject_contains }),
          ...(form.subjectRegex && { subjectRegex: form.subjectRegex }),
        },
        actions: {
          ...(form.classify && { classify: form.classify }),
          ...(form.archive && { archive: true }),
          ...(form.mark_read && { mark_read: true }),
        },
        enabled: true,
        priority: 0,
      });
      setRules((prev) => [result.rule, ...prev]);
      setShowCreate(false);
      setForm({ name: '', fromDomain: '', fromRegex: '', subject_contains: '', subjectRegex: '', classify: '', archive: false, mark_read: false });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleRule(id: string) {
    const result = await dashboardApi.toggleFilteringRule(id);
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: result.enabled } : r))
    );
  }

  async function deleteRule(id: string) {
    await dashboardApi.deleteFilteringRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) {
    return <div className="p-6"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Filtering Rules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Rule-based filtering is free for all tiers. Matching emails skip AI classification.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
        >
          Create Rule
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createRule} className="border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Archive newsletters"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Domain</label>
              <input
                value={form.fromDomain}
                onChange={(e) => setForm((f) => ({ ...f, fromDomain: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. newsletter.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Regex</label>
              <input
                value={form.fromRegex}
                onChange={(e) => setForm((f) => ({ ...f, fromRegex: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. noreply@.*"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Contains</label>
              <input
                value={form.subject_contains}
                onChange={(e) => setForm((f) => ({ ...f, subject_contains: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. unsubscribe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classify As</label>
              <select
                value={form.classify}
                onChange={(e) => setForm((f) => ({ ...f, classify: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">None</option>
                <option value="newsletter">Newsletter</option>
                <option value="spam">Spam</option>
                <option value="automated">Automated</option>
                <option value="fyi">FYI</option>
                <option value="action-required">Action Required</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.archive}
                onChange={(e) => setForm((f) => ({ ...f, archive: e.target.checked }))}
                className="rounded"
              />
              Archive
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.mark_read}
                onChange={(e) => setForm((f) => ({ ...f, mark_read: e.target.checked }))}
                className="rounded"
              />
              Mark as Read
            </label>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Rule'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {rules.length === 0 ? (
          <p className="text-sm text-gray-400">No filtering rules yet.</p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{rule.name}</p>
                <div className="flex gap-2 mt-1 text-xs text-gray-500">
                  {rule.conditions.fromDomain && <span>Domain: {rule.conditions.fromDomain}</span>}
                  {rule.conditions.subject_contains && <span>Subject: {rule.conditions.subject_contains}</span>}
                  {rule.actions.classify && <span>Classify: {rule.actions.classify}</span>}
                  {rule.actions.archive && <span>Archive</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`text-xs px-2 py-1 rounded ${
                    rule.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
