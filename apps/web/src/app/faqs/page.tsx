'use client';

import React from 'react';
import Link from 'next/link';

const faqs: { q: string; a: string }[] = [
  { q: 'What Is Wishmasters?', a: 'Wishmasters is a skill-based contest platform where players predict the position of the ball and win curated prizes. Each contest is governed by transparent rules and independent audits.' },
  { q: 'How Do I Get Started?', a: 'Sign up for an account, verify your phone number, choose a contest, place your markers and complete checkout to enter.' },
  { q: 'What Is The Qualification Round?', a: 'The qualification round filters entries into the final contest based on performance and contest rules. Details vary per contest and are announced on the contest page.' },
  { q: 'What Happens In The Main Contest?', a: 'In the main contest, finalists\u2019 marker positions are compared to the judge position and winners are determined based on closest distance.' },
  { q: 'How Is The Winner Decided?', a: 'Winners are selected by comparing marker distance to the independent judge position. The process is audited and publicly recorded.' },
  { q: 'What Are The Odds Of Winning?', a: 'Odds depend on the number of entrants and contest format; Wishmasters limits entry size to keep odds favorable compared to national lotteries.' },
  { q: 'What Kind Of Prizes Can I Win?', a: 'Prizes range from electronics and bikes to luxury experiences and cars depending on the contest.' },
  { q: 'How And When Are Winners Announced?', a: 'Winners are announced on the results page and via registered contact details once the judging process is complete and audited.' },
  { q: 'How Do I Know It\u2019s Fair?', a: 'Every contest uses independent auditors and a law firm to supervise judging; all sessions are recorded and transparency reports are published.' },
  { q: 'Can I Play More Than Once?', a: 'Yes - many contests allow multiple entries, subject to contest-specific limits. Check the contest rules for exact details.' },
  { q: 'Who Is Eligible To Play?', a: 'Eligibility depends on local regulations and contest rules; users must meet age and residency requirements listed on the contest page.' },
  { q: 'What\u2019s This About Animal Welfare?', a: 'Our prize sourcing avoids practices that harm animals; any contest involving animals will include clear information about care and welfare.' },
  { q: 'What If Something Goes Wrong (Tech Issues, Payment Failure, Etc.)?', a: 'Contact support immediately; we keep logs and records to investigate and resolve issues. Refunds and remedies follow our support policy.' },
  { q: 'Is My Data Safe?', a: 'Yes. We follow industry-standard security practices and encrypt sensitive information. See our privacy policy for details.' },
  { q: 'Final Recap - How To Play In 4 Simple Steps', a: '1) Sign up. 2) Choose a contest. 3) Place markers. 4) Checkout and watch results.' },
];

export default function FaqsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#055F3C]">Frequently Asked Questions</h1>
          <p className="mt-3 text-gray-600">All the commonly asked questions about Wishmasters and how contests work.</p>
        </header>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="divide-y divide-gray-200">
            {faqs.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left text-sm font-medium text-[#055F3C]">
                  <span>{item.q}</span>
                  <span className="ml-4 text-gray-400 transition-transform group-open:rotate-180">›</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-sm text-gray-700 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          {"Can\u2019t find your question? "}
          <Link href="/contact" className="text-[#055F3C] underline">Contact support</Link>
          {" and we\u2019ll help."}
        </div>
      </div>
    </main>
  );
}
