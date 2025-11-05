'use client';
/* eslint-disable @next/next/no-img-element */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HowToPlayPage() {
  const router = useRouter();
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
          <h1 className="text-xl font-bold tracking-wider">GOLDMASTERS</h1>
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
            <div className="p-6 space-y-6">
              {/* How to Play Instructions */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-[#055F3C] rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">How to Play Spot the Ball</h3>
                <div className="text-left space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#055F3C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <p>You will receive tickets from the admin with a specific number of markers to place on the competition image.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#055F3C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <p>Drag and drop your markers onto the image where you think the ball should be located.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#055F3C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <p>Each ticket requires a specific number of markers. Make sure to place all required markers before submitting.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#055F3C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    <p>Once submitted, your markers are locked and cannot be changed. Choose your positions carefully!</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#055F3C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">5</div>
                    <p>Winners are determined by the markers closest to the official judge's position.</p>
                  </div>
                </div>
              </div>

              {/* Play Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    const competitionId = window.location.pathname.split('/')[2];
                    router.push(`/competition/${competitionId}/enter`);
                  }}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#055F3C] to-[#077a4f] text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#077a4f] to-[#055F3C] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Play icon */}
                  <div className="relative z-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  
                  {/* Text */}
                  <span className="relative z-10">Start Playing Now</span>
                  
                  {/* Arrow */}
                  <svg className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <p className="text-xs text-gray-500 mt-3">You will be redirected to the game interface</p>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <p>Make sure you have received your tickets from the competition administrator before starting the game.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
