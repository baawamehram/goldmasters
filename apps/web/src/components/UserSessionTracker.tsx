"use client";

import { useEffect } from 'react';
import { buildApiUrl } from '@/lib/api';

/**
 * Component to track user session and logout when they close the browser/tab
 */
export function UserSessionTracker() {
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const profile = localStorage.getItem('participant_profile');
      
      if (profile) {
        try {
          const profileData = JSON.parse(profile);
          
          // Use sendBeacon for reliable logout on page unload
          const logoutData = JSON.stringify({ phone: profileData.phone });
          const blob = new Blob([logoutData], { type: 'application/json' });
          
          navigator.sendBeacon(buildApiUrl('participants/logout'), blob);
        } catch (error) {
          console.error('Error logging out user:', error);
        }
      }
    };

    // Listen for page unload (when user closes tab/browser)
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null; // This component doesn't render anything
}
