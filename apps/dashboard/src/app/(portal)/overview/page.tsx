'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';

export default function OverviewPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.getAnalytics(), dashboardApi.getUsage()])
      .then(([analyticsData, usageData]) => {
        setAnalytics(analyticsData);
        setUsage(usageData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Emails Processed"
          value={usage?.usage?.emailsThisMonth ?? 0}
          sublabel="this month"
        />
        <StatCard
          label="AI Drafts Generated"
          value={usage?.usage?.draftsThisMonth ?? 0}
          sublabel="this month"
        />
        <StatCard
          label="Connected Accounts"
          value={usage?.usage?.accountCount ?? 0}
          sublabel="active"
        />
      </div>

      {analytics?.dailyVolume && (
        <section className="border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Daily Volume (Last 7 Days)</h2>
          <div className="grid grid-cols-7 gap-2">
            {analytics.dailyVolume.slice(-7).map((day: any, i: number) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold">{day.count}</div>
                <div className="text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {analytics?.categories && (
        <section className="border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Email Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {analytics.categories.map((cat: any) => (
              <div key={cat.category} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{cat.category || 'uncategorized'}</span>
                <span className="font-medium">{cat.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, sublabel }: { label: string; value: number; sublabel: string }) {
  return (
    <div className="border rounded-xl p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
    </div>
  );
}
