import Link from 'next/link';

const sections = [
  {
    title: 'Authentication & Access Control',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
    items: [
      {
        label: 'OAuth 2.0 Integration',
        description: 'Gmail accounts connect via OAuth 2.0. We never store user passwords — only encrypted refresh tokens with minimal required scopes.',
      },
      {
        label: 'JWT Authentication',
        description: 'Short-lived JSON Web Tokens for session management. Tokens are signed with secure keys and expire automatically.',
      },
      {
        label: 'Scoped API Keys',
        description: 'Create API keys with granular permissions (read, write, delete). Set expiry dates and usage quotas. Keys are SHA-256 hashed before storage — the raw key is shown only once at creation.',
      },
    ],
  },
  {
    title: 'Data Security',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    items: [
      {
        label: 'Encryption in Transit',
        description: 'All API traffic is encrypted with TLS 1.2+. Every request and response travels over HTTPS — no exceptions.',
      },
      {
        label: 'Password Hashing',
        description: 'User passwords are hashed with bcrypt before storage. Raw passwords are never logged or persisted.',
      },
      {
        label: 'Secure Token Storage',
        description: 'OAuth refresh tokens and API key hashes are stored securely. API keys use SHA-256 one-way hashing — we cannot retrieve your raw key after creation.',
      },
    ],
  },
  {
    title: 'Webhook Security',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    items: [
      {
        label: 'HMAC-SHA256 Signatures',
        description: 'Every webhook payload is signed with your unique secret using HMAC-SHA256. Verify the X-Webhook-Signature header to confirm authenticity.',
      },
      {
        label: 'Per-User Secrets',
        description: 'Each user gets a unique webhook signing secret. Compromising one secret does not affect other accounts.',
      },
      {
        label: 'Automatic Retries',
        description: 'Failed webhook deliveries are retried with exponential backoff, ensuring your endpoints receive every event reliably.',
      },
    ],
  },
  {
    title: 'Audit & Monitoring',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    items: [
      {
        label: 'Complete Audit Trail',
        description: 'Every API request is logged with the user, action, resource, IP address, and timestamp. Nothing slips through unrecorded.',
      },
      {
        label: 'Filterable Logs',
        description: 'Search and filter your audit logs by action type, user, resource, and date range through the dashboard or API.',
      },
      {
        label: 'Real-time Events',
        description: 'Server-Sent Events (SSE) stream provides instant visibility into email processing, classification, and draft generation.',
      },
    ],
  },
  {
    title: 'Zero Data Retention',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    items: [
      {
        label: 'No Third-Party AI Processing',
        description: 'Mailgate.ai is a pure infrastructure gateway. Your email content is never sent to AI providers like OpenAI, Anthropic, or Google.',
      },
      {
        label: 'Your Data, Your Control',
        description: 'Email content stays within Mailgate infrastructure. We don\'t analyze, profile, or mine your data.',
      },
      {
        label: 'Instant Data Deletion',
        description: 'Delete your account and all associated data at any time. We don\'t retain email content for our own purposes — ever.',
      },
    ],
  },
  {
    title: 'GDPR & Privacy',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    items: [
      {
        label: 'EU Data Practices',
        description: 'We follow GDPR-aligned data handling practices. Your data is processed with purpose limitation and data minimization principles.',
      },
      {
        label: 'Data Export & Deletion',
        description: 'Export your data or delete your account at any time. Account deletion removes all associated emails, drafts, rules, and API keys.',
      },
      {
        label: 'No Data Mining',
        description: 'We don\'t sell, share, or send your email content to third parties. Your data exists solely to pass through the gateway — nothing more.',
      },
    ],
  },
  {
    title: 'Infrastructure',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    items: [
      {
        label: 'Isolated Services',
        description: 'Docker containerization isolates each service. The API, workers, database, and cache run in separate containers with restricted network access.',
      },
      {
        label: 'Environment Separation',
        description: 'Development, staging, and production environments are fully separated. Credentials and configuration are managed via environment variables, never hardcoded.',
      },
      {
        label: 'Validated Configuration',
        description: 'All environment variables are validated with Zod schemas at startup. The application refuses to start with missing or invalid configuration.',
      },
    ],
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-brand-600">
            Mailgate.ai
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="/#integrations" className="text-sm text-gray-600 hover:text-gray-900">
              Integrations
            </Link>
            <Link href="/security" className="text-sm text-brand-600 font-medium">
              Security
            </Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="mx-auto w-16 h-16 mb-6 text-brand-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          Security at Mailgate.ai
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Protecting your data is fundamental to everything we build. From encrypted connections to
          granular access controls, security is built into every layer of Mailgate.ai.
        </p>
      </section>

      {/* Security Sections */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="space-y-16">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-6">
                <div className="text-brand-600">{section.icon}</div>
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
              <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6">
                {section.items.map((item) => (
                  <div key={item.label} className="border rounded-xl p-5">
                    <h3 className="font-semibold mb-2">{item.label}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subprocessors */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-brand-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Subprocessors</h2>
        </div>
        <p className="text-gray-600 text-sm mb-8">
          These third-party services process data on our behalf to operate Mailgate.ai.
          No subprocessor receives your email content — they only handle infrastructure, authentication, and billing.
        </p>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Entity</th>
                <th className="text-left font-semibold px-5 py-3">Purpose</th>
                <th className="text-left font-semibold px-5 py-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-5 py-4 font-medium">Google Cloud</td>
                <td className="px-5 py-4 text-gray-600">Gmail API access, OAuth 2.0 authentication, Pub/Sub webhooks</td>
                <td className="px-5 py-4 text-gray-600">United States</td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-medium">Stripe</td>
                <td className="px-5 py-4 text-gray-600">Payment processing and subscription management</td>
                <td className="px-5 py-4 text-gray-600">United States</td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-medium">Railway</td>
                <td className="px-5 py-4 text-gray-600">Application hosting, database, and Redis infrastructure</td>
                <td className="px-5 py-4 text-gray-600">United States</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-400 text-xs mt-4">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Have security questions?</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            We take security seriously. If you have questions about our practices or need to report a
            vulnerability, reach out to our team.
          </p>
          <Link
            href="/signup"
            className="bg-brand-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-brand-700 transition"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Mailgate.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
