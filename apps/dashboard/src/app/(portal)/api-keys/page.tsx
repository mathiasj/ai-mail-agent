'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState({ canRead: true, canWrite: false, canDelete: false });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dashboardApi
      .getApiKeys()
      .then((data) => setKeys(data.apiKeys))
      .finally(() => setLoading(false));
  }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await dashboardApi.createApiKey({
        name: newKeyName,
        permissions: newKeyPerms,
      });
      setCreatedKey(result.rawKey);
      setKeys((prev) => [result.apiKey, ...prev]);
      setNewKeyName('');
      setShowCreate(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    await dashboardApi.revokeApiKey(id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  if (loading) {
    return <div className="p-6"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
        >
          Create API Key
        </button>
      </div>

      {createdKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            API key created! Copy it now — it won&apos;t be shown again.
          </p>
          <code className="block bg-white border rounded p-3 text-sm font-mono break-all">
            {createdKey}
          </code>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-2 text-xs text-green-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {showCreate && (
        <form onSubmit={createKey} className="border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
            <input
              type="text"
              required
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Production API Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="space-y-2">
              {(['canRead', 'canWrite', 'canDelete'] as const).map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newKeyPerms[perm]}
                    onChange={(e) =>
                      setNewKeyPerms((prev) => ({ ...prev, [perm]: e.target.checked }))
                    }
                    className="rounded"
                  />
                  {perm === 'canRead' ? 'Read' : perm === 'canWrite' ? 'Write' : 'Delete'}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Key'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {keys.length === 0 ? (
          <p className="text-sm text-gray-400">No API keys yet. Create one to get started.</p>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{key.name}</p>
                <p className="text-xs text-gray-400 font-mono">{key.keyPrefix}...</p>
                <div className="flex gap-2 mt-1">
                  {key.permissions.canRead && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Read</span>
                  )}
                  {key.permissions.canWrite && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Write</span>
                  )}
                  {key.permissions.canDelete && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Delete</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {key.lastUsedAt
                    ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                    : 'Never used'}
                </p>
                <button
                  onClick={() => revokeKey(key.id)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
