'use client';

import { useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildApiUrl } from '@/lib/api';

export default function CompetitionGatePage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.id as string;
  
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Verify the access code
      const response = await fetch(buildApiUrl('competitions/verify-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: accessCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error responses
        if (response.status === 401) {
          setError('Invalid access code. Please check the code and try again.');
        } else {
          setError(data.message || 'An error occurred. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Store the user data and allow access
      if (data.data?.user) {
        localStorage.setItem('competition_user', JSON.stringify(data.data.user));
        localStorage.setItem('competition_access_token', 'verified'); // Token for access check
        localStorage.setItem(`competition_${competitionId}_access`, 'true');
        
        // Redirect to competition entry page
        router.push(`/competition/${competitionId}/enter`);
      } else {
        setError('Invalid response from server.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Access code verification error:', err);
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="container-custom py-12 min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Competition Access</CardTitle>
          <CardDescription className="text-base">
            This competition is password-protected. Enter the password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="accessCode" className="text-sm font-semibold block">
                Password
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setAccessCode(value);
                }}
                placeholder="Enter competition password"
                className="w-full px-4 py-3 text-lg font-mono tracking-widest text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#055F3C] focus:border-[#055F3C] transition-all"
                maxLength={6}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit code provided by the administrator
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-semibold"
              disabled={isLoading || accessCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Access Competition'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600 border-t pt-6">
            <p className="font-semibold">Don&apos;t have the password?</p>
            <p className="mt-2">Contact the competition administrator.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
