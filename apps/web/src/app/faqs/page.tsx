'use client';

import React from 'react';
import Link from 'next/link';

const faqs: { q: string; a: string }[] = [
  { q: 'What is the Competition?', a: 'The Competition is a private, invite-only skill-based challenge where participants test their judgment and precision by predicting the correct position of a missing ball in a professional sports image (Spot-the-Ball format). Each event is limited to a fixed number of entries.' },
  { q: 'How does it work?', a: '1. A professional sports photograph is displayed where the ball has been digitally removed.\n2. Participants use their skill and judgment to mark where they believe the ball is.\n3. Each ticket grants three marker chances.\n4. Once all entries are filled, the event closes.\n5. A panel of certified cricket umpires independently marks their positions.\n6. The system calculates the average of their marks to determine the winning coordinate.\n7. The participant closest to this coordinate wins.' },
  { q: 'How is the winner decided?', a: 'Four certified cricket umpires each mark the ball\'s original position. The system computes the average (X,Y) of their coordinates. The participant whose marker is closest to this average position is the winner. The next two closest participants are awarded second and third prizes.' },
  { q: 'Is the judging process transparent?', a: 'Yes. All judging sessions are recorded on video and made available to participants after the event. The judging process is conducted by professional umpires to maintain integrity and transparency. The final Winning Image with the official coordinate is displayed publicly to all entrants. The events judging live link will also be shared with all participants.' },
  { q: 'How can I enter the competition?', a: '1. You will receive a private invitation link.\n2. View event details (prizes, remaining slots, closing time).\n3. Select the number of tickets you wish to purchase for which you will receive the entry link\n4. Each ticket allows you to place 3 markers.\n5. Complete your entry using the private password provided by the organizer.\n6. You will get a password for checkout for your entry.' },
  { q: 'What are the prizes?', a: 'Each competition will be linked to a gold prize of which details can be found in the competition itself.' },
  { q: 'Is this a game of chance or gambling?', a: 'No. The Competition is entirely skill-based — there are no draws, randomizers, or elements of chance. Each participant\'s success depends solely on their judgment and visual precision.' },
  { q: 'Is my payment and data secure?', a: 'Yes. All entries and payments are encrypted. Data is securely stored and timestamped on a private backend. Each entry receives a unique ID for verification.' },
  { q: 'Can I purchase multiple tickets?', a: 'Yes. Each participant may purchase multiple tickets (subject to availability). Each ticket gives 3 marker attempts. Multiple tickets increase your chances by allowing more strategic guesses.' },
  { q: 'When does the competition close?', a: 'Once all tickets (55, 88, or 111) are sold, entries automatically close. The judging then occurs within 24 hours, followed by result announcement.' },
];

export default function FaqsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#055F3C]">THE COMPETITION — OFFICIAL FAQ</h1>
          <p className="mt-3 text-gray-600">All the commonly asked questions about Goldmasters and how contests work.</p>
        </header>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="divide-y divide-gray-200">
            {faqs.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left text-sm font-medium text-[#055F3C]">
                  <span>{item.q}</span>
                  <span className="ml-4 text-gray-400 transition-transform group-open:rotate-180">›</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
