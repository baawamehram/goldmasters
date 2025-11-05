'use client';
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function AboutPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
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

  // Team members data
  const teamMembers = [
    {
      name: "Manjot Singh",
      role: "CO-FOUNDER AND BUSINESS HEAD",
      image: "/images/team/manjot-singh.jpg",
  description: "Manjot's entrepreneurial journey began with BOTB UK, where he played a pivotal role before launching BOTB Country in 2014. Under his leadership, the company achieved 3 consecutive years, declaring over 15 winners and pioneering the \"Spot the Ball\"...",
      fallbackColor: "#e5e7eb"
    },
    {
      name: "Nabeel Merchant",
      role: "CO-FOUNDER AND MARKETING DIRECTOR",
      image: "/images/team/nabeel-merchant.jpg",
      description: "At Goldmasters, Nabeel brings his sharp operational acumen and passion for innovation to co-lead the brand's mission—creating a groundbreaking, skill-driven real-money gaming platform rooted in purpose and possibility...",
      fallbackColor: "#f3e8ff"
    },
    {
      name: "Tufayl Merchant",
      role: "LEADERSHIP",
      image: "/images/team/tufayl-merchant.jpg",
      description: "Tufayl's strength lies in building operational systems that are agile, transparent, and built for trust—core pillars of the Goldmasters philosophy. With unwavering focus and empathy, Tufayl is instrumental in delivering on the brand's promise...",
      fallbackColor: "#f3e8ff"
    },
    {
      name: "Rahul Kirpalani",
      role: "OPERATIONS AND PLANNING HEAD",
      image: "/images/team/rahul-kirpalani.jpg",
      description: "Rahul Kirpalani leads product strategy at Goldmasters, where he is focused on crafting a seamless, intuitive, and emotionally rewarding experience for every participant. With a deep understanding of user behavior and game mechanics...",
      fallbackColor: "#dbeafe"
    },
    {
      name: "Team Member 5",
      role: "SENIOR ADVISOR",
      image: "/images/team/member5.jpg",
      description: "An experienced professional bringing years of expertise in strategic planning and business development. Passionate about innovation and driving growth in the gaming industry...",
      fallbackColor: "#fef3c7"
    },
    {
      name: "Team Member 6",
      role: "HEAD OF TECHNOLOGY",
      image: "/images/team/member6.jpg",
      description: "Leading the technical vision and infrastructure development at Goldmasters. Focused on building scalable, secure, and innovative solutions for our platform...",
      fallbackColor: "#ccfbf1"
    },
    {
      name: "Team Member 7",
      role: "CREATIVE DIRECTOR",
      image: "/images/team/member7.jpg",
      description: "Driving the creative vision and brand identity of Goldmasters. Committed to delivering exceptional user experiences through thoughtful design and storytelling...",
      fallbackColor: "#fce7f3"
    },
    {
      name: "Team Member 8",
      role: "CUSTOMER SUCCESS LEAD",
      image: "/images/team/member8.jpg",
      description: "Dedicated to ensuring every customer has an exceptional experience with Goldmasters. Building lasting relationships and fostering a community of satisfied users...",
      fallbackColor: "#ddd6fe"
    }
  ];

  const membersPerSlide = 4;
  const totalSlides = Math.ceil(teamMembers.length / membersPerSlide);
  const totalMobileSlides = teamMembers.length; // 1 member per slide on mobile
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePrevSlide = () => {
    if (isMobile) {
      setCurrentSlide((prev) => (prev === 0 ? totalMobileSlides - 1 : prev - 1));
    } else {
      setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    }
  };

  const handleNextSlide = () => {
    if (isMobile) {
      setCurrentSlide((prev) => (prev === totalMobileSlides - 1 ? 0 : prev + 1));
    } else {
      setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    }
  };

  const getCurrentMembers = () => {
    const start = currentSlide * membersPerSlide;
    const end = start + membersPerSlide;
    return teamMembers.slice(start, end);
  };

  const getCurrentMobileMember = () => {
    return [teamMembers[currentSlide]];
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
            <h1 className="text-xl font-bold tracking-wider">GOLDMASTERS</h1>
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
              className="hover:text-yellow-400 transition-colors font-medium border-b-2 border-yellow-400 pb-1"
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
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogoutConfirm(false)} />
            <div className="bg-white rounded-lg shadow-xl z-10 max-w-sm w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mb-4">Are you sure you want to logout? This will sign you out and clear any competition access stored locally.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md"
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
      </header>

      {/* Hero Section with Mission and Vision */}
      <section className="relative min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/images/hero-car-desktop.jpg" 
            alt="Luxury car on city street"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1f2937"/><stop offset="100%" style="stop-color:#374151"/></linearGradient></defs><rect fill="url(#g)" width="1920" height="1080"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af" font-size="48" font-weight="bold">Hero Image</text></svg>');
            }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 min-h-screen flex flex-col justify-center">
          <div className="max-w-2xl">
            {/* Our Mission */}
            <div className="mb-16">
              <h2 className="text-sm font-bold text-white tracking-widest mb-4 uppercase">
                Our Mission
              </h2>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                To redefine real-money gaming by blending thrill, transparency, and purpose
              </h3>
              <p className="text-white/90 text-lg leading-relaxed">
                —where every play brings you closer to once-in-a-lifetime dreams, and every win leaves a meaningful mark on the world.
              </p>
            </div>

            {/* Our Vision */}
            <div>
              <h2 className="text-sm font-bold text-white tracking-widest mb-4 uppercase">
                Our Vision
              </h2>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                Goldmasters exists to elevate the gaming experience
              </h3>
              <p className="text-white/90 text-base leading-relaxed">
                through curated dream rewards, expert-audited competitions, and a fair-play ethos. Rooted in cricket culture and global entertainment, we turn aspirations into achievements—while pledging a part of our success to the welfare of animals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll indicator */}
      <div className="bg-white py-4 text-center border-t border-gray-200">
        <p className="text-gray-500 text-sm">Scroll down to learn more</p>
        <svg className="w-6 h-6 mx-auto mt-2 text-gray-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Cricket Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Image */}
            <div className="bg-purple-300 aspect-video rounded-lg overflow-hidden">
              <img 
                src="/images/image 2276.jpg" 
                alt="Cricket Stadium"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect fill="#d8b4fe" width="800" height="600"/><text x="50%" y="50%" text-anchor="middle" fill="#7c3aed" font-size="32" font-weight="bold">Cricket Image</text></svg>');
                }}
              />
            </div>

            {/* Right - Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Cricket is the pulse<br />
                <span className="text-[#055F3C]">of the Nation.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                It's more than a religion and flexing your cricket prowess to win the prize of a lifetime is the dream that Goldmasters wants to offer all it's contestants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Prizes Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-[#055F3C]">Curated Prizes.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We are curating some of the most exclusive and sought after rewards that our contestant can only dream off. There is a story to every prize, something money will never be able to buy
              </p>
            </div>

            {/* Right - Image */}
            <div className="bg-black aspect-video rounded-lg overflow-hidden">
              <img 
                src="/images/image 2277.jpg" 
                alt="Luxury Watches"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect fill="#1f2937" width="800" height="600"/><circle cx="300" cy="300" r="80" fill="#374151" stroke="#d1d5db" stroke-width="4"/><circle cx="500" cy="300" r="80" fill="#374151" stroke="#d1d5db" stroke-width="4"/><text x="50%" y="520" text-anchor="middle" fill="#9ca3af" font-size="24" font-weight="bold">Luxury Watches</text></svg>');
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Key Values Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-[#055F3C]">Our Key Values</span>
            </h2>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-4">
              THAT GOLDMASTERS WILL ALWAYS LIVE BY
            </p>
            <p className="text-gray-600 leading-relaxed">
              At Goldmasters, we are built on trust, driven by transparency, guided by ethics, and committed to welfare—ensuring every game uplifts, every win is fair, and every step creates a positive impact.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Trust */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#055F3C] mb-2">Trust</h3>
              </div>
            </div>

            {/* Transparency */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#055F3C] mb-2">Transparency</h3>
              </div>
            </div>

            {/* Ethics */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#055F3C] mb-2">Ethics</h3>
              </div>
            </div>

            {/* Welfare */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-[#055F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#055F3C] mb-2">Welfare</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet The Game-Changers Section */}
      <section className="bg-gradient-to-br from-gray-100 to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            {/* Left - Green Panel */}
            <div className="bg-[#055F3C] text-white p-12 rounded-lg flex flex-col justify-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Meet The<br />
                Game-Changers
              </h2>
              <p className="text-sm uppercase tracking-wide mb-6 text-white/80">
                OF GOLDMASTERS
              </p>
              
              <div className="space-y-6 text-white/90">
                <p>
                  Goldmasters is the first of our kind in Country.
                </p>
                <p>
                  Through our unique skill based approach and the limited odds system, we ensure that your luck is in your hands and you can control your chances.
                </p>
                <p>
                  Thanks to our gift tax credit, you can take home your luxury prize without spending an extra dime.
                </p>
                <p>
                  We are committed to turning your wishes into a reality as simply as possible.
                </p>
              </div>
            </div>

            {/* Right - Two Cards */}
            <div className="space-y-6">
              {/* Limited Odds Card */}
              <div className="bg-white p-8 rounded-lg shadow-lg">
                {/* Purple placeholder image */}
                <div className="bg-purple-300 aspect-video rounded-lg mb-6 overflow-hidden">
                  <img 
                    src="/images/limited-odds.jpg" 
                    alt="Limited Odds"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="#d8b4fe" width="600" height="400"/><text x="50%" y="50%" text-anchor="middle" fill="#7c3aed" font-size="24" font-weight="bold">Limited Odds Image</text></svg>');
                    }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-[#055F3C] mb-4">
                  Limited Odds
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Enter a filtered playground where the odds of success are great due to the limited number of entrants to the final contest.
                </p>
              </div>

              {/* Gift Tax Credited Card */}
              <div className="bg-white p-8 rounded-lg shadow-lg">
                {/* Gift image placeholder */}
                <div className="bg-gray-100 aspect-video rounded-lg mb-6 overflow-hidden flex items-center justify-center">
                  <img 
                    src="/images/image 2285.jpg" 
                    alt="Gift with bow"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="#f3f4f6" width="600" height="400"/><rect x="200" y="100" width="200" height="200" fill="#d1d5db" stroke="#055F3C" stroke-width="4" rx="8"/><path d="M 250 100 Q 300 60 350 100" fill="none" stroke="#055F3C" stroke-width="6"/><circle cx="300" cy="80" r="20" fill="#055F3C"/><text x="50%" y="360" text-anchor="middle" fill="#6b7280" font-size="20" font-weight="bold">Gift Box</text></svg>');
                    }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-[#055F3C] mb-4">
                  Gift Tax Credited
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Bring home your dream prize and gift tax amount, Goldmasters ensures you don't spend an extra dime on your prize
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact At Goldmasters Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Text Content */}
            <div className="bg-white p-8 md:p-12 rounded-lg shadow-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-[#055F3C] mb-6">
                Impact At Goldmasters
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                At Goldmasters we are deeply committed to compassion and animal welfare, because we believe this world is meant to be shared with all life. As part of our unwavering commitment, we've partnered with The Feline Foundation to support the wellbeing of cats and dogs across Country.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Every game played, every ticket purchased actively contributes to this cause—turning every dream fulfilled into a step toward a kinder, more compassionate world.
              </p>
            </div>

            {/* Right - Cat Image */}
            <div className="aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
              <img 
                src="/images/image.jpg" 
                alt="Cat being held"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect fill="#fce7f3" width="800" height="600"/><circle cx="400" cy="250" r="100" fill="#f9a8d4"/><circle cx="370" cy="230" r="15" fill="#4b5563"/><circle cx="430" cy="230" r="15" fill="#4b5563"/><path d="M 350 200 L 320 150 L 360 180 Z" fill="#f9a8d4"/><path d="M 450 200 L 480 150 L 440 180 Z" fill="#f9a8d4"/><text x="50%" y="550" text-anchor="middle" fill="#9ca3af" font-size="24" font-weight="bold">Cat Image</text></svg>');
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section with Range Rover */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Range Rover Image */}
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <img 
                src="/images/Group 1000004279.png" 
                alt="Range Rover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="car" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#1f2937"/><stop offset="100%" style="stop-color:#374151"/></linearGradient></defs><rect fill="url(#car)" width="800" height="600"/><rect x="100" y="250" width="600" height="250" rx="20" fill="#4b5563"/><rect x="150" y="280" width="200" height="150" fill="#6b7280"/><rect x="450" y="280" width="200" height="150" fill="#6b7280"/><circle cx="250" cy="480" r="40" fill="#1f2937" stroke="#9ca3af" stroke-width="8"/><circle cx="550" cy="480" r="40" fill="#1f2937" stroke="#9ca3af" stroke-width="8"/><text x="50%" y="560" text-anchor="middle" fill="#d1d5db" font-size="20" font-weight="bold">RANGE ROVER</text></svg>');
                }}
              />
            </div>

            {/* Right - CTA Content */}
            <div className="bg-[#055F3C] text-white p-8 md:p-12 rounded-lg">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Allow Goldmasters to turn your wishes into your reality
              </h2>
              <button 
                onClick={() => router.push('/')}
                className="inline-block text-white font-semibold text-lg underline hover:text-yellow-400 transition-colors"
              >
                SELECT THE CONTEST OF YOUR CHOICE NOW
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
            <button 
              onClick={() => router.push('/about')}
              className="hover:text-yellow-400 transition-colors"
            >
              About
            </button>
            <span className="text-gray-600">|</span>
            <Link href="/faqs" className="hover:text-yellow-400 transition-colors">
              FAQs
            </Link>
            <span className="text-gray-600">|</span>
            <button 
              onClick={() => scrollToSection('contact')}
              className="hover:text-yellow-400 transition-colors"
            >
              Contact us
            </button>
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
