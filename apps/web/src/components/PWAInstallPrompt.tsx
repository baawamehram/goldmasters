'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    
    if (standalone) {
      return;
    }

    // Check if prompt was dismissed before
    const promptDismissed = localStorage.getItem('pwa-install-dismissed');
    if (promptDismissed) {
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For testing/development: show prompt after 2 seconds if beforeinstallprompt hasn't fired
    const timer = setTimeout(() => {
      if (!deferredPrompt && !standalone && !promptDismissed) {
        setShowInstallPrompt(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt (e.g., in development), show instructions
      alert('To install:\n\n1. Open Chrome/Edge browser\n2. Click the ⊕ icon in the address bar\n3. Select "Install Goldmasters"\n\nOr use Chrome menu > Install Goldmasters');
      setShowInstallPrompt(false);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0">
        {/* Header with Icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#055F3C] to-[#044a2f] rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Install Goldmasters</h3>
            <p className="text-sm text-gray-500">Quick access to your app</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          Install Goldmasters on your device for quick access, offline support, and a better experience. Access competitions instantly!
        </p>

        {/* Benefits */}
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Fast and reliable access</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Works offline</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Instant notifications</span>
          </li>
        </ul>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-[#055F3C] hover:bg-[#044a2f] text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-100 transition-colors duration-200"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
