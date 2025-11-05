'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSessionTracker } from '@/components/UserSessionTracker';

type PhaseStatus = 'NOT_STARTED' | 'ACTIVE' | 'CLOSED';

type PhaseSnapshot = {
  label: string;
  seats: number;
  status: PhaseStatus;
};

export default function CompetitionPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [phaseSnapshot, setPhaseSnapshot] = useState<PhaseSnapshot | null>(null);

  const hydratePhaseSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const readPhase = (phaseId: number): PhaseSnapshot => {
      const statusKey = `admin_phase${phaseId}_status`;
      const seatsKey = `admin_phase${phaseId}_max_members`;
      const defaultSeats = phaseId === 1 ? 55 : phaseId === 2 ? 88 : 111;

      const storedStatus = (localStorage.getItem(statusKey) as PhaseStatus | null) || 'NOT_STARTED';
      const storedSeatsRaw = localStorage.getItem(seatsKey);
      const parsedSeats = Number.parseInt(storedSeatsRaw ?? '', 10);
      const safeSeats = Number.isFinite(parsedSeats) && parsedSeats > 0 ? parsedSeats : defaultSeats;

      return {
        label: `Phase ${phaseId}`,
        seats: safeSeats,
        status: storedStatus,
      };
    };

    const phases: PhaseSnapshot[] = [readPhase(1), readPhase(2), readPhase(3)];
    const openPhase = phases.find((phase) => phase.status === 'ACTIVE');

    if (openPhase) {
      setPhaseSnapshot(openPhase);
      return;
    }

    const upcomingPhase = phases.find((phase) => phase.status !== 'CLOSED');
    setPhaseSnapshot(upcomingPhase ?? null);
  }, []);

  useEffect(() => {
    hydratePhaseSnapshot();

    const onVisibility = () => hydratePhaseSnapshot();
    const onFocus = () => hydratePhaseSnapshot();
    const onStorage = () => hydratePhaseSnapshot();

    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [hydratePhaseSnapshot]);

  const phaseStatusLabel = (status: PhaseStatus | null) => {
    switch (status) {
      case 'ACTIVE':
        return 'Now Open';
      case 'NOT_STARTED':
        return 'Starting Soon';
      case 'CLOSED':
        return 'Closed';
      default:
        return 'Status Pending';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <UserSessionTracker />
      {/* Header */}
      <header className="bg-[#055F3C] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h1 className="text-xl font-bold tracking-wider">GOLDMASTERS</h1>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-24">
        <section className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
          <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white shadow-xl ring-1 ring-white/10 h-72 sm:h-96 md:h-full">
            <img
              src="/images/gold-coin.jpg"
              alt="Gold Coin"
              className="h-full w-full object-cover opacity-90 transform transition-transform duration-700 ease-out hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><radialGradient id="goldGrad" cx="50%" cy="50%"><stop offset="0%" style="stop-color:#ffd700"/><stop offset="50%" style="stop-color:#ffed4e"/><stop offset="100%" style="stop-color:#d4af37"/></radialGradient></defs><rect fill="#111827" width="800" height="800"/><circle cx="400" cy="400" r="220" fill="url(#goldGrad)"/><circle cx="400" cy="400" r="220" fill="none" stroke="#b8860b" stroke-width="18"/><text x="400" y="420" font-size="120" font-weight="bold" fill="#b8860b" text-anchor="middle">₹</text></svg>');
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" aria-hidden="true" />
            <div className="absolute top-4 left-4 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-gray-900 shadow-lg">
              Win
            </div>
          </div>

          <div className="space-y-10 text-gray-900 max-w-xl mx-auto md:mx-0 md:pl-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#055F3C]">Featured Contest</p>
              <h2 className="text-4xl font-bold leading-tight md:text-5xl">Gold Coin</h2>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">With a click</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Markers Per Ticket</p>
                <p className="mt-3 text-3xl font-extrabold text-gray-900">3</p>
                <p className="mt-2 text-sm text-gray-500">Use three markers per ticket to place your prediction.</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Contest Status</p>
                <p className="mt-3 text-3xl font-extrabold text-[#055F3C]">Open Now</p>
                <p className="mt-2 text-sm text-gray-500">Entries accepted until the contest closes.</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 md:items-start">
              <div className="w-full max-w-sm rounded-3xl border border-[#055F3C]/30 bg-gradient-to-br from-[#055F3C] via-[#07744a] to-[#022d1d] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Phase Update</p>
                  {phaseSnapshot?.status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-2xl font-semibold">
                    {phaseSnapshot ? phaseSnapshot.label : 'Phases Coming Soon'}
                  </h3>
                  <p className="text-sm text-white/80">
                    {phaseSnapshot
                      ? `${phaseStatusLabel(phaseSnapshot.status)} • ${phaseSnapshot.seats} seats`
                      : 'Stay tuned for phase announcements and seat availability.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center justify-center rounded-full bg-[#055F3C] px-12 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[#055F3C]/30 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#044a2f]"
              >
                Enter Now
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-12" aria-labelledby="how-to-play">
          <header className="text-center">
            <h2 id="how-to-play" className="text-3xl font-bold text-gray-900 md:text-4xl">
              How To <span className="text-[#055F3C]">Play</span>
            </h2>
            <p className="mt-4 text-base text-gray-600">
              Three simple steps to lock in your spot-the-ball prediction and complete the checkout.
            </p>
          </header>

          <div className="overflow-hidden rounded-3xl border border-gray-200" style={{ aspectRatio: '16/9' }}>
            <video
              className="h-full w-full object-cover"
              controls
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%23f3f4f6' width='800' height='450'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%239ca3af'%3EVideo will be added here%3C/text%3E%3C/svg%3E"
            >
              <source src="/videos/how-to-play.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                title: 'Select Your Contest',
                step: '01',
                icon: (
                  <svg className="h-7 w-7 text-[#055F3C]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ),
              },
              {
                title: 'Predict Where The Ball Is',
                step: '02',
                icon: (
                  <svg className="h-7 w-7 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                ),
              },
              {
                title: 'Winner Announced',
                step: '03',
                icon: (
                  <svg className="h-7 w-7 text-[#055F3C]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                ),
              },
            ].map(({ title, step, icon }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#055F3C]/20 bg-white">
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{step} Step</p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="behind-the-wish" className="space-y-16">
          <header className="text-center">
            <h2 className="text-3xl font-bold text-[#055F3C] md:text-4xl">Behind The Wish</h2>
            <p className="mt-4 text-base text-gray-600">
              Everything we do is built to keep the contest transparent, skill-first, and rewarding for every entrant.
            </p>
          </header>

          <div className="grid gap-12 md:grid-cols-2 md:items-start">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-[#055F3C]">Limited Odds</h3>
              <p className="text-base text-gray-700">
                Enter a filtered playground where the odds of success are amplified by limiting the number of entrants in every final contest.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">1 in</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">13 million*</p>
                  <p className="mt-1 text-xs text-gray-600">chances of winning a lottery</p>
                </div>
                <div className="rounded-2xl border border-[#055F3C] bg-[#055F3C] p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/80">1 in</p>
                  <p className="mt-2 text-2xl font-semibold">2000*</p>
                  <p className="mt-1 text-xs text-white/80">chances with Goldmasters</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/images/hand-pointing.png"
                alt="Hand pointing"
                className="h-auto w-72 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect fill="#f3f4f6" width="320" height="320"/><path d="M 160 70 L 192 118 L 242 108 L 214 160 L 262 198 L 206 210 L 192 262 L 160 224 L 128 262 L 114 210 L 58 198 L 106 160 L 78 108 L 128 118 Z" fill="#d1d5db"/><text x="160" y="180" text-anchor="middle" fill="#9ca3af" font-size="16" font-weight="bold">Hand Image</text></svg>');
                }}
              />
            </div>
          </div>

          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1 flex items-center justify-center">
              <img
                src="/images/gift-box.png"
                alt="Gift box with green ribbon"
                className="h-auto w-56 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="260" viewBox="0 0 240 260"><rect fill="#f3f4f6" width="240" height="260"/><rect x="70" y="110" width="100" height="100" fill="#d1d5db" rx="6"/><rect x="70" y="86" width="100" height="32" fill="#10b981" rx="6"/><rect x="116" y="64" width="10" height="88" fill="#10b981"/><path d="M 92 86 Q 120 50 148 86" fill="none" stroke="#10b981" stroke-width="6"/><circle cx="92" cy="86" r="8" fill="#10b981"/><circle cx="148" cy="86" r="8" fill="#10b981"/></svg>');
                }}
              />
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <h3 className="text-2xl font-semibold text-[#055F3C]">No Gift Tax Surprises</h3>
              <p className="text-base text-gray-700">
                Bring home your dream prize and the gift tax amount. Goldmasters covers the extras so you do not spend beyond your winning bid.
              </p>
            </div>
          </div>

          <div className="grid gap-12 md:grid-cols-2 md:items-start">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-[#055F3C]">Clear Judging Process</h3>
              <p className="text-base text-gray-700">
                Every live judging session is overseen by an independent law firm and audit partner, ensuring unbiased results that are recorded and published publicly.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/images/tablet-judging.png"
                alt="Tablet showing judging process"
                className="h-auto w-72 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect fill="#f3f4f6" width="320" height="320"/><rect x="96" y="70" width="128" height="180" fill="#d1d5db" rx="10" stroke="#6b7280" stroke-width="4"/><rect x="108" y="86" width="104" height="132" fill="#ffffff" rx="6"/><circle cx="160" cy="234" r="10" fill="#9ca3af"/><text x="160" y="154" text-anchor="middle" fill="#6b7280" font-size="16" font-weight="bold">Judging</text></svg>');
                }}
              />
            </div>
          </div>
        </section>

        <section className="space-y-8" aria-labelledby="faq">
          <h2 id="faq" className="text-3xl font-semibold text-[#1E1E1E] sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-gray-200">
            {[
              {
                question: 'Is this a legitimate opportunity?',
                answer:
                  "Yes. Goldmasters operates within Country's skill-gaming guidelines and each contest is audited by independent legal partners to keep everything transparent.",
              },
              {
                question: 'How do I enter a goldmasters contest? Masumi Parmar',
                answer:
                  'Create an account, select an active contest, and place your markers on the spot-the-ball image before checkout closes to confirm your entry.',
              },
              {
                question: 'Are my payments secure?',
                answer:
                  'Absolutely. All payments flow through PCI-DSS compliant gateways and every transaction is encrypted end-to-end for your safety.',
              },
            ].map(({ question, answer }) => (
              <details key={question} className="group py-6">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-medium text-[#1E1E1E]">
                  <span>{question}</span>
                  <span className="text-2xl leading-none text-gray-400 transition-transform group-open:rotate-180">&gt;</span>
                </summary>
                <p className="mt-4 text-base leading-relaxed text-gray-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
