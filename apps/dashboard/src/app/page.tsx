import Link from 'next/link';

const features = [
  {
    title: 'Email Classification API',
    description: 'Classify emails by category, priority, and intent using AI or rule-based filtering.',
    icon: '🏷️',
  },
  {
    title: 'Smart Filtering',
    description: 'Build rules with domain, regex, and keyword matching. Free for all tiers.',
    icon: '🔍',
  },
  {
    title: 'AI Draft Generation',
    description: 'Generate contextual reply drafts with GPT-4o. Review and send via API.',
    icon: '✉️',
  },
  {
    title: 'Gmail Integration',
    description: 'Connect Gmail accounts with OAuth. Real-time push via Pub/Sub webhooks.',
    icon: '📬',
  },
  {
    title: 'API Key Management',
    description: 'Create scoped API keys with granular read/write/delete permissions.',
    icon: '🔑',
  },
  {
    title: 'Audit Logging',
    description: 'Full audit trail of every API call. Filter by action, resource, and date.',
    icon: '📋',
  },
];

export default function DashboardLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <span className="text-xl font-bold text-brand-600">MailGate.ai</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#integrations" className="text-sm text-gray-600 hover:text-gray-900">
              Integrations
            </a>
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
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          Email infrastructure for AI agents
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Connect Gmail accounts, classify with AI or rules, generate drafts, and process email at scale.
          One API for your entire email pipeline.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-brand-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-brand-700 transition"
          >
            Start Building
          </Link>
          <a
            href="#features"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition"
          >
            See Features
          </a>
        </div>
        <div className="mt-8 bg-gray-900 text-gray-100 rounded-xl p-4 max-w-lg mx-auto text-left font-mono text-sm">
          <p className="text-gray-400">{'// Classify an email with one API call'}</p>
          <p>
            <span className="text-blue-400">curl</span> -X GET \
          </p>
          <p className="pl-4">
            -H <span className="text-green-400">{'"X-API-Key: mg_live_..."'}</span> \
          </p>
          <p className="pl-4">
            <span className="text-yellow-400">{'https://api.mailgate.ai/v1/emails'}</span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything you need to build email-powered AI
        </h2>
        <p className="text-gray-600 text-center mb-16 max-w-xl mx-auto">
          MailGate.ai handles the infrastructure so you can focus on your AI logic.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="border rounded-xl p-6 hover:shadow-lg transition">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations / OpenClaw Showcase */}
      <section
        id="integrations"
        className="bg-gradient-to-br from-brand-50 via-white to-indigo-50 py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            Built for AI Agent Platforms
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-xl mx-auto">
            Connect your AI agents to MailGate.ai via real-time SSE or webhook callbacks.
          </p>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Value props */}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Agent Integration</h3>
                <p className="text-gray-600 text-sm">
                  Platforms like OpenClaw connect via SSE, receiving email events in real-time.
                  No public URL needed — your agent initiates an outbound connection.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Secure Token Exchange</h3>
                <p className="text-gray-600 text-sm">
                  Exchange your long-lived API key for a short-lived SSE token.
                  Credentials never appear in URLs or query strings.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Webhook Callbacks</h3>
                <p className="text-gray-600 text-sm">
                  Cloud-hosted agents receive HTTP POST callbacks with HMAC-SHA256 signatures
                  when filtering rules match incoming email.
                </p>
              </div>
            </div>

            {/* Right: Code example */}
            <div className="bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm overflow-x-auto">
              <p className="text-gray-400 mb-3">{'// 1. Exchange API key for SSE token'}</p>
              <p>
                <span className="text-blue-400">const</span>{' '}
                <span className="text-yellow-300">{'{ token }'}</span> ={' '}
                <span className="text-blue-400">await</span> fetch(
              </p>
              <p className="pl-4">
                <span className="text-green-400">{'"https://api.mailgate.ai/v1/auth/sse-token"'}</span>,
              </p>
              <p className="pl-4">
                {'{ method: '}
                <span className="text-green-400">{'"POST"'}</span>
                {', headers: { '}
                <span className="text-green-400">{'"X-API-Key"'}</span>
                {': key } }'}
              </p>
              <p>{')'}.json();</p>

              <p className="text-gray-400 mt-4 mb-3">{'// 2. Connect to SSE stream'}</p>
              <p>
                <span className="text-blue-400">const</span> es ={' '}
                <span className="text-blue-400">new</span>{' '}
                <span className="text-yellow-300">EventSource</span>(
              </p>
              <p className="pl-4">
                <span className="text-green-400">{`\`https://api.mailgate.ai/v1/events/stream?token=\${token}\``}</span>
              </p>
              <p>);</p>

              <p className="text-gray-400 mt-4 mb-3">{'// 3. Handle real-time events'}</p>
              <p>
                es.addEventListener(<span className="text-green-400">{'"new_email"'}</span>, (e) ={'> {'}
              </p>
              <p className="pl-4">
                <span className="text-blue-400">const</span> email = JSON.parse(e.data);
              </p>
              <p className="pl-4">
                processIncomingEmail(email);
              </p>
              <p>{'}'});</p>

              <p className="text-gray-400 mt-6 mb-3">{'// Webhook payload (for cloud agents)'}</p>
              <p>{'{'}</p>
              <p className="pl-4">
                <span className="text-green-400">{'"event"'}</span>:{' '}
                <span className="text-green-400">{'"email.filtered"'}</span>,
              </p>
              <p className="pl-4">
                <span className="text-green-400">{'"email"'}</span>: {'{ id, from, subject }'},
              </p>
              <p className="pl-4">
                <span className="text-green-400">{'"rule"'}</span>: {'{ id, name }'}
              </p>
              <p>{'}'}</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="bg-brand-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-brand-700 transition"
            >
              Start Integrating
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} MailGate.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
