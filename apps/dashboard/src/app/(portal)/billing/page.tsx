'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getSubscription()
      .then((data) => setSubscription(data.subscription))
      .finally(() => setLoading(false));
  }, []);

  async function openBillingPortal() {
    const { url } = await dashboardApi.getBillingPortal();
    window.location.href = url;
  }

  async function upgradeToStarter() {
    const { url } = await dashboardApi.createCheckout('starter');
    if (url) window.location.href = url;
  }

  async function upgradeToPro() {
    const { url } = await dashboardApi.createCheckout('pro');
    if (url) window.location.href = url;
  }

  if (loading) {
    return <div className="p-6"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      <section className="border rounded-xl p-6">
        {subscription ? (
          <div className="space-y-3">
            <div className="text-sm space-y-1">
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
              You are on the <strong>Free</strong> plan. Upgrade for more API calls and features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={upgradeToStarter}
                className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
              >
                Upgrade to Starter — $49/yr
              </button>
              <button
                onClick={upgradeToPro}
                className="px-4 py-2 border text-sm rounded-lg hover:bg-gray-50 transition"
              >
                Upgrade to Pro — $190/yr
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
