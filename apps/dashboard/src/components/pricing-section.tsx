'use client';

import { useState } from 'react';
import Link from 'next/link';

type Interval = 'monthly' | 'yearly';

const CheckIcon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='w-4 h-4 text-brand-600 shrink-0'>
    <path strokeLinecap='round' strokeLinejoin='round' d='m4.5 12.75 6 6 9-13.5' />
  </svg>
);

export default function PricingSection() {
  const [interval, setInterval] = useState<Interval>('yearly');

  const starterPrice = interval === 'yearly' ? '$49' : '$5';
  const starterSuffix = interval === 'yearly' ? '/yr' : '/mo';
  const proPrice = interval === 'yearly' ? '$190' : '$19';
  const proSuffix = interval === 'yearly' ? '/yr' : '/mo';
  const renewLabel = interval === 'yearly' ? 'Auto-renews yearly. Cancel anytime.' : 'Auto-renews monthly. Cancel anytime.';

  return (
    <section id='pricing' className='bg-gray-50 py-24'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h2 className='text-3xl font-bold text-center mb-4'>Simple, transparent pricing</h2>
        <p className='text-gray-600 text-center mb-10 max-w-xl mx-auto'>
          Start free. Scale as you grow.
        </p>

        {/* Interval toggle */}
        <div className='flex justify-center mb-16'>
          <div className='inline-flex rounded-full bg-gray-200 p-1'>
            <button
              onClick={() => setInterval('monthly')}
              className={`px-5 py-1.5 text-sm font-medium rounded-full transition ${
                interval === 'monthly'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-5 py-1.5 text-sm font-medium rounded-full transition ${
                interval === 'yearly'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className='grid md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
          {/* Free */}
          <div className='border rounded-xl p-8 bg-white'>
            <h3 className='text-lg font-semibold mb-2'>Free</h3>
            <div className='mb-6'>
              <span className='text-4xl font-bold'>$0</span>
            </div>
            <ul className='space-y-3 text-sm text-gray-600 mb-8'>
              <li className='flex items-center gap-2'><CheckIcon />100 emails/month</li>
              <li className='flex items-center gap-2'><CheckIcon />1 Gmail account</li>
              <li className='flex items-center gap-2'><CheckIcon />1 API key</li>
              <li className='flex items-center gap-2'><CheckIcon />30-day audit log retention</li>
            </ul>
            <Link
              href='/signup'
              className='block text-center border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition'
            >
              Get Started
            </Link>
          </div>

          {/* Starter — Popular */}
          <div className='border-2 border-brand-600 rounded-xl p-8 bg-white relative'>
            <span className='absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-medium px-3 py-1 rounded-full'>
              Popular
            </span>
            <h3 className='text-lg font-semibold mb-2'>Starter</h3>
            <div className='mb-6'>
              <span className='text-4xl font-bold'>{starterPrice}</span>
              <span className='text-gray-500 ml-1'>{starterSuffix}</span>
            </div>
            <ul className='space-y-3 text-sm text-gray-600 mb-8'>
              <li className='flex items-center gap-2'><CheckIcon />1,000 emails/month</li>
              <li className='flex items-center gap-2'><CheckIcon />3 Gmail accounts</li>
              <li className='flex items-center gap-2'><CheckIcon />5 API keys</li>
              <li className='flex items-center gap-2'><CheckIcon />90-day audit log retention</li>
            </ul>
            <Link
              href='/signup'
              className='block text-center bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition'
            >
              Start Free Trial
            </Link>
            <p className='text-xs text-gray-400 text-center mt-3'>{renewLabel}</p>
          </div>

          {/* Pro */}
          <div className='border rounded-xl p-8 bg-white'>
            <h3 className='text-lg font-semibold mb-2'>Pro</h3>
            <div className='mb-6'>
              <span className='text-4xl font-bold'>{proPrice}</span>
              <span className='text-gray-500 ml-1'>{proSuffix}</span>
            </div>
            <ul className='space-y-3 text-sm text-gray-600 mb-8'>
              <li className='flex items-center gap-2'><CheckIcon />10,000 emails/month</li>
              <li className='flex items-center gap-2'><CheckIcon />10 Gmail accounts</li>
              <li className='flex items-center gap-2'><CheckIcon />Unlimited API keys</li>
              <li className='flex items-center gap-2'><CheckIcon />365-day audit log retention</li>
            </ul>
            <Link
              href='/signup'
              className='block text-center border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition'
            >
              Start Free Trial
            </Link>
            <p className='text-xs text-gray-400 text-center mt-3'>{renewLabel}</p>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className='text-center mt-12'>
          <p className='text-gray-600'>
            <span className='font-semibold'>Enterprise</span> — Unlimited everything. Custom SLAs, dedicated support, and on-prem deployment.{' '}
            <a href='mailto:hello@mailgate.ai' className='text-brand-600 font-medium hover:text-brand-700 transition'>
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
