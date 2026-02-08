'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  'action-required': 'bg-red-500',
  fyi: 'bg-blue-500',
  meeting: 'bg-purple-500',
  newsletter: 'bg-gray-400',
  automated: 'bg-yellow-500',
  spam: 'bg-orange-500',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.getAnalytics().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  async function handleExport(format: 'json' | 'csv') {
    setExporting(true);
    try {
      const result = await api.exportEmails(format);
      if (format === 'csv') {
        const blob = new Blob([result as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emails-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emails-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  const maxDailyCount = Math.max(...data.dailyVolume.map((d: any) => d.count), 1);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-3 py-1.5 border text-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="px-3 py-1.5 border text-sm rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Export JSON
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">Last 30 days</p>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Emails" value={data.totalEmails} />
        <StatCard label="Drafts Generated" value={data.drafts.total} />
        <StatCard label="Drafts Sent" value={data.drafts.sent} />
        <StatCard
          label="Acceptance Rate"
          value={`${Math.round(data.drafts.acceptanceRate * 100)}%`}
        />
      </div>

      {/* Category breakdown */}
      <section className="border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Categories</h2>
        <div className="space-y-3">
          {data.categories.map((cat: any) => {
            const pct = data.totalEmails > 0 ? (cat.count / data.totalEmails) * 100 : 0;
            return (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32 truncate">
                  {cat.category || 'uncategorized'}
                </span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[cat.category] || 'bg-gray-300'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-16 text-right">{cat.count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily volume chart (simple bar chart) */}
      <section className="border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Daily Volume</h2>
        <div className="flex items-end gap-1 h-40">
          {data.dailyVolume.map((day: any) => (
            <div
              key={day.date}
              className="flex-1 bg-brand-500 rounded-t hover:bg-brand-600 transition"
              style={{ height: `${(day.count / maxDailyCount) * 100}%`, minHeight: '2px' }}
              title={`${day.date}: ${day.count} emails`}
            />
          ))}
        </div>
        {data.dailyVolume.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{data.dailyVolume[0].date}</span>
            <span>{data.dailyVolume[data.dailyVolume.length - 1].date}</span>
          </div>
        )}
      </section>

      {/* Top senders */}
      <section className="border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Top Senders</h2>
        <div className="space-y-2">
          {data.topSenders.map((sender: any, i: number) => (
            <div key={sender.sender} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-6">{i + 1}.</span>
                <span className="truncate max-w-sm">{sender.sender}</span>
              </div>
              <span className="font-medium">{sender.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-xl p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
