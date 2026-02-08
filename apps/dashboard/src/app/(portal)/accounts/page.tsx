'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getAccounts()
      .then((data) => setAccounts(data.accounts))
      .finally(() => setLoading(false));
  }, []);

  async function connectGmail() {
    const { url } = await dashboardApi.connectAccount();
    window.location.href = url;
  }

  async function disconnectAccount(id: string) {
    await dashboardApi.disconnectAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return <div className="p-6"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connected Accounts</h1>
        <button
          onClick={connectGmail}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition"
        >
          Connect Gmail
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-gray-400">No Gmail accounts connected.</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="border rounded-xl p-4 flex items-center justify-between">
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
    </div>
  );
}
