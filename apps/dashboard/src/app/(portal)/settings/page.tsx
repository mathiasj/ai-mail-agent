'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();

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
    </div>
  );
}
