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
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
  const response = await fetch(buildApiUrl(`competitions/${competitionId}/verify-password`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error responses
        if (response.status === 401) {
          setError('Incorrect password. Please try again.');
        } else if (response.status === 403) {
          setError('This competition is not currently active.');
        } else if (response.status === 404) {
          setError('Competition not found.');
        } else {
          setError(data.message || 'An error occurred. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Store the competition access token
      if (data.data?.competitionAccessToken) {
        localStorage.setItem('competition_access_token', data.data.competitionAccessToken);
        localStorage.setItem(`competition_${competitionId}_access`, 'true');
        
        // Redirect to competition entry page
        router.push(`/competition/${competitionId}/enter`);
      } else {
        setError('Invalid response from server.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Password verification error:', err);
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="container-custom py-12 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Competition Access</CardTitle>
          <CardDescription>
            This competition is password-protected. Enter the password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter competition password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Access Competition'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Don&apos;t have the password?</p>
            <p className="mt-1">Contact the competition administrator.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
