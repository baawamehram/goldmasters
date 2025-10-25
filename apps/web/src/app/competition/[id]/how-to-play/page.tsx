'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HowToPlayPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.id as string;
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/cricket-background.jpg"
          alt="Cricket"
          className="w-full h-full object-cover opacity-60"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="cricketBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1a472a"/><stop offset="100%" style="stop-color:#2d5a3d"/></linearGradient></defs><rect fill="url(#cricketBg)" width="1920" height="1080"/><circle cx="960" cy="540" r="200" fill="#3d6b4f" opacity="0.3"/><rect x="0" y="800" width="1920" height="280" fill="#1a472a" opacity="0.5"/></svg>');
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-[#055F3C] text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <h1 className="text-xl font-bold tracking-wider">WISHMASTERS</h1>
        </div>
        <button className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">How To Play</h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="bg-gray-100 rounded-lg p-12 text-center">
                <p className="text-gray-600 text-sm">
                  TEST to be provided by manjot<br />
                  on how to play
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
