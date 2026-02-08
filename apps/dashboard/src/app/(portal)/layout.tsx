'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect } from 'react';

const navItems = [
  { href: '/overview', label: 'Overview' },
  { href: '/api-keys', label: 'API Keys' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/rules', label: 'Filtering Rules' },
  { href: '/usage', label: 'Usage' },
  { href: '/audit', label: 'Audit Log' },
  { href: '/billing', label: 'Billing' },
  { href: '/settings', label: 'Settings' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <Link href="/overview" className="text-lg font-bold text-brand-600">
            MailGate.ai
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">Developer Portal</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="text-sm text-gray-600 truncate">{user.email}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full capitalize">
              {user.tier}
            </span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
