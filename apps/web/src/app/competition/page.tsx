'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function CompetitionPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#055F3C] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h1 className="text-xl font-bold tracking-wider">WISHMASTERS</h1>
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

      {/* Tickets Left Badge */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="max-w-7xl mx-auto">
          <span className="inline-block bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded">
            TICKETS LEFT: 1750/2
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Competition Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-xs mx-auto">
          {/* Image Section */}
          <div className="relative h-80">
            <img
              src="/images/gold-coin.jpg"
              alt="Gold Coin"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><defs><radialGradient id="goldGrad" cx="50%" cy="50%"><stop offset="0%" style="stop-color:#ffd700"/><stop offset="50%" style="stop-color:#ffed4e"/><stop offset="100%" style="stop-color:#d4af37"/></radialGradient></defs><rect fill="#1a1a1a" width="400" height="600"/><circle cx="200" cy="300" r="120" fill="url(#goldGrad)"/><circle cx="200" cy="300" r="120" fill="none" stroke="#b8860b" stroke-width="8"/><text x="200" y="310" font-size="48" font-weight="bold" fill="#b8860b" text-anchor="middle">₹</text></svg>');
              }}
            />
            {/* WIN Badge */}
            <div className="absolute top-4 left-4 bg-white text-black text-xs font-bold px-3 py-1 rounded">
              WIN
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              GOLD COIN
            </h2>
            <p className="text-sm text-gray-600 mb-6">WITH A CLICK</p>

            {/* Hosted By Section */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">HOSTED BY</p>
              <div className="h-12 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-400 text-xs">Host Logo</span>
              </div>
            </div>

            {/* Enter Now Button */}
            <button
              onClick={() => router.push('/')}
              className="w-full bg-[#055F3C] text-white font-bold py-3 px-6 rounded hover:bg-[#044a2f] transition-colors"
            >
              ENTER NOW
            </button>
          </div>
        </div>

        {/* How To Play Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-8">
              How To <span className="text-[#055F3C]">Play</span>
            </h2>

            {/* Video Placeholder */}
            <div className="mb-8 bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <div className="w-full h-full flex items-center justify-center border-4 border-black rounded-lg">
                <video 
                  className="w-full h-full object-cover"
                  controls
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%23f3f4f6' width='800' height='450'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='%239ca3af'%3EVideo will be added here%3C/text%3E%3C/svg%3E"
                >
                  <source src="/videos/how-to-play.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#055F3C]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">01 STEP</p>
                  <h3 className="text-lg font-bold text-gray-900">Select Your Contest</h3>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">02 STEP</p>
                  <h3 className="text-lg font-bold text-gray-900">Predict Where The Ball Is</h3>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#055F3C]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">03 STEP</p>
                  <h3 className="text-lg font-bold text-gray-900">Winner Announced</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Behind The Wish Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-8">
            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-[#055F3C] text-center mb-12">
              Behind The Wish
            </h2>

            {/* Limited Odds Section */}
            <div className="mb-12">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Left - Text Content */}
                <div>
                  <h3 className="text-2xl font-bold text-[#055F3C] mb-4">Limited Odds</h3>
                  <p className="text-gray-700 text-sm leading-relaxed mb-6">
                    Enter a filtered playground where the odds of success are great due to the limited number of entrants to the final contest.
                  </p>
                  
                  {/* Odds Comparison Boxes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">1 in</p>
                      <p className="text-2xl font-bold text-gray-800 mb-1">13 million*</p>
                      <p className="text-xs text-gray-600">chances of winning a lottery</p>
                    </div>
                    <div className="bg-[#055F3C] p-4 rounded-lg">
                      <p className="text-xs text-white/80 mb-1">1 in</p>
                      <p className="text-2xl font-bold text-white mb-1">2000*</p>
                      <p className="text-xs text-white/80">chances of winning with Wishmasters</p>
                    </div>
                  </div>
                </div>

                {/* Right - Hand Image */}
                <div className="flex justify-center items-center">
                  <img
                    src="/images/hand-pointing.png"
                    alt="Hand pointing"
                    className="w-64 h-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect fill="#f3f4f6" width="300" height="300"/><path d="M 150 80 L 180 120 L 220 110 L 200 150 L 240 180 L 190 190 L 180 230 L 150 200 L 120 230 L 110 190 L 60 180 L 100 150 L 80 110 L 120 120 Z" fill="#d1d5db"/><text x="150" y="160" text-anchor="middle" fill="#9ca3af" font-size="16" font-weight="bold">Hand Image</text></svg>');
                    }}
                  />
                </div>
              </div>
            </div>

            {/* NO GIFT Tax Section */}
            <div className="mb-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left - Gift Image */}
                <div className="flex justify-center items-center order-2 md:order-1">
                  <img
                    src="/images/gift-box.png"
                    alt="Gift box with green ribbon"
                    className="w-48 h-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="250" viewBox="0 0 200 250"><rect fill="#f3f4f6" width="200" height="250"/><rect x="50" y="100" width="100" height="100" fill="#d1d5db" rx="4"/><rect x="50" y="80" width="100" height="30" fill="#10b981" rx="4"/><rect x="95" y="60" width="10" height="60" fill="#10b981"/><path d="M 70 80 Q 100 50 130 80" fill="none" stroke="#10b981" stroke-width="6"/><circle cx="70" cy="80" r="8" fill="#10b981"/><circle cx="130" cy="80" r="8" fill="#10b981"/></svg>');
                    }}
                  />
                </div>

                {/* Right - Text Content */}
                <div className="order-1 md:order-2">
                  <div className="bg-white p-6 rounded-lg">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Bring home your dream prize and gift tax amount, Wishmasters ensures you don't spend an extra dime on your prize.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Judging Process Section */}
            <div>
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Left - Text Content */}
                <div>
                  <h3 className="text-2xl font-bold text-[#055F3C] mb-4">Clear Judging Process</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    A law firm and independent audit of the competition oversee the live judging which is recorded and posted on Wishmasters.
                  </p>
                </div>

                {/* Right - Tablet/Judging Image */}
                <div className="flex justify-center items-center">
                  <img
                    src="/images/tablet-judging.png"
                    alt="Tablet showing judging process"
                    className="w-64 h-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect fill="#f3f4f6" width="300" height="300"/><rect x="80" y="80" width="140" height="180" fill="#d1d5db" rx="8" stroke="#6b7280" stroke-width="3"/><rect x="90" y="90" width="120" height="140" fill="#ffffff" rx="4"/><circle cx="150" cy="250" r="8" fill="#9ca3af"/><text x="150" y="165" text-anchor="middle" fill="#6b7280" font-size="14" font-weight="bold">Judging</text></svg>');
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
