import Link from 'next/link';

const features = [
  {
    title: 'AI Classification',
    description:
      'Every email is automatically categorized and priority-scored so you see what matters first.',
    icon: '🏷️',
  },
  {
    title: 'Smart Summaries',
    description:
      'Get a one-line summary of every email. Skim your inbox in seconds, not minutes.',
    icon: '📝',
  },
  {
    title: 'AI Draft Replies',
    description:
      'One click generates a professional reply. Edit if you want, then approve to send.',
    icon: '✉️',
  },
  {
    title: 'Custom Rules',
    description:
      'Set up if-then rules: auto-archive newsletters, flag urgent emails, generate replies for VIPs.',
    icon: '⚡',
  },
  {
    title: 'Multi-Account',
    description:
      'Connect personal and work Gmail accounts. Manage everything from a single inbox.',
    icon: '📬',
  },
  {
    title: 'Real-Time Updates',
    description:
      'New emails appear instantly. Classifications and drafts stream in as they are processed.',
    icon: '🔄',
  },
];

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 Gmail account', '100 emails/month', '10 AI drafts/month', 'Basic classification'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    features: [
      '3 Gmail accounts',
      '1,000 emails/month',
      '100 AI drafts/month',
      'Auto-reply rules',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$50',
    period: '/month',
    features: [
      '10 Gmail accounts',
      '10,000 emails/month',
      'Unlimited AI drafts',
      'Shared rules',
      'Analytics dashboard',
      '1-year retention',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <span className="text-xl font-bold text-brand-600">Inboxrules</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
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
          Your AI Email Assistant
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Connect your Gmail. Let AI classify, summarize, and draft replies. You stay in
          control — approve everything before it sends.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-brand-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-brand-700 transition"
          >
            Start Free
          </Link>
          <a
            href="#features"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition"
          >
            Learn More
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-400">No credit card required. 100 emails/month free.</p>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything you need to tame your inbox
        </h2>
        <p className="text-gray-600 text-center mb-16 max-w-xl mx-auto">
          AI handles the tedious work. You make the decisions.
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

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-600 text-center mb-16">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-white rounded-xl p-8 ${
                  tier.highlighted
                    ? 'ring-2 ring-brand-600 shadow-lg scale-105'
                    : 'border'
                }`}
              >
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-gray-500">{tier.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-brand-600 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 block text-center py-2.5 rounded-lg font-medium transition ${
                    tier.highlighted
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Inboxrules. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
