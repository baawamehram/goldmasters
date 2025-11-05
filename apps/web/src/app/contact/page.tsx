'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function ContactPage() {
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
            <button
              onClick={() => router.push('/')}
              className="text-xl font-bold tracking-wider hover:text-yellow-400 transition-colors"
            >
              GOLDMASTERS
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => router.push('/')}
              className="hover:text-yellow-400 transition-colors font-medium"
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
              onClick={() => router.push('/contact')}
              className="hover:text-yellow-400 transition-colors font-medium border-b-2 border-yellow-400 pb-1"
            >
              CONTACT
            </button>
          </nav>

          {/* User Profile - Desktop */}
          <div className="hidden md:flex items-center gap-3">
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
                onClick={() => { router.push('/contact'); setMobileMenuOpen(false); }}
                className="px-6 py-4 text-left bg-[#055F3C] transition-colors"
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
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contact <span className="text-[#055F3C]">Us</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're here to help! Reach out to us for any questions, concerns, or feedback.
          </p>
        </div>

        {/* Contact Information */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Left Side - Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                  <p className="text-gray-600 mb-8">
                    Have questions about our competitions or need assistance? We'd love to hear from you.
                  </p>
                </div>

                {/* Email Contact */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#055F3C] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</h3>
                    <a 
                      href="mailto:contact@goldmasters.world" 
                      className="text-lg font-medium text-[#055F3C] hover:text-[#044a2f] transition-colors"
                    >
                      contact@goldmasters.world
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Side - Additional Info */}
              <div className="bg-gradient-to-br from-[#055F3C] to-[#0a8f5a] rounded-xl p-8 text-white">
                <h3 className="text-xl font-bold mb-4">Why Contact Us?</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Competition inquiries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Technical support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Account assistance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>General feedback</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Partnership opportunities</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Response Time Notice */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Response Time</p>
                  <p>We typically respond to all inquiries within 24-48 hours during business days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white mt-16">
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
            © 2024 Goldmasters, Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
