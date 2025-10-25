'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CompetitionsPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Mobile */}
      <header className="bg-[#055F3C] lg:hidden">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="text-white text-lg font-bold tracking-wider">WISHMASTERS</div>
          </div>
          <button
            className="text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Header - Desktop */}
      <header className="hidden lg:block bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <Link href="/" className="text-2xl font-bold text-[#055F3C] tracking-wider">
                WISHMASTERS
              </Link>
            </div>

            <nav className="flex items-center gap-8">
              <Link href="/" className="text-gray-700 hover:text-[#055F3C] transition-colors font-medium">
                HOME
              </Link>
              <Link href="/competitions" className="text-[#055F3C] font-semibold border-b-2 border-[#055F3C]">
                UPCOMING CONTESTS
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-[#055F3C] transition-colors font-medium">
                ABOUT US
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-[#055F3C] transition-colors font-medium">
                CONTACT
              </Link>
              
              <div className="flex items-center gap-3 ml-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Natalie Portman</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 lg:p-6">
        {/* Competition Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          {/* Image Section */}
          <div className="relative h-[400px]">
            <img
              src="/images/bmw-ix-msport.jpg"
              alt="BMW IX M-SPORT"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="carBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1e3a8a"/><stop offset="100%" style="stop-color:#3b82f6"/></linearGradient></defs><rect fill="url(#carBg)" width="400" height="400"/><rect x="50" y="180" width="300" height="140" rx="10" fill="#1e40af"/><rect x="80" y="200" width="100" height="80" fill="#60a5fa"/><rect x="220" y="200" width="100" height="80" fill="#60a5fa"/><circle cx="120" cy="320" r="30" fill="#1f2937" stroke="#9ca3af" stroke-width="6"/><circle cx="280" cy="320" r="30" fill="#1f2937" stroke="#9ca3af" stroke-width="6"/><ellipse cx="200" cy="160" rx="80" ry="20" fill="#3b82f6" opacity="0.5"/></svg>');
              }}
            />
            
            {/* WIN Badge */}
            <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 rounded font-bold text-sm">
              WIN
            </div>

            {/* Competition Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
              <h1 className="text-white text-3xl font-bold uppercase mb-1">
                BMW IX M-SPORT
              </h1>
              <p className="text-white/90 text-sm uppercase">
                ENTER THE CONTEST AND WIN YOUR DREAM CAR
              </p>
            </div>
          </div>

          {/* Enter Now Button */}
          <div className="p-4">
            <button
              onClick={() => router.push('/competition/1/how-to-play')}
              className="w-full bg-[#055F3C] text-white py-3 rounded font-bold text-sm uppercase tracking-wide hover:bg-[#044a2f] transition-colors"
            >
              ENTER NOW
            </button>
          </div>

          {/* Practice Info */}
          <div className="px-4 pb-4">
            <div className="flex items-start gap-2 mb-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-700">
                Want to practice first, play free levels to solidify your game
              </p>
            </div>
            <button className="text-[#055F3C] font-semibold text-sm hover:underline">
              See Details
            </button>
          </div>

          {/* Play Practice Rounds Button */}
          <div className="p-4 pt-0">
            <button
              onClick={() => router.push('/practice')}
              className="w-full bg-white text-[#055F3C] py-3 rounded font-bold text-sm uppercase tracking-wide border-2 border-[#055F3C] hover:bg-gray-50 transition-colors"
            >
              PLAY PRACTICE ROUNDS
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <nav className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm">
            <Link href="/about" className="hover:text-yellow-400 transition-colors">
              About
            </Link>
            <span className="text-gray-600">|</span>
            <Link href="/faqs" className="hover:text-yellow-400 transition-colors">
              FAQs
            </Link>
            <span className="text-gray-600">|</span>
            <Link href="/contact" className="hover:text-yellow-400 transition-colors">
              Contact us
            </Link>
          </nav>
        </div>

        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-400">
            © 2024 Wishmasters, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
