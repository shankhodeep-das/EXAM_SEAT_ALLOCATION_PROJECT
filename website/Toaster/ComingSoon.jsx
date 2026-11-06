import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bell, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Grid, 
  ArrowRight, 
  Check, 
  BookOpen, 
  Calendar,
  Users,
  Building,
  Pin
} from 'lucide-react';

export default function ComingSoonPage() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('algorithm');
  const [progress, setProgress] = useState(84);

  // Simulated live progress fluctuation for subtle realism
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev < 92 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  const featurePreviews = {
    algorithm: {
      title: "Smart Hall Allocation Engine",
      description: "Automated clash-free student seat layout generator based on exam subjects, room capacities, and roll numbers.",
      stats: "Zero Overlaps • Instant Generation"
    },
    students: {
      title: "Instant Student Portal",
      description: "One-click exam ticket lookup with exact seat numbers, floor maps, and real-time exam day notifications.",
      stats: "Mobile Friendly • Offline Ready"
    },
    analytics: {
      title: "Exam Cell Control Room",
      description: "Comprehensive administrative dashboard for invigilator assignments, hall capacities, and instant PDF prints.",
      stats: "High Security • Live Monitoring"
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-600 relative overflow-hidden flex flex-col justify-between">
      
      {/* Background Dot Grid Pattern matching the design */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundSize: '24px 24px',
          backgroundImage: 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)'
        }}
      />

      {/* Decorative ambient lighting radial blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

      {/* ---------------- NAVIGATION HEADER ---------------- */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white border border-slate-200/80 rounded-xl shadow-sm flex items-center justify-center">
            {/* 4-dot Grid Logo matching screenshot */}
            <div className="grid grid-cols-2 gap-1 p-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">SeatWise</span>
        </div>

        {/* Minimal Header Navigation Pill */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500 bg-white/70 backdrop-blur-md px-5 py-2 rounded-full border border-slate-200/60 shadow-sm">
          <span className="hover:text-slate-900 transition-colors cursor-pointer">Overview</span>
          <span className="hover:text-slate-900 transition-colors cursor-pointer">Roadmap</span>
          <span className="hover:text-slate-900 transition-colors cursor-pointer">Support</span>
        </div>

        {/* Development Status Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          v2.0 Under Development
        </div>
      </header>

      {/* ---------------- MAIN HERO SECTION ---------------- */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 md:py-14 flex-1 flex flex-col justify-center items-center">
        
        {/* Container Outer Card - matching the subtle gray container in screenshot */}
        <div className="w-full bg-white/60 backdrop-blur-sm border border-slate-200/70 rounded-3xl p-6 sm:p-10 md:p-14 shadow-xl shadow-slate-200/40 relative">
          
          {/* ----- FLOATING DECORATIVE CARDS (SURROUNDING HERO) ----- */}
          
          {/* Floating Card 1: Yellow Sticky Note Notice */}
          <div className="hidden lg:block absolute -top-6 -left-6 w-64 bg-amber-100/90 backdrop-blur border border-amber-200/80 rounded-2xl p-4 shadow-lg shadow-amber-900/5 rotate-[-3deg] hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Pin className="w-3.5 h-3.5 fill-amber-600 text-amber-700" />
              <span>Exam day notice</span>
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
              Crafting the ultimate seat layout algorithm. Report back soon for 100% automated hall allocations!
            </p>
            <div className="mt-2 text-[10px] text-amber-700 font-semibold bg-amber-200/60 inline-block px-2 py-0.5 rounded">
              Feature Preview
            </div>
          </div>

          {/* Floating Card 2: Upcoming Exam Ticket (Top Right) */}
          <div className="hidden lg:flex absolute -top-8 -right-4 w-72 bg-white/95 backdrop-blur border border-slate-200/80 rounded-2xl p-4 shadow-xl shadow-slate-200/60 rotate-[2deg] hover:rotate-0 transition-transform duration-300 flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-blue-600" /> Module Progress
              </span>
              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[11px] font-semibold">{progress}% Done</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Seating Allocation Engine</h4>
              <p className="text-[11px] text-slate-500">Hall B-204 & Block B seating map</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Floating Card 3: Live Seat Tag (Bottom Left) */}
          <div className="hidden lg:flex absolute -bottom-6 -left-4 bg-white/90 backdrop-blur border border-slate-200/90 rounded-2xl p-3.5 shadow-lg shadow-slate-200/50 items-center gap-3 rotate-[1.5deg]">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">System Status</div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Optimizing Hall Layouts
              </div>
            </div>
          </div>

          {/* Floating Card 4: Verified Badge (Bottom Right) */}
          <div className="hidden lg:flex absolute -bottom-6 -right-4 bg-white/95 backdrop-blur border border-slate-200/80 rounded-2xl p-3 shadow-lg shadow-slate-200/50 items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="pr-2">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Built For</div>
              <div className="text-xs font-bold text-slate-800">Exam Controllers</div>
            </div>
          </div>

          {/* ----- CENTRAL HERO CONTENT ----- */}
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
            
            {/* Center Animated Logo Display */}
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-center mb-6 relative group">
              <div className="grid grid-cols-2 gap-1.5 p-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="w-3 h-3 rounded-full bg-blue-600 delay-100"></span>
                <span className="w-3 h-3 rounded-full bg-blue-600 delay-200"></span>
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              We're arranging <br className="hidden sm:inline" />
              <span className="text-slate-400 font-semibold">something great.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
              SeatWise is currently undergoing scheduled upgrades to bring you the fastest, most reliable exam seat allocation platform.
            </p>

            {/* Sub-status pill */}
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/70">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Expected Launch: Coming Soon
            </div>

            {/* Email Subscription Form */}
            <div className="mt-8 w-full max-w-md">
              {!isSubscribed ? (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative w-full">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your college email address..."
                      required
                      className="w-full px-4 py-3 rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl sm:rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    Get Notified
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center justify-center gap-3 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-medium">You're on the priority notification list!</span>
                </div>
              )}
            </div>

          </div>

          {/* ----- FEATURE PREVIEW TABS (INTERACTIVE SNEAK PEEK) ----- */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 max-w-2xl mx-auto">
            <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Sneak Peek of What We're Building
            </div>
            
            {/* Tab Controls */}
            <div className="flex justify-center gap-2 mb-4 p-1 bg-slate-100/80 rounded-xl max-w-md mx-auto">
              <button
                onClick={() => setActiveTab('algorithm')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'algorithm' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Allocation Engine
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student App
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exam Cell
              </button>
            </div>

            {/* Active Tab Card Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-left transition-all">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-800">
                  {featurePreviews[activeTab].title}
                </h3>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {featurePreviews[activeTab].stats}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {featurePreviews[activeTab].description}
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/50">
        <div>
          © {new Date().getFullYear()} SeatWise. All rights reserved. Built for modern academic institutions.
        </div>
        <div className="flex items-center gap-6 text-slate-500">
          <span className="hover:text-slate-900 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-slate-900 cursor-pointer transition-colors">Terms of Service</span>
          <span className="hover:text-slate-900 cursor-pointer transition-colors">Contact Support</span>
        </div>
      </footer>

    </div>
  );
}