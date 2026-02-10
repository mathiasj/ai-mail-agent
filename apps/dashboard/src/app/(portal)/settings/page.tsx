'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { dashboardApi } from '@/lib/api';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [secretVisible, setSecretVisible] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleRegenerate() {
    if (!confirm('Are you sure? Any integrations using the current secret will stop working.')) return;
    setRegenerating(true);
    try {
      await dashboardApi.regenerateWebhookSecret();
      await refreshUser();
    } finally {
      setRegenerating(false);
    }
  }

  function handleCopy() {
    if (user?.webhookSecret) {
      navigator.clipboard.writeText(user.webhookSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Email:</span>{' '}
            <span className="font-medium">{user?.email}</span>
          </p>
          <p>
            <span className="text-gray-500">Name:</span>{' '}
            <span className="font-medium">{user?.name || 'Not set'}</span>
          </p>
          <p>
            <span className="text-gray-500">Plan:</span>{' '}
            <span className="font-medium capitalize">{user?.tier}</span>
          </p>
        </div>
      </section>

      <section className="border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">Webhook Secret</h2>
        <p className="text-sm text-gray-500 mb-4">
          Used to verify webhook payloads via HMAC-SHA256 signature in the <code className="bg-gray-100 px-1 rounded">X-Mailgate-Signature</code> header.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono select-all overflow-hidden">
            {secretVisible ? user?.webhookSecret : '••••••••••••••••••••••••••••••••••••'}
          </code>
          <button
            onClick={() => setSecretVisible(!secretVisible)}
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
          >
            {secretVisible ? 'Hide' : 'Reveal'}
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="mt-3 px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50"
        >
          {regenerating ? 'Regenerating...' : 'Regenerate Secret'}
        </button>
      </section>
    </div>
  );
}
