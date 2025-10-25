"use client";
import React from "react";
import Link from "next/link";

const policySections = [
  {
    title: "Information We Collect",
    description:
      "We collect only the information we need to deliver a transparent, skill-based experience.",
    bullets: [
      "Profile details you share when creating an account (name, contact number, city).",
      "Contest activity – tickets purchased, markers placed, qualification results.",
      "Payment confirmations from trusted gateways (we never store full card details).",
  "Technical data that keeps the platform fast and secure, such as device type, browser, and IP.",
    ],
  },
  {
    title: "How We Use Your Data",
    description:
      "Wishmasters uses your information to keep contests fair, compliant, and rewarding.",
    bullets: [
      "Authenticate you securely so only you can access your dashboard and tickets.",
      "Deliver contest updates, qualification results, and winner announcements you opt into.",
      "Detect fraud, enforce age-gating, and maintain independent audit trails for every game.",
  "Improve the product experience through aggregated analytics and feedback loops.",
    ],
  },
  {
    title: "When We Share Information",
    description:
      "We disclose data only when it is indispensable to operate our platform responsibly.",
    bullets: [
      "Independent auditors who verify contest results and judging footage.",
      "Payment and communication partners that help us fulfil purchases and send secure updates.",
  "Law enforcement or regulators when legally required to protect you and the community.",
    ],
  },
];

const securityHighlights = [
  {
    title: "Encrypted End to End",
    copy:
      "All sensitive exchanges ride on HTTPS and modern encryption so that your credentials stay confidential.",
  },
  {
    title: "Regional Hosting",
    copy:
      "Infrastructure is hosted within India with automated backups to honour local data regulations.",
  },
  {
    title: "Human + Automated Reviews",
    copy:
      "Anomaly detection flags suspicious gameplay while our compliance team performs manual checks.",
  },
];

const userRights = [
  "Request a copy of the personal data we maintain about you.",
  "Update or correct inaccurate profile information from your dashboard or via support.",
  "Withdraw marketing consent at any moment using the unsubscribe link in emails.",
  "Ask us to delete your account and related data, subject to legal retention duties.",
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-gradient-to-br from-[#055F3C] to-[#0a7a50] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-sm uppercase tracking-widest text-white/70 mb-3">Privacy Policy</p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Your trust powers every Wishmasters contest
          </h1>
          <p className="max-w-3xl text-white/80 text-base md:text-lg">
            We are committed to keeping your information private, compliant, and used only to craft
            transparent, independently audited skill games. This policy explains what we collect, how we
            protect it, and the controls you always retain.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
              Last updated: January 2025
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
              Jurisdiction: India (Information Technology Act, 2000)
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        <section className="grid gap-8 md:grid-cols-3">
          {policySections.map((section) => (
            <article key={section.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-xl font-semibold text-[#055F3C] mb-3">{section.title}</h2>
              <p className="text-sm text-gray-600 mb-4">{section.description}</p>
              <ul className="space-y-3 text-sm text-gray-700">
                {section.bullets.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#055F3C]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <div>
              <h2 className="text-2xl font-semibold text-[#055F3C] mb-4">How we protect your data</h2>
              <p className="text-sm text-gray-700">
                Security is baked into every product decision. We combine layered infrastructure controls with
                independent audits so every ticket purchase and contest entry stays uncompromised.
              </p>
            </div>
            <div className="grid gap-4">
              {securityHighlights.map((highlight) => (
                <div key={highlight.title} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{highlight.title}</h3>
                  <p className="text-sm text-gray-600">{highlight.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-[#055F3C] mb-4">Your controls & rights</h2>
          <p className="text-sm text-gray-700 mb-6">
            You are always in charge. Reach out to privacy@wishmasters.in or submit a support ticket from your
            dashboard and we will action requests within 15 working days.
          </p>
          <ul className="space-y-3 text-sm text-gray-700">
            {userRights.map((right) => (
              <li key={right} className="flex gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#055F3C]" aria-hidden />
                <span>{right}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8">
          <h2 className="text-lg font-semibold text-amber-900 mb-2">Cookies & optional analytics</h2>
          <p className="text-sm text-amber-900/80">
            Essential cookies keep you logged in and secure. Optional analytics cookies – which you may toggle from the
            footer banner – help us understand performance across devices. Refusing analytics will never block you from
            entering contests.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-2xl font-semibold text-[#055F3C] mb-4">Staying accountable</h2>
          <p className="text-sm text-gray-700 mb-4">
            Wishmasters is operated by Wishmasters Gaming Private Limited. We appoint an internal Data Protection
            Officer and engage external counsel to make sure this policy reflects evolving regulations and our own
            promise of transparency.
          </p>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Grievance officer:</strong> Ms. Riya Bhatia (dpo@wishmasters.in)</p>
            <p><strong>Registered office:</strong> 702, Bandra Kurla Complex, Mumbai 400051</p>
            <p><strong>Office hours:</strong> Monday – Friday, 10:00 AM to 6:00 PM IST</p>
          </div>
        </section>
      </main>

      <section className="bg-[#033826] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid gap-8 md:grid-cols-[2fr,1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-bold mb-3">Ready to Play?</h2>
              <p className="text-white/80 text-sm md:text-base">
                Your privacy is safeguarded so you can focus on skill, strategy, and the thrill of curated prizes. Jump
                back in and pick the contest that excites you the most.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
              <p className="text-sm text-white/80 mb-4">
                Browse upcoming contests, review odds, and lock in your markers before entries close.
              </p>
              <Link
                href="/competitions"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#055F3C] transition hover:bg-emerald-50"
              >
                Start Playing Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
