'use client';
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function JudgingProcessPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentJudgeSlide, setCurrentJudgeSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const judges = [
    {
      name: 'Sanjay Patil',
      experience: 'EXPERIENCE: MCA active years - 15+ in Information Technology',
      awards: 'AWARDS AND RECOGNITIONS:',
      achievements: [
        'Received "Times shield momento for My caring for six times',
        'T-20 Match bat in Africa...'
      ]
    },
    {
      name: 'Aagar Hassan',
      experience: 'EXPERIENCE: MCA active years - 5+ in Information Technology',
      awards: 'AWARDS AND RECOGNITIONS:',
      achievements: [
        'Have represented school and college in cricket in national level',
        'Also played MCA dhairams...'
      ]
    },
    {
      name: 'Venkatesh Krishnan',
      experience: 'EXPERIENCE: MCA active years - 3+ in Information Technology',
      awards: 'AWARDS AND RECOGNITIONS:',
      achievements: [
        'U-19,Natl Trophy for Umpiring'
      ]
    },
    {
      name: 'Satish Kurup',
      experience: 'EXPERIENCE: MCA active years - 20+ in Information Technology',
      awards: 'AWARDS AND RECOGNITIONS:',
      achievements: [
        'Major senior tournaments of MCA'
      ]
    }
  ];

  const handlePrevJudge = () => {
    if (isMobile) {
      setCurrentJudgeSlide((prev) => (prev === 0 ? judges.length - 1 : prev - 1));
    } else {
      setCurrentJudgeSlide(0);
    }
  };

  const handleNextJudge = () => {
    if (isMobile) {
      setCurrentJudgeSlide((prev) => (prev === judges.length - 1 ? 0 : prev + 1));
    } else {
      setCurrentJudgeSlide(0);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold text-[#055F3C]">
              WISHMASTERS
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-gray-700"
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

          {/* Mobile Menu */}
          {menuOpen && (
            <nav className="lg:hidden mt-4 pb-4 flex flex-col gap-4">
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[500px] bg-gray-900">
        <div className="absolute inset-0">
          <img 
            src="/images/gold-is-money-gold-bars-gold-shop-gold.jpg" 
            alt="Judging Process"
            className="w-full h-full object-cover opacity-70"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="500" viewBox="0 0 1920 500"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1a1a1a"/><stop offset="100%" style="stop-color:#2d3748"/></linearGradient></defs><rect fill="url(#bg)" width="1920" height="500"/><circle cx="960" cy="250" r="80" fill="#374151" opacity="0.5"/><rect x="700" y="200" width="520" height="100" rx="10" fill="#4b5563" opacity="0.3"/></svg>');
            }}
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Judging Process at<br />Wishmasters
            </h1>
            
            <div className="space-y-2 text-white/90">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>SEASONED EXPERTS</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>AUDITED BY PROFESSIONALS</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>BUILT FOR TRANSPARENCY</span>
              </div>
            </div>

            <p className="mt-6 text-white/80 max-w-xl">
              At Wishmasters, trust is everything. That's why we've crafted a multi-stage, independently verified judging system that brings you closer to your dream with complete fairness, integrity, and transparency.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Grid Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* STEP 1 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-[#055F3C] text-white text-xs font-bold px-3 py-1 rounded inline-block mb-4">
                STEP 1
              </div>
              <h3 className="text-xl font-bold text-[#055F3C] mb-4">
                SECURE ENTRY<br />Admin & Judge Access
              </h3>
              <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                <li>Admins and judges log in through secure portals using two-factor credentials.</li>
                <li>Judges are selected randomly by the system after each round to ensure fair access</li>
                <li>Contest data remains in their null-access zone until results are verified.</li>
              </ol>
            </div>

            {/* STEP 2 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-[#055F3C] text-white text-xs font-bold px-3 py-1 rounded inline-block mb-4">
                STEP 2
              </div>
              <h3 className="text-xl font-bold text-[#055F3C] mb-4">
                MAIN CONTEST<br />Admin Dashboard Control
              </h3>
              <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                <li>Admins view active contests requiring review.</li>
                <li>Judges are assigned to each contest and uniquely identified by rider-coded markers.</li>
              </ol>
            </div>

            {/* STEP 3 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-[#055F3C] text-white text-xs font-bold px-3 py-1 rounded inline-block mb-4">
                STEP 3
              </div>
              <h3 className="text-xl font-bold text-[#055F3C] mb-4">
                ADMIN CONFIRMATION<br />Independent Assessment
              </h3>
              <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                <li>Judges access their assigned contests and their dashboards.</li>
                <li>They view the contest image and independently assess which participant's markers should be closest to the bullseye/actual location for showing exact coordinates, preserving individual bias-free input.</li>
              </ol>
            </div>

            {/* STEP 4 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-[#055F3C] text-white text-xs font-bold px-3 py-1 rounded inline-block mb-4">
                STEP 4
              </div>
              <h3 className="text-xl font-bold text-[#055F3C] mb-4">
                CONSENSUS BUILDING<br />Collaborative Decision Making
              </h3>
              <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                <li>Judges discuss all markers collectively and agree upon a final winning marker.</li>
                <li>Once finalized, the winner is locked in.</li>
                <li>The admin then reviews and confirms this selection.</li>
              </ol>
            </div>

            {/* STEP 5 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-[#055F3C] text-white text-xs font-bold px-3 py-1 rounded inline-block mb-4">
                STEP 5
              </div>
              <h3 className="text-xl font-bold text-[#055F3C] mb-4">
                THIRD-PARTY VERIFICATION<br />Third Party Oversight
              </h3>
              <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                <li>A final verification prompt is shared with the judging panel.</li>
                <li>External auditors (if enabled) review the judging trail marker and digitally sign-off on the decision for compliance.</li>
              </ol>
            </div>

            {/* STEP 6 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="bg-[#055F3C] text-white text-xs font-bold px-3 py-1 rounded inline-block mb-4">
                STEP 6
              </div>
              <h3 className="text-xl font-bold text-[#055F3C] mb-4">
                WINNER ANNOUNCEMENT<br />Closest Wins - No Bias
              </h3>
              <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                <li>Our system automatically calculates the entry closest to the final marker.</li>
                <li>This ensures the outcome is purely arithmetic and confirms the outcome.</li>
                <li>Winners are then officially announced on our platform and notified individually.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Judges Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#055F3C] mb-3">Meet the Judges</h2>
          <p className="text-gray-600 mb-12 max-w-3xl">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc molestie feugiat neque et tristique. Aenean vitae elementum magna, eget auctor nibh. Phasellus non metus tristique, interdum nibh eget, tincidunt elit.
          </p>

          <div className="relative">
            {/* Desktop View - Show all 4 judges */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-6">
              {judges.map((judge, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md">
                  <div className="aspect-[3/4] bg-gray-200 relative">
                    <img 
                      src={`/images/judges/judge-${index + 1}.jpg`}
                      alt={judge.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect fill="#e5e7eb" width="300" height="400"/><circle cx="150" cy="120" r="50" fill="#9ca3af"/><path d="M75 250 Q75 200 150 200 Q225 200 225 250 L225 400 L75 400 Z" fill="#9ca3af"/><text x="150" y="380" text-anchor="middle" fill="#6b7280" font-size="16" font-weight="bold">${judge.name}</text></svg>`);
                      }}
                    />
                  </div>
                  <div className="p-4 border-t-4 border-gray-300">
                    <h3 className="font-bold text-lg mb-2">{judge.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{judge.experience}</p>
                    <p className="text-xs font-semibold text-gray-800 mb-1">{judge.awards}</p>
                    <ul className="text-xs text-gray-600 space-y-1 mb-3">
                      {judge.achievements.map((achievement, i) => (
                        <li key={i}>• {achievement}</li>
                      ))}
                    </ul>
                    <button className="text-[#055F3C] text-sm font-semibold hover:underline">
                      Read More
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View - Show 1 judge at a time */}
            <div className="lg:hidden">
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="aspect-[3/4] bg-gray-200 relative">
                  <img 
                    src={`/images/judges/judge-${currentJudgeSlide + 1}.jpg`}
                    alt={judges[currentJudgeSlide].name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect fill="#e5e7eb" width="300" height="400"/><circle cx="150" cy="120" r="50" fill="#9ca3af"/><path d="M75 250 Q75 200 150 200 Q225 200 225 250 L225 400 L75 400 Z" fill="#9ca3af"/><text x="150" y="380" text-anchor="middle" fill="#6b7280" font-size="16" font-weight="bold">${judges[currentJudgeSlide].name}</text></svg>`);
                    }}
                  />
                </div>
                <div className="p-4 border-t-4 border-gray-300">
                  <h3 className="font-bold text-lg mb-2">{judges[currentJudgeSlide].name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{judges[currentJudgeSlide].experience}</p>
                  <p className="text-xs font-semibold text-gray-800 mb-1">{judges[currentJudgeSlide].awards}</p>
                  <ul className="text-xs text-gray-600 space-y-1 mb-3">
                    {judges[currentJudgeSlide].achievements.map((achievement, i) => (
                      <li key={i}>• {achievement}</li>
                    ))}
                  </ul>
                  <button className="text-[#055F3C] text-sm font-semibold hover:underline">
                    Read More
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrevJudge}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-[#055F3C] text-white p-3 rounded-full hover:bg-[#044a2f] transition-colors z-10 lg:hidden"
              aria-label="Previous judge"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextJudge}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-[#055F3C] text-white p-3 rounded-full hover:bg-[#044a2f] transition-colors z-10 lg:hidden"
              aria-label="Next judge"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Progress Indicator - Mobile only */}
            <div className="flex justify-center gap-2 mt-6 lg:hidden">
              {judges.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentJudgeSlide
                      ? 'w-12 bg-[#055F3C]'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Every Action Logged and Ready to Play Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2">
            {/* Left Side - Every Action Logged (Green Background) */}
            <div className="bg-[#055F3C] text-white p-12 lg:p-16">
              <p className="text-xs uppercase mb-2 text-white/80 tracking-wider">FULL TRANSPARENCY & AUDIT TRAIL</p>
              <h2 className="text-3xl font-bold mb-6">Every Action Logged</h2>
              <ol className="space-y-3 text-white/90">
                <li><span className="font-semibold">1.</span> All admin, judge, and auditor actions are securely logged.</li>
                <li><span className="font-semibold">2.</span> The system undergoes regular security checks to protect user data and contest integrity.</li>
                <li><span className="font-semibold">3.</span> Results are made transparent to the public through Live Judging Broadcasts, building trust and credibility.</li>
              </ol>
            </div>

            {/* Right Side - Ready to Play (Light Background) */}
            <div className="bg-gray-100 p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-[#055F3C] mb-4">
                Ready to Play?
              </h2>
              <p className="text-gray-700 mb-6">
                Put your skill to the test.<br />
                Dream big. Play fair. Win bigger.
              </p>
              <button 
                onClick={() => router.push('/competitions')}
                className="bg-[#055F3C] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#044a2f] transition-colors w-fit"
              >
                Start Playing Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white">
        {/* Footer Links */}
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

        {/* Copyright */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-gray-400">
            © 2024 Wishmasters, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
