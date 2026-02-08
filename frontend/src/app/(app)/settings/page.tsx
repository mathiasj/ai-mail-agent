'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [accountsData, subData] = await Promise.all([
        api.getGmailAccounts(),
        api.getSubscription(),
      ]);
      setAccounts(accountsData.accounts);
      setSubscription(subData.subscription);
      setLoading(false);
    }
    load();
  }, []);

  async function connectGmail() {
    const { url } = await api.getGmailConnectUrl();
    window.location.href = url;
  }

  async function disconnectAccount(id: string) {
    await api.disconnectGmailAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  async function openBillingPortal() {
    const { url } = await api.getBillingPortal();
    window.location.href = url;
  }

  async function upgradeToPro() {
    const { url } = await api.createCheckout('pro');
    if (url) window.location.href = url;
  }

  async function upgradeToTeam() {
    const { url } = await api.createCheckout('team');
    if (url) window.location.href = url;
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account info */}
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

      {/* Gmail accounts */}
      <section className="border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Gmail Accounts</h2>
          <button
            onClick={connectGmail}
            className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
          >
            Connect Gmail
          </button>
        </div>

        {accounts.length === 0 ? (
          <p className="text-sm text-gray-400">
            No Gmail accounts connected. Connect one to start processing emails.
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{account.email}</p>
                  <p className="text-xs text-gray-400">
                    Connected {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      account.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {account.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => disconnectAccount(account.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Billing */}
      <section className="border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Billing</h2>

        {subscription ? (
          <div className="space-y-3">
            <div className="text-sm">
              <p>
                <span className="text-gray-500">Plan:</span>{' '}
                <span className="font-medium capitalize">{subscription.tier}</span>
              </p>
              <p>
                <span className="text-gray-500">Status:</span>{' '}
                <span className="font-medium capitalize">{subscription.status}</span>
              </p>
              <p>
                <span className="text-gray-500">Next billing:</span>{' '}
                <span className="font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </p>
            </div>
            <button
              onClick={openBillingPortal}
              className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-50 transition"
            >
              Manage Subscription
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are on the <strong>Free</strong> plan. Upgrade for more features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={upgradeToPro}
                className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
              >
                Upgrade to Pro — $15/mo
              </button>
              <button
                onClick={upgradeToTeam}
                className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-50 transition"
              >
                Upgrade to Team — $50/mo
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
