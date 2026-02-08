'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const CONDITION_TYPES = [
  { value: 'from', label: 'From contains' },
  { value: 'to', label: 'To contains' },
  { value: 'subject_contains', label: 'Subject contains' },
  { value: 'category', label: 'Category is' },
  { value: 'priority_gte', label: 'Priority at least' },
];

const ACTION_TYPES = [
  { value: 'classify', label: 'Classify as' },
  { value: 'auto_reply', label: 'Generate auto-reply' },
  { value: 'archive', label: 'Archive' },
  { value: 'mark_read', label: 'Mark as read' },
];

const CATEGORIES = ['action-required', 'fyi', 'meeting', 'newsletter', 'automated', 'spam'];

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [conditionType, setConditionType] = useState('from');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState('classify');
  const [actionValue, setActionValue] = useState('');
  const [priority, setPriority] = useState(0);

  async function loadRules() {
    const { rules: data } = await api.getRules();
    setRules(data);
    setLoading(false);
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    const conditions: Record<string, any> = {};
    if (conditionType === 'priority_gte') {
      conditions[conditionType] = parseInt(conditionValue);
    } else {
      conditions[conditionType] = conditionValue;
    }

    const actions: Record<string, any> = {};
    if (actionType === 'auto_reply' || actionType === 'archive' || actionType === 'mark_read') {
      actions[actionType] = true;
    } else {
      actions[actionType] = actionValue;
    }

    await api.createRule({ name, conditions, actions, priority });
    setShowForm(false);
    setName('');
    setConditionValue('');
    setActionValue('');
    loadRules();
  }

  async function handleToggle(id: string) {
    await api.toggleRule(id);
    loadRules();
  }

  async function handleDelete(id: string) {
    await api.deleteRule(id);
    loadRules();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rules</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
        >
          {showForm ? 'Cancel' : 'New Rule'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="border rounded-xl p-6 mb-8 space-y-4">
          <h3 className="font-semibold">Create New Rule</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Archive newsletters"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">When email...</label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {CONDITION_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              {conditionType === 'category' ? (
                <select
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={conditionType === 'priority_gte' ? 'number' : 'text'}
                  required
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder={conditionType === 'priority_gte' ? '1-10' : 'Enter value...'}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Then...</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            {actionType === 'classify' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classify as
                </label>
                <select
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority (higher = runs first)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              className="w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-brand-700 transition"
          >
            Create Rule
          </button>
        </form>
      )}

      {/* Rules list */}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No rules yet</p>
          <p className="text-sm mt-1">Create rules to automate your email workflow.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`border rounded-xl p-4 flex items-center justify-between ${
                rule.enabled ? '' : 'opacity-50'
              }`}
            >
              <div>
                <p className="font-medium text-sm">{rule.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  When: {JSON.stringify(rule.conditions)} → Then: {JSON.stringify(rule.actions)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(rule.id)}
                  className={`text-xs px-3 py-1 rounded-full ${
                    rule.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
