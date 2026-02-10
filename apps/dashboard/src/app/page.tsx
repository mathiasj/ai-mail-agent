import Link from 'next/link';
import PricingSection from '@/components/pricing-section';

const features = [
  {
    title: 'Zero Data Retention',
    description:
      "Your email content never touches third-party services. We don't process, analyze, or mine your data. Zero means zero.",
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='w-8 h-8'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z'
        />
      </svg>
    ),
  },
  {
    title: 'Encrypted by Default',
    description: 'TLS 1.2+ on all traffic. OAuth tokens encrypted at rest. Passwords bcrypt-hashed. No exceptions.',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='w-8 h-8'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z'
        />
      </svg>
    ),
  },
  {
    title: 'Secure Gmail Gateway',
    description: 'Connect Gmail via OAuth 2.0. No passwords stored. Real-time push via Pub/Sub webhooks.',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='w-8 h-8'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75'
        />
      </svg>
    ),
  },
  {
    title: 'Scoped API Keys',
    description: 'Granular read/write/delete permissions. SHA-256 hashed before storage. Shown only once at creation.',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='w-8 h-8'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z'
        />
      </svg>
    ),
  },
  {
    title: 'Signed Webhooks',
    description: 'Every payload signed with HMAC-SHA256. Per-user secrets. Automatic retries with exponential backoff.',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='w-8 h-8'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5'
        />
      </svg>
    ),
  },
  {
    title: 'Full Audit Trail',
    description: 'Every API request logged with user, action, IP address, and timestamp. Nothing goes unrecorded.',
    icon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
        strokeWidth={1.5}
        stroke='currentColor'
        className='w-8 h-8'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'
        />
      </svg>
    ),
  },
];

export default function DashboardLandingPage() {
  return (
    <div className='min-h-screen'>
      {/* Navbar */}
      <nav className='border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16'>
          <span className='text-xl font-bold text-brand-600'>Mailgate.ai</span>
          <div className='flex items-center gap-6'>
            <a href='#features' className='text-sm text-gray-600 hover:text-gray-900'>
              Features
            </a>
            <a href='#pricing' className='text-sm text-gray-600 hover:text-gray-900'>
              Pricing
            </a>
            <a href='#integrations' className='text-sm text-gray-600 hover:text-gray-900'>
              Integrations
            </a>
            <Link href='/security' className='text-sm text-gray-600 hover:text-gray-900'>
              Security
            </Link>
            <Link href='/login' className='text-sm text-gray-600 hover:text-gray-900'>
              Log in
            </Link>
            <Link
              href='/signup'
              className='bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition'
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center'>
        <h1 className='text-5xl sm:text-6xl font-bold tracking-tight'>The secure email gateway for AI agents</h1>
        <p className='mt-6 text-xl text-gray-600 max-w-2xl mx-auto'>
          A privacy-first infrastructure layer between Gmail and your AI agent. Your data never leaves our servers.
          Simple, trustworthy, and fully auditable.
        </p>
        <div className='mt-10 flex gap-4 justify-center'>
          <Link
            href='/signup'
            className='bg-brand-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-brand-700 transition'
          >
            Start Building
          </Link>
          <a
            href='#features'
            className='border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition'
          >
            See Features
          </a>
        </div>
        <div className='mt-8 bg-gray-900 text-gray-100 rounded-xl p-4 max-w-lg mx-auto text-left font-mono text-sm'>
          <p className='text-gray-400'>{'// Fetch emails via API'}</p>
          <p>
            <span className='text-blue-400'>curl</span> -X GET \
          </p>
          <p className='pl-4'>
            -H <span className='text-green-400'>{'"X-API-Key: mg_live_..."'}</span> \
          </p>
          <p className='pl-4'>
            <span className='text-yellow-400'>{'https://api.mailgate.ai/v1/emails'}</span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section id='features' className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
        <h2 className='text-3xl font-bold text-center mb-4'>Security and privacy at every layer</h2>
        <p className='text-gray-600 text-center mb-16 max-w-xl mx-auto'>
          A simple, trustworthy gateway. Your data stays in our infrastructure — always.
        </p>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature) => (
            <div key={feature.title} className='border rounded-xl p-6 hover:shadow-lg transition'>
              <div className='text-brand-600 mb-4'>{feature.icon}</div>
              <h3 className='text-lg font-semibold mb-2'>{feature.title}</h3>
              <p className='text-gray-600 text-sm'>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <PricingSection />

      {/* Security Trust Section */}
      <section id='security' className='bg-gray-50 py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold text-center mb-4'>Enterprise-grade security</h2>
          <p className='text-gray-600 text-center mb-16 max-w-xl mx-auto'>
            Your data is protected at every layer. Built with security best practices from day one.
          </p>
          <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-8'>
            <div className='text-center'>
              <div className='mx-auto w-12 h-12 mb-4 text-brand-600'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold mb-2'>Encryption in Transit</h3>
              <p className='text-gray-600 text-sm'>
                All data encrypted with TLS 1.2+. Every API call travels over HTTPS.
              </p>
            </div>
            <div className='text-center'>
              <div className='mx-auto w-12 h-12 mb-4 text-brand-600'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold mb-2'>Audit Logging</h3>
              <p className='text-gray-600 text-sm'>
                Complete audit trail of every API request. Filter by action, user, and date.
              </p>
            </div>
            <div className='text-center'>
              <div className='mx-auto w-12 h-12 mb-4 text-brand-600'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold mb-2'>GDPR Compliant</h3>
              <p className='text-gray-600 text-sm'>
                EU data handling practices. Export or delete your data at any time.
              </p>
            </div>
            <div className='text-center'>
              <div className='mx-auto w-12 h-12 mb-4 text-brand-600'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold mb-2'>Signed Webhooks</h3>
              <p className='text-gray-600 text-sm'>Every webhook payload signed with your unique HMAC-SHA256 secret.</p>
            </div>
          </div>
          <div className='text-center mt-12'>
            <Link
              href='/security'
              className='text-brand-600 font-medium hover:text-brand-700 transition inline-flex items-center gap-1'
            >
              Learn more about our security
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={2}
                stroke='currentColor'
                className='w-4 h-4'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3' />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Zero Data Retention */}
      <section className='bg-gray-900 text-white py-24'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-4xl font-bold mb-6'>Zero Data Retention</h2>
          <p className='text-lg text-gray-300 leading-relaxed mb-8'>
            Your email data never touches third-party AI. Mailgate.ai is a pure infrastructure gateway — we never send
            your content to AI providers, never train models on your data, and never store your email content for our
            own purposes. Zero means zero.
          </p>
          <Link
            href='/security'
            className='text-brand-400 font-medium hover:text-brand-300 transition inline-flex items-center gap-1'
          >
            Learn more
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={2}
              stroke='currentColor'
              className='w-4 h-4'
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3' />
            </svg>
          </Link>
        </div>
      </section>

      {/* Integrations / OpenClaw Showcase */}
      <section id='integrations' className='bg-gradient-to-br from-brand-50 via-white to-indigo-50 py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-3xl font-bold text-center mb-4'>Built for AI Agent Platforms</h2>
          <p className='text-gray-600 text-center mb-16 max-w-xl mx-auto'>
            Connect your AI agents to Mailgate.ai via real-time SSE or webhook callbacks.
          </p>

          <div className='grid lg:grid-cols-2 gap-12 items-start'>
            {/* Left: Value props */}
            <div className='space-y-8'>
              <div>
                <h3 className='text-lg font-semibold mb-2'>AI Agent Integration</h3>
                <p className='text-gray-600 text-sm'>
                  Platforms like OpenClaw connect via SSE, receiving email events in real-time. No public URL needed —
                  your agent initiates an outbound connection.
                </p>
              </div>
              <div>
                <h3 className='text-lg font-semibold mb-2'>Secure Token Exchange</h3>
                <p className='text-gray-600 text-sm'>
                  Exchange your long-lived API key for a short-lived SSE token. Credentials never appear in URLs or
                  query strings.
                </p>
              </div>
              <div>
                <h3 className='text-lg font-semibold mb-2'>Webhook Callbacks</h3>
                <p className='text-gray-600 text-sm'>
                  Cloud-hosted agents receive HTTP POST callbacks with HMAC-SHA256 signatures when filtering rules match
                  incoming email.
                </p>
              </div>
            </div>

            {/* Right: Code example */}
            <div className='bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm overflow-x-auto'>
              <p className='text-gray-400 mb-3'>{'// 1. Exchange API key for SSE token'}</p>
              <p>
                <span className='text-blue-400'>const</span> <span className='text-yellow-300'>{'{ token }'}</span> ={' '}
                <span className='text-blue-400'>await</span> fetch(
              </p>
              <p className='pl-4'>
                <span className='text-green-400'>{'"https://api.mailgate.ai/v1/auth/sse-token"'}</span>,
              </p>
              <p className='pl-4'>
                {'{ method: '}
                <span className='text-green-400'>{'"POST"'}</span>
                {', headers: { '}
                <span className='text-green-400'>{'"X-API-Key"'}</span>
                {': key } }'}
              </p>
              <p>{')'}.json();</p>

              <p className='text-gray-400 mt-4 mb-3'>{'// 2. Connect to SSE stream'}</p>
              <p>
                <span className='text-blue-400'>const</span> es = <span className='text-blue-400'>new</span>{' '}
                <span className='text-yellow-300'>EventSource</span>(
              </p>
              <p className='pl-4'>
                <span className='text-green-400'>{`\`https://api.mailgate.ai/v1/events/stream?token=\${token}\``}</span>
              </p>
              <p>);</p>

              <p className='text-gray-400 mt-4 mb-3'>{'// 3. Handle real-time events'}</p>
              <p>
                es.addEventListener(<span className='text-green-400'>{'"new_email"'}</span>, (e) ={'> {'}
              </p>
              <p className='pl-4'>
                <span className='text-blue-400'>const</span> email = JSON.parse(e.data);
              </p>
              <p className='pl-4'>processIncomingEmail(email);</p>
              <p>{'}'});</p>

              <p className='text-gray-400 mt-6 mb-3'>{'// Webhook payload (for cloud agents)'}</p>
              <p>{'{'}</p>
              <p className='pl-4'>
                <span className='text-green-400'>{'"event"'}</span>:{' '}
                <span className='text-green-400'>{'"email.filtered"'}</span>,
              </p>
              <p className='pl-4'>
                <span className='text-green-400'>{'"email"'}</span>: {'{ id, from, subject }'},
              </p>
              <p className='pl-4'>
                <span className='text-green-400'>{'"rule"'}</span>: {'{ id, name }'}
              </p>
              <p>{'}'}</p>
            </div>
          </div>

          <div className='text-center mt-12'>
            <Link
              href='/signup'
              className='bg-brand-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-brand-700 transition'
            >
              Start Integrating
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4 text-sm text-gray-500'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            xmlnsXlink='http://www.w3.org/1999/xlink'
            fill='none'
            viewBox='-18 -1 142 142'
            width='48'
            height='48'
          >
            <path
              fill='#274DD8'
              d='M.84 13.293c0-7.18 5.82-13 13-13h78.747c7.18 0 13 5.82 13 13v114.351c0 7.18-5.82 13-13 13H13.84c-7.18 0-13-5.82-13-13z'
            ></path>
            <path
              fill='#191F2C'
              d='M.84 87.496h104.747v40.148c0 7.179-5.82 13-13 13H13.84c-7.18 0-13-5.82-13-13z'
            ></path>
            <path fill='url(#gdpr_badge_svg__a)' d='M20.303 12.709h65.821V78.53H20.303z'></path>
            <path
              fill='#fff'
              d='M60.795 45.62c0-1.046-.85-1.896-1.896-1.896h-.947v-2.842a4.743 4.743 0 0 0-4.738-4.738 4.743 4.743 0 0 0-4.738 4.738v2.842h-.948c-1.045 0-1.895.85-1.895 1.896v7.58c0 1.045.85 1.895 1.895 1.895H58.9c1.045 0 1.895-.85 1.895-1.895zM50.37 40.882a2.846 2.846 0 0 1 2.843-2.843 2.846 2.846 0 0 1 2.843 2.843v2.842H50.37zm-16.428 68.952q-1.584 0-2.826-.702-1.224-.702-1.908-2.07t-.684-3.33q0-1.908.72-3.276a5 5 0 0 1 2.052-2.124q1.35-.738 3.168-.738 2.034 0 3.258.738 1.242.72 1.926 2.304l-2.862 1.134q-.234-.918-.828-1.332t-1.476-.414q-1.332 0-2.07.954-.72.936-.72 2.736 0 1.908.738 2.844.738.918 2.214.918 1.026 0 1.71-.486t.684-1.494v-.18H34.32v-2.07h5.346v6.408H37.56l-.126-1.458a3.35 3.35 0 0 1-1.386 1.224q-.864.414-2.106.414m13.133-12.06q2.79 0 4.266 1.548 1.494 1.548 1.494 4.392t-1.494 4.392q-1.476 1.548-4.266 1.548h-5.04v-11.88zm-.306 9.54q1.512 0 2.196-.9.702-.918.702-2.7t-.702-2.682q-.684-.918-2.196-.918h-1.638v7.2zm13.641-9.54q2.16 0 3.365 1.044Q65 99.844 65 101.734t-1.224 2.934q-1.206 1.026-3.366 1.026h-2.358v3.96h-3.096v-11.88zm-.487 5.598q1.962 0 1.962-1.638t-1.962-1.638h-1.872v3.276zm12.726-5.598q2.124 0 3.294.99 1.188.99 1.188 2.664 0 1.332-.63 2.196-.612.846-1.764 1.242l3.096 4.788h-3.42l-2.538-4.338H70.02v4.338h-3.042v-11.88zm-.432 5.346q.9 0 1.35-.36t.45-1.152q0-1.494-1.8-1.494H70.02v3.006zM22.85 123.555q-.377 1.352-1.39 1.976-1.002.61-2.367.611-1.313 0-2.262-.52a3.6 3.6 0 0 1-1.443-1.521q-.507-.989-.507-2.379 0-1.392.507-2.379a3.5 3.5 0 0 1 1.443-1.508q.949-.533 2.25-.533 1.338 0 2.34.572 1 .571 1.325 1.794l-1.963.793q-.181-.794-.598-1.092-.402-.312-1.027-.312-.936 0-1.469.676-.52.675-.52 1.989 0 1.313.494 1.989.507.675 1.508.676.624 0 1.053-.338.442-.351.598-1.066zm5.092-6.253q1.3 0 2.236.533a3.5 3.5 0 0 1 1.456 1.508q.507.987.507 2.379 0 1.39-.507 2.379a3.6 3.6 0 0 1-1.456 1.521q-.936.52-2.236.52-1.314 0-2.262-.52a3.6 3.6 0 0 1-1.443-1.521q-.507-.989-.507-2.379 0-1.392.507-2.379a3.5 3.5 0 0 1 1.443-1.508q.948-.533 2.262-.533m0 1.755q-.936 0-1.43.676-.495.663-.494 1.989 0 1.326.494 2.002.494.663 1.43.663.922 0 1.417-.663.494-.676.494-2.002t-.494-1.989q-.495-.676-1.417-.676m15.668-1.625v8.58h-1.975v-3.939l.065-2.639h-.026l-2.12 6.578h-1.806l-2.12-6.578h-.025l.065 2.639v3.939h-1.99v-8.58h3.186l1.352 4.368.48 1.82h.027l.494-1.807 1.339-4.381zm5.84 0q1.56 0 2.43.754.885.741.885 2.106t-.884 2.119q-.87.741-2.431.741h-1.703v2.86H45.51v-8.58zm-.351 4.043q1.416 0 1.417-1.183 0-1.183-1.417-1.183h-1.352v2.366zm7.331 2.808h4.303v1.729h-6.539v-8.58h2.236zm7.82-6.851v8.58h-2.235v-8.58zm1.006 8.58 3.016-8.58h2.678l3.003 8.58h-2.3l-.586-1.937h-2.964l-.598 1.937zm3.965-5.525-.65 2.067H70.6l-.624-2.054-.377-1.352h-.026zm13.465-3.055v8.58h-2.483l-2.665-4.641-.65-1.274h-.013l.052 1.586v4.329h-1.976v-8.58h2.483l2.665 4.641.65 1.274h.013l-.052-1.586v-4.329zm9.116 0v1.729h-2.795v6.851H86.77v-6.851h-2.808v-1.729z'
            ></path>
            <defs>
              <pattern id='gdpr_badge_svg__a' width='1' height='1' patternContentUnits='objectBoundingBox'>
                <use xlinkHref='#gdpr_badge_svg__b' transform='scale(.00167)'></use>
              </pattern>
              <image
                xlinkHref='data:image/png;base64,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'
                id='gdpr_badge_svg__b'
                width='600'
                height='600'
              ></image>
            </defs>
          </svg>
          <p>&copy; {new Date().getFullYear()} Mailgate.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
