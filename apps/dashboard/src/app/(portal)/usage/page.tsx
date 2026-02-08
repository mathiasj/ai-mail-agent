'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';

export default function UsagePage() {
  const [data, setData] = useState<{ usage: any; limits: any; tier: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getUsage()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-6"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Usage</h1>

      <section className="border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">This Month</h2>
        <div className="space-y-6">
          <UsageBar
            label="Gmail Accounts"
            used={data.usage.accountCount}
            limit={data.limits.maxAccounts}
          />
          <UsageBar
            label="Emails Processed"
            used={data.usage.emailsThisMonth}
            limit={data.limits.emailsPerMonth}
          />
          <UsageBar
            label="AI Drafts"
            used={data.usage.draftsThisMonth}
            limit={data.limits.draftsPerMonth}
          />
        </div>
      </section>

      <section className="border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">Current Plan</h2>
        <p className="text-sm text-gray-600">
          You are on the <span className="font-medium capitalize">{data.tier}</span> plan.
        </p>
      </section>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit > 99999;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = pct > 80;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {used} / {isUnlimited ? 'Unlimited' : limit.toLocaleString()}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? 'bg-red-500' : 'bg-brand-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
