"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [maxTicketsPerParticipant, setMaxTicketsPerParticipant] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Phase settings
  const [phase1MaxMembers, setPhase1MaxMembers] = useState(55);
  const [phase2MaxMembers, setPhase2MaxMembers] = useState(88);
  const [phase3MaxMembers, setPhase3MaxMembers] = useState(111);
  
  // Competition settings
  const [maxCompetitionTickets, setMaxCompetitionTickets] = useState(100);
  const [ticketPrice, setTicketPrice] = useState(500);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load settings from localStorage
    const savedMaxTickets = localStorage.getItem('admin_max_tickets_per_participant');
    if (savedMaxTickets) {
      setMaxTicketsPerParticipant(parseInt(savedMaxTickets, 10));
    }
    
    const savedPhase1Max = localStorage.getItem('admin_phase1_max_members');
    if (savedPhase1Max) {
      setPhase1MaxMembers(parseInt(savedPhase1Max, 10));
    }
    
    const savedPhase2Max = localStorage.getItem('admin_phase2_max_members');
    if (savedPhase2Max) {
      setPhase2MaxMembers(parseInt(savedPhase2Max, 10));
    }
    
    const savedPhase3Max = localStorage.getItem('admin_phase3_max_members');
    if (savedPhase3Max) {
      setPhase3MaxMembers(parseInt(savedPhase3Max, 10));
    }
    
    const savedMaxCompetitionTickets = localStorage.getItem('admin_max_competition_tickets');
    if (savedMaxCompetitionTickets) {
      setMaxCompetitionTickets(parseInt(savedMaxCompetitionTickets, 10));
    }
    
    const savedTicketPrice = localStorage.getItem('admin_ticket_price');
    if (savedTicketPrice) {
      setTicketPrice(parseInt(savedTicketPrice, 10));
    }
    
    setIsLoading(false);
  }, [router]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSaving(true);

    try {
      // Validate
      if (maxTicketsPerParticipant < 1 || maxTicketsPerParticipant > 100) {
        throw new Error('Max tickets must be between 1 and 100');
      }
      
      if (phase1MaxMembers < 1 || phase1MaxMembers > 1000) {
        throw new Error('Phase 1 max members must be between 1 and 1000');
      }
      
      if (phase2MaxMembers < 1 || phase2MaxMembers > 1000) {
        throw new Error('Phase 2 max members must be between 1 and 1000');
      }
      
      if (phase3MaxMembers < 1 || phase3MaxMembers > 1000) {
        throw new Error('Phase 3 max members must be between 1 and 1000');
      }
      
      if (maxCompetitionTickets < 1 || maxCompetitionTickets > 10000) {
        throw new Error('Max competition tickets must be between 1 and 10000');
      }
      
      if (ticketPrice < 1 || ticketPrice > 100000) {
        throw new Error('Ticket price must be between ₹1 and ₹100000');
      }

      // Save to localStorage
      localStorage.setItem('admin_max_tickets_per_participant', maxTicketsPerParticipant.toString());
      localStorage.setItem('admin_phase1_max_members', phase1MaxMembers.toString());
      localStorage.setItem('admin_phase2_max_members', phase2MaxMembers.toString());
      localStorage.setItem('admin_phase3_max_members', phase3MaxMembers.toString());
      localStorage.setItem('admin_max_competition_tickets', maxCompetitionTickets.toString());
      localStorage.setItem('admin_ticket_price', ticketPrice.toString());

      setMessage({
        type: 'success',
        text: 'Settings saved successfully!',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5 py-8 px-4">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">Admin Settings</h1>
            <p className="text-muted-foreground mt-1">Configure system-wide settings</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Assignment Settings</CardTitle>
            <CardDescription>Control how many tickets can be assigned per participant</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="maxTickets" className="block text-sm font-medium mb-2">
                    Maximum Tickets Per Participant
                  </label>
                  <input
                    type="number"
                    id="maxTickets"
                    value={maxTicketsPerParticipant}
                    onChange={(e) => setMaxTicketsPerParticipant(parseInt(e.target.value) || 1)}
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    This is the maximum number of tickets you can assign to a single participant in any competition.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-4 text-gray-900">Competition Phase Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="phase1Max" className="block text-sm font-medium mb-2">
                        Phase 1 - Max Members
                      </label>
                      <input
                        type="number"
                        id="phase1Max"
                        value={phase1MaxMembers}
                        onChange={(e) => setPhase1MaxMembers(parseInt(e.target.value) || 1)}
                        min="1"
                        max="1000"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                        required
                      />
                      <p className="text-xs text-green-600 mt-1 font-medium">Phase 1</p>
                    </div>
                    
                    <div>
                      <label htmlFor="phase2Max" className="block text-sm font-medium mb-2">
                        Phase 2 - Max Members
                      </label>
                      <input
                        type="number"
                        id="phase2Max"
                        value={phase2MaxMembers}
                        onChange={(e) => setPhase2MaxMembers(parseInt(e.target.value) || 1)}
                        min="1"
                        max="1000"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                        required
                      />
                      <p className="text-xs text-blue-600 mt-1 font-medium">Phase 2</p>
                    </div>
                    
                    <div>
                      <label htmlFor="phase3Max" className="block text-sm font-medium mb-2">
                        Phase 3 - Max Members
                      </label>
                      <input
                        type="number"
                        id="phase3Max"
                        value={phase3MaxMembers}
                        onChange={(e) => setPhase3MaxMembers(parseInt(e.target.value) || 1)}
                        min="1"
                        max="1000"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                        required
                      />
                      <p className="text-xs text-purple-600 mt-1 font-medium">Phase 3</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    Set the maximum number of participants allowed in each competition phase.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-4 text-gray-900">Competition Display Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="maxCompetitionTickets" className="block text-sm font-medium mb-2">
                        Total Competition Tickets
                      </label>
                      <input
                        type="number"
                        id="maxCompetitionTickets"
                        value={maxCompetitionTickets}
                        onChange={(e) => setMaxCompetitionTickets(parseInt(e.target.value) || 1)}
                        min="1"
                        max="10000"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum tickets available for the competition</p>
                    </div>
                    
                    <div>
                      <label htmlFor="ticketPrice" className="block text-sm font-medium mb-2">
                        Price Per Ticket (₹)
                      </label>
                      <input
                        type="number"
                        id="ticketPrice"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(parseInt(e.target.value) || 1)}
                        min="1"
                        max="100000"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#055F3C] focus:ring-2 focus:ring-[#055F3C]/20 transition-all"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Cost per competition ticket</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    These values will be displayed in the competition cards on the dashboard.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Current Setting:</p>
                      <p>Each participant can receive a maximum of <span className="font-bold">{maxTicketsPerParticipant}</span> tickets.</p>
                    </div>
                  </div>
                </div>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/dashboard')}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Settings Placeholder */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Admin Access Code</CardTitle>
            <CardDescription>Universal access code for testing and admin use</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800 mb-2">Admin Universal Access Code:</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-3xl font-bold text-green-700 bg-white px-6 py-3 rounded-lg border-2 border-green-300 tracking-wider">
                      999999
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('999999');
                        alert('Admin code copied!');
                      }}
                      className="text-green-600 hover:text-green-800 p-2 hover:bg-green-100 rounded"
                      title="Copy admin code"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-green-700">
                <p className="font-medium">📌 This code works for all competitions and bypasses user verification.</p>
                <p className="mt-1">Use this code for testing and admin access. Remove before production.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Other Settings</CardTitle>
            <CardDescription>More configuration options coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li>• Email notifications (Coming soon)</li>
                <li>• SMS alerts (Coming soon)</li>
                <li>• Payment gateway settings (Coming soon)</li>
                <li>• Branding customization (Coming soon)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
