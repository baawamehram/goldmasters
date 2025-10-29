'use client';
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [participantName, setParticipantName] = useState<string>("");

  const clearStoredSession = () => {
    try {
      const explicitKeys = [
        'admin_token',
        'competition_access_token',
        'participant_login_token',
        'participant_profile',
        'participant_competitions',
      ];
      explicitKeys.forEach((key) => localStorage.removeItem(key));

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('competition_') || key.startsWith('participant_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('participant_profile');
      if (!storedProfile) return;

      const parsedProfile = JSON.parse(storedProfile);
      if (parsedProfile?.name) {
        setParticipantName(parsedProfile.name as string);
      }
    } catch (readError) {
      console.warn('Failed to load participant profile', readError);
    }
  }, []);

  const displayName = participantName || 'Participant';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#055F3C] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h1 className="text-xl font-bold tracking-wider">WISHMASTERS</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => router.push('/')}
              className="hover:text-yellow-400 transition-colors font-medium border-b-2 border-yellow-400 pb-1"
            >
              HOME
            </button>
            <button 
              onClick={() => router.push('/competitions')}
              className="hover:text-yellow-400 transition-colors font-medium"
            >
              UPCOMING CONTESTS
            </button>
            <button 
              onClick={() => router.push('/about')}
              className="hover:text-yellow-400 transition-colors font-medium"
            >
              ABOUT US
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="hover:text-yellow-400 transition-colors font-medium"
            >
              CONTACT
            </button>
          </nav>

          {/* User Profile - Desktop (with dropdown) */}
          <div className="hidden md:flex items-center gap-3 relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-haspopup="true"
              aria-expanded={showProfileMenu}
              className="flex items-center gap-3 focus:outline-none"
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                <img 
                  src="/images/user-avatar.jpg" 
                  alt="User"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#d1d5db"/><circle cx="20" cy="16" r="7" fill="#9ca3af"/><path d="M 8 35 Q 8 28 20 28 Q 32 28 32 35" fill="#9ca3af"/></svg>');
                  }}
                />
              </div>
              <span className="text-sm font-medium">{displayName}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white text-black rounded-md shadow-2xl z-50 overflow-hidden border border-gray-200">
                {/* small pointer */}
                <div className="absolute -top-2 right-4 w-3 h-3 bg-white rotate-45 border-t border-l border-gray-200" aria-hidden />
                <div className="py-1">
                  <button
                    onClick={() => { setShowProfileMenu(false); router.push('/profile'); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-t"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-2xl"
          >
            ☰
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#044a2f] border-t border-white/20 shadow-inner">
            <nav className="flex flex-col border-y border-white/20 divide-y divide-white/20">
              <button 
                onClick={() => { router.push('/'); setMobileMenuOpen(false); }}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                HOME
              </button>
              <button 
                onClick={() => { router.push('/competitions'); setMobileMenuOpen(false); }}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                UPCOMING CONTESTS
              </button>
              <button 
                onClick={() => { router.push('/about'); setMobileMenuOpen(false); }}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                ABOUT US
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                CONTACT
              </button>
              <button
                onClick={() => { router.push('/privacy-policy'); setMobileMenuOpen(false); }}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                PRIVACY POLICY
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(true); setMobileMenuOpen(false); }}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                LOGOUT
              </button>
            </nav>
            {/* Mobile User Profile */}
            <div className="px-6 py-4 bg-[#033826] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                <img 
                  src="/images/user-avatar.jpg" 
                  alt="User"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#d1d5db"/><circle cx="20" cy="16" r="7" fill="#9ca3af"/><path d="M 8 35 Q 8 28 20 28 Q 32 28 32 35" fill="#9ca3af"/></svg>');
                  }}
                />
              </div>
              <span className="text-sm font-medium">{displayName}</span>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogoutConfirm(false)} />
          <div className="bg-white rounded-lg shadow-xl z-10 max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to logout? This will sign you out and clear any competition access stored locally.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearStoredSession();
                  setShowLogoutConfirm(false);
                  router.push('/login');
                }}
                className="px-4 py-2 bg-[#055F3C] text-white rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative min-h-screen">
        {/* Background Image with Checkered Pattern Overlay */}
        <div className="absolute inset-0">
          <img 
            src="/images/about us landing image 1 (1).png" 
            alt="Background"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.style.backgroundImage = `repeating-linear-gradient(
                  0deg,
                  #e5e7eb 0px,
                  #e5e7eb 50px,
                  #ffffff 50px,
                  #ffffff 100px
                ), repeating-linear-gradient(
                  90deg,
                  #e5e7eb 0px,
                  #e5e7eb 50px,
                  #ffffff 50px,
                  #ffffff 100px
                )`;
                e.currentTarget.parentElement.style.backgroundSize = '100px 100px';
              }
            }}
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 min-h-screen flex items-end pb-16">
          <div className="max-w-7xl mx-auto px-6 w-full">
            {/* How to Play Card - Positioned on the left/bottom */}
            <div className="max-w-md">
              <div className="bg-gray-700 text-white p-8 rounded-lg shadow-xl">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4">
                  HOW TO PLAY
                </h2>
                <h3 className="text-2xl font-bold mb-4 leading-tight">
                  Welcome to Wishmasters —<br />
                  premier real-money skill<br />
                  gaming platform.
                </h3>
                <p className="text-gray-300 text-sm">
                  Ready to turn your skill into unforgettable rewards? Here's everything you need to know to get started:
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Section - Gold Coin Card and Create Account */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Gold Coin Contest Card */}
            <div className="flex justify-center lg:justify-start">
              <div className="max-w-sm w-full">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-gray-200 relative">
                  {/* WIN Badge */}
                  <div className="absolute top-4 left-4 bg-yellow-400 text-black font-bold text-sm px-4 py-2 rounded z-10">
                    WIN
                  </div>

                  {/* Gold Coin Image */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center p-8">
                    <img 
                      src="/images/gold-coin.svg" 
                      alt="Gold Coin"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ffd700"/><stop offset="50%" style="stop-color:#ffed4e"/><stop offset="100%" style="stop-color:#d4af37"/></linearGradient></defs><circle cx="200" cy="200" r="150" fill="url(#gold)" stroke="#d4af37" stroke-width="8"/><circle cx="200" cy="200" r="120" fill="none" stroke="#d4af37" stroke-width="4"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#d4af37" font-size="48" font-weight="bold">GOLD</text><text x="50%" y="60%" text-anchor="middle" dy=".3em" fill="#d4af37" font-size="32" font-weight="bold">COIN</text></svg>');
                      }}
                    />
                  </div>

                  {/* Card Content */}
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6">
                    <h3 className="text-2xl font-bold mb-2">
                      GOLD COIN
                    </h3>
                    <p className="text-sm uppercase tracking-wide">
                      WITH A CLICK
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Create Account Section */}
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">01 STEP</p>
                  <h3 className="text-xl font-bold text-[#055F3C] mb-4">
                    Create Your Account
                  </h3>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li>• Visit wishmasters.in</li>
                    <li>• Sign up and set up your player profile</li>
                    <li>• Choose the <strong>contest</strong> you'd like to participate in</li>
                    <li>• Read the <strong>contest details</strong> carefully — every game is unique!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Third Section - Qualify With Skill */}
      <section className="bg-[#055F3C] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="text-white">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase mb-2 text-white/80">02 STEP</p>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Qualify With Skill
                  </h2>
                </div>
              </div>

              <p className="text-white/90 mb-6">
                Before you compete for the grand prize, you'll need to prove your skill.
              </p>

              <ul className="space-y-3 text-white/90 mb-6">
                <li>• Enter the <strong>Qualification Round</strong></li>
                <li>• You'll be shown <strong>10 images</strong> — your task is to <strong>Spot the Ball</strong> in each image</li>
                <li>• Pick the block where you think the ball is</li>
                <li>• After every selection, see the correct answer</li>
                <li>• <strong>Score 6 or more correct answers</strong> to qualify for the main contest</li>
              </ul>

              <p className="text-white/90">
                If you qualify, you move one step closer to the ultimate prize!
              </p>
            </div>

            {/* Right Side - Cricket Image */}
            <div className="relative">
              <img 
                src="/images/cricket-qualify.jpg" 
                alt="Cricket player batting"
                className="w-full h-full object-cover rounded-lg shadow-xl"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="cricket" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#d4a574"/><stop offset="100%" style="stop-color:#8b6f47"/></linearGradient></defs><rect fill="url(#cricket)" width="800" height="600"/><circle cx="400" cy="300" r="100" fill="#ffffff" opacity="0.3"/><text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-size="32" font-weight="bold">Cricket Player</text><text x="50%" y="60%" text-anchor="middle" fill="#ffffff" font-size="24">Spot the Ball</text></svg>');
                }}
              />
              {/* Timer Badge */}
              <div className="absolute top-4 right-4 bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg border-2 border-green-600">
                02:00
              </div>
              {/* Instruction Box */}
              <div className="absolute bottom-4 right-4 bg-gray-800/90 text-white text-xs px-4 py-3 rounded max-w-xs">
                <p className="font-semibold mb-1">Spot the ball before the time runs out</p>
                <p className="text-gray-300">Move the cursor where you think the ball is and click PLACE</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fourth Section - Enter The Main Contest */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Cricket Image with Overlay */}
            <div className="relative">
              <div className="relative rounded-lg overflow-hidden shadow-xl">
                <img 
                  src="/images/cricket-main-contest.jpg" 
                  alt="Cricket player bowling"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="field" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#d4a574"/><stop offset="100%" style="stop-color:#8b6f47"/></linearGradient></defs><rect fill="url(#field)" width="800" height="600"/><circle cx="400" cy="300" r="120" fill="#ffffff" opacity="0.2" stroke="#ffffff" stroke-width="2"/><line x1="400" y1="0" x2="400" y2="600" stroke="#ffffff" opacity="0.3" stroke-width="2" stroke-dasharray="10,10"/><text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-size="32" font-weight="bold">Cricket Field</text></svg>');
                  }}
                />
                {/* Crosshair Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Crosshair lines */}
                    <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/50 -translate-x-1/2"></div>
                    <div className="absolute top-1/2 left-0 h-0.5 w-full bg-white/50 -translate-y-1/2"></div>
                    {/* Center circle */}
                    <div className="w-24 h-24 border-2 border-white/70 rounded-full"></div>
                  </div>
                </div>
                {/* Coordinate Label */}
                <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-1 rounded">
                  x: 50, y: 185
                </div>
              </div>
              {/* Green decorative box */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#055F3C] rounded-lg -z-10"></div>
            </div>

            {/* Right Side - Text Content */}
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">03 STEP</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#055F3C] mb-6">
                    Enter The Main Contest
                  </h2>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                Once you qualify:
              </p>

              <ul className="space-y-2 text-gray-700 mb-6">
                <li>• Enter the main game where the <strong>real prizes</strong> await</li>
                <li>• Each contest has <strong>limited tickets</strong>, so odds stay fair for everyone</li>
              </ul>

              <p className="text-gray-700 font-semibold mb-3">
                How It Works
              </p>

              <ul className="space-y-2 text-gray-700">
                <li>• Each ticket gives you <strong>5 markers</strong> to plot where you think the ball is missing</li>
                <li>• Use <strong>X & Y coordinates</strong> for precision</li>
                <li>• Remember: <strong>Every Pixel Counts</strong></li>
                <li>• You can buy <strong>multiple tickets</strong> to increase your chances</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Fifth Section - Be Surprised With Your Grand Prize */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Range Rover Image */}
            <div className="relative">
              <img 
                src="/images/range-rover-prize.jpg" 
                alt="Range Rover Grand Prize"
                className="w-full h-full object-cover rounded-lg shadow-xl"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="car2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1f2937"/><stop offset="100%" style="stop-color:#374151"/></linearGradient></defs><rect fill="url(#car2)" width="800" height="600"/><rect x="100" y="250" width="600" height="250" rx="20" fill="#4b5563"/><rect x="150" y="280" width="200" height="150" fill="#6b7280"/><rect x="450" y="280" width="200" height="150" fill="#6b7280"/><circle cx="250" cy="480" r="40" fill="#1f2937" stroke="#9ca3af" stroke-width="8"/><circle cx="550" cy="480" r="40" fill="#1f2937" stroke="#9ca3af" stroke-width="8"/><text x="50%" y="50%" text-anchor="middle" fill="#d1d5db" font-size="24" font-weight="bold">RANGE ROVER</text></svg>');
                }}
              />
            </div>

            {/* Right Side - Text Content */}
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">04 STEP</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#055F3C] mb-6">
                    Be Surprised With Your Grand Prize
                  </h2>
                </div>
              </div>

              <ul className="space-y-2 text-gray-700">
                <li>• Winners are contacted personally and shown their prize in a Wishmasters reveal</li>
                <li>• Prizes include luxury watches, bikes, cars, and exclusive experiences</li>
                <li>• No gift tax — we cover it!</li>
                <li>• Watch our social channels to see winners' reactions and stories</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Judging Process and Ready to Play Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2">
            {/* Left Side - Judging Process (Green Background) */}
            <div className="bg-[#055F3C] text-white p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-8">Judging Process</h2>
              <p className="text-white/90 mb-6">
                Learn how we ensure fair play and transparency in determining winners. Our judging process is designed to maintain the integrity of every competition.
              </p>
              <button 
                onClick={() => router.push('/judging-process')}
                className="bg-white text-[#055F3C] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors w-fit"
              >
                Learn More About Judging Process
              </button>
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
