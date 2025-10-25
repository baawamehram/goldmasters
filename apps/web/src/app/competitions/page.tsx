'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CompetitionsPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const handleNavigate = (path: string) => {
    router.push(path);
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#055F3C] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <button
              type="button"
              onClick={() => handleNavigate('/')}
              className="text-xl font-bold tracking-wider hover:text-yellow-400 transition-colors"
            >
              WISHMASTERS
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => handleNavigate('/')}
              className="hover:text-yellow-400 transition-colors font-medium"
            >
              HOME
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/competitions')}
              className="font-medium border-b-2 border-yellow-400 pb-1 text-yellow-300"
            >
              UPCOMING CONTESTS
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/about')}
              className="hover:text-yellow-400 transition-colors font-medium"
            >
              ABOUT US
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/contact')}
              className="hover:text-yellow-400 transition-colors font-medium"
            >
              CONTACT
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
              <img
                src="/images/user-avatar.jpg"
                alt="User"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml,' +
                    encodeURIComponent(
                      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#d1d5db"/><circle cx="20" cy="16" r="7" fill="#9ca3af"/><path d="M 8 35 Q 8 28 20 28 Q 32 28 32 35" fill="#9ca3af"/></svg>'
                    );
                }}
              />
            </div>
            <span className="text-sm font-medium">{displayName}</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-2xl"
            aria-label="Toggle mobile navigation"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#044a2f] border-t border-white/20 shadow-inner">
            <nav className="flex flex-col border-y border-white/20 divide-y divide-white/20">
              <button
                type="button"
                onClick={() => handleNavigate('/')}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                HOME
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/competitions')}
                className="px-6 py-4 text-left bg-[#055F3C] text-yellow-200 transition-colors"
              >
                UPCOMING CONTESTS
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/about')}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                ABOUT US
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/contact')}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                CONTACT
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('/privacy-policy')}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                PRIVACY POLICY
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setMobileMenuOpen(false);
                }}
                className="px-6 py-4 text-left hover:bg-[#055F3C] transition-colors"
              >
                LOGOUT
              </button>
            </nav>
            <div className="px-6 py-4 bg-[#033826] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                <img
                  src="/images/user-avatar.jpg"
                  alt="User"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,' +
                      encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#d1d5db"/><circle cx="20" cy="16" r="7" fill="#9ca3af"/><path d="M 8 35 Q 8 28 20 28 Q 32 28 32 35" fill="#9ca3af"/></svg>'
                      );
                  }}
                />
              </div>
              <span className="text-sm font-medium">{displayName}</span>
            </div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <div className="bg-white rounded-lg shadow-xl z-10 max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to logout? This will sign you out and clear any competition
                access stored locally.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
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
