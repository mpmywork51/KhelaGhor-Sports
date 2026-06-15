import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Send, 
  User as UserIcon, 
  Tv, 
  Calendar, 
  Radio, 
  Clock, 
  FileText, 
  Shield, 
  Chrome, 
  LogIn, 
  X,
  AlertTriangle
} from 'lucide-react';
import Splash from './components/Splash';
import WelcomeModal from './components/WelcomeModal';
import MatchCard from './components/MatchCard';
import UpcomingCard from './components/UpcomingCard';
import ChannelCard from './components/ChannelCard';
import VideoPlayer from './components/VideoPlayer';
import BannerAd from './components/BannerAd';
import AdminPanel from './components/AdminPanel';
import { NavigationTab, Match, UpcomingMatch, Channel, GlobalSettings, SportCategory } from './types';
import { 
  subscribeToMatches, 
  subscribeToUpcoming, 
  subscribeToChannels, 
  subscribeToSettings, 
  subscribeToAuth,
  loginWithGoogle,
  transitionMatchToLive,
  AUTHORIZED_ADMIN,
  pingActiveSession,
} from './lib/store';

export default function App() {
  // Active session tracking setup
  useEffect(() => {
    // Generate or fetch a persistence token for this browser session
    let sessionId = sessionStorage.getItem('livekhela_visitor_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.floor(Math.random() * 10000000) + '_' + Date.now().toString(36);
      sessionStorage.setItem('livekhela_visitor_session_id', sessionId);
    }

    const isAndroidApp = navigator.userAgent.includes('LiveKhelaAndroidApp');

    // Ping session presence immediately
    pingActiveSession(sessionId, isAndroidApp);

    // Continue pinging on a 40-seconds loop to indicate "still visiting"
    const pingInterval = setInterval(() => {
      pingActiveSession(sessionId!, isAndroidApp);
    }, 40000);

    return () => {
      clearInterval(pingInterval);
    };
  }, []);

  // Application view lifecycle managers
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.LIVE_MATCH);
  const [selectedSport, setSelectedSport] = useState<'all' | SportCategory>('all');

  // Currently playing stream structures
  const [activePlayback, setActivePlayback] = useState<{
    server1Url: string;
    server2Url: string;
    server3Url?: string;
    server4Url?: string;
    title: string;
  } | null>(null);

  // Synced state arrays
  const [matches, setMatches] = useState<Match[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingMatch[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);

  // Identity / Authentication configurations
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Bell Notification popup state
  const [showBellNotice, setShowBellNotice] = useState(false);

  // Subscribe to real-time sync listeners
  useEffect(() => {
    const unsubMatches = subscribeToMatches((liveList) => setMatches(liveList));
    const unsubUpcoming = subscribeToUpcoming((upcomingList) => {
      setUpcoming(upcomingList);
    });
    const unsubChannels = subscribeToChannels((channelList) => setChannels(channelList));
    const unsubSettings = subscribeToSettings((globalSettings) => setSettings(globalSettings));
    const unsubAuth = subscribeToAuth((currentUser, authorized) => {
      setUser(currentUser);
      setIsAdmin(authorized);
    });

    return () => {
      unsubMatches();
      unsubUpcoming();
      unsubChannels();
      unsubSettings();
      unsubAuth();
    };
  }, []);

  // Pop-Under Ad system with frequency caps per browser session
  useEffect(() => {
    if (settings?.popunderAdEnabled && settings?.popunderAdCode) {
      const alreadyTriggeredKey = 'livekhela_session_popunder_triggered';
      const isAlreadyTriggered = sessionStorage.getItem(alreadyTriggeredKey);

      if (!isAlreadyTriggered) {
        sessionStorage.setItem(alreadyTriggeredKey, 'true');
        try {
          // Parse and inject the Pop-Under script safely
          const container = document.createElement('div');
          container.innerHTML = settings.popunderAdCode;
          const scripts = container.getElementsByTagName('script');
          for (let i = 0; i < scripts.length; i++) {
            const el = document.createElement('script');
            if (scripts[i].src) {
              el.src = scripts[i].src;
            } else {
              el.textContent = scripts[i].textContent;
            }
            document.body.appendChild(el);
          }
          console.log('Pop-Under Ad Triggered and Session cap initialized.');
        } catch (e) {
          console.warn('Sandbox or formatting security blocked popunder scripts:', e);
        }
      }
    }
  }, [settings]);

  // Handle auto-shift transitions for countdown completions
  const handleUpcomingFinished = async (um: UpcomingMatch) => {
    if (isAdmin) {
      try {
        await transitionMatchToLive(um);
        console.log(`Automatic Transition: ${um.team1Name} VS ${um.team2Name} is now live!`);
      } catch (e) {
        console.error('Failed to auto-transition the upcoming match:', e);
      }
    } else {
      // For general guests, smoothly update locally in active views immediately
      setUpcoming(prev => prev.filter(item => item.id !== um.id));
      const newlyLive: Match = {
        id: 'trans_live_' + Date.now(),
        category: um.category,
        team1Name: um.team1Name,
        team1Logo: um.team1Logo,
        team2Name: um.team2Name,
        team2Logo: um.team2Logo,
        server1Url: um.server1Url,
        server2Url: um.server2Url,
        isLive: true,
        competition: um.competition,
        createdAt: Date.now()
      };
      setMatches(prev => [newlyLive, ...prev]);
    }
  };

  const handleLaunchWatch = (streamInfo: { server1Url: string; server2Url: string; server3Url?: string; server4Url?: string; title: string }) => {
    setActivePlayback(streamInfo);
    // Smooth scroll to top player stage
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminAccessTrigger = () => {
    if (isAdmin) {
      // Toggle Tab to settings if already signed in
      setActiveTab(NavigationTab.LIVE_MATCH);
      // Open settings page toggle, which is handled inline in our sidebar
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = async () => {
    setErrorMessage('');
    try {
      await loginWithGoogle();
      setShowLoginModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'বিজ্ঞপ্তি: লগিন করতে সমস্যা হয়েছে।');
    }
  };

  // Filter list of active live matches on sport category
  const filteredMatches = matches.filter((m) => {
    if (selectedSport === 'all') return true;
    return m.category === selectedSport;
  });

  const getSportActiveCount = (cat: 'all' | SportCategory) => {
    if (cat === 'all') return matches.length;
    return matches.filter(m => m.category === cat).length;
  };

  const activeSettings = settings || {
    bannerAdEnabled: false,
    bannerAdCode: '',
    popunderAdEnabled: false,
    popunderAdCode: '',
    welcomeTitle: 'লাইভখেলা-য় স্বাগতম',
    welcomeMessage: 'আপনাকে স্বাগতম আমাদের লাইভখেলা ওয়েবসাইটে! সব ধরণের লাইভ খেলা উপভোগ করতে আমাদের সাথেই থাকুন।',
    telegramUrl: 'https://t.me/livekhela_official',
    privacyPolicyUrl: 'https://livekhela.com/privacy-policy',
    termsUrl: 'https://livekhela.com/terms'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative pb-28">
      {/* Dynamic blurred glow elements */}
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-100px] right-[-100px] w-96 h-96 rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* 1. Introductory Splash launcher */}
      <AnimatePresence>
        {isSplashActive && (
          <Splash 
            onComplete={() => {
              setIsSplashActive(false);
              // Trigger welcome popup immediately after splash completes
              setIsWelcomeOpen(true);
            }} 
          />
        )}
      </AnimatePresence>

      {/* 2. Welcome Central Dialouge modal */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        welcomeTitle={activeSettings.welcomeTitle}
        welcomeMessage={activeSettings.welcomeMessage}
        telegramUrl={activeSettings.telegramUrl}
      />

      {/* Top Main Navigation Header */}
      {!isSplashActive && (
        <header className="sticky top-0 bg-slate-950/85 backdrop-blur-xl border-b border-white/5 z-30 transition-all duration-300">
          <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
            {/* Left: User account placeholder / triggers secure admin portal */}
            <button 
              id="header_admin_login_trigger"
              onClick={handleAdminAccessTrigger}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition border active:scale-90 ${
                isAdmin 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/10' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
              }`}
              title={isAdmin ? "অ্যাডমিন প্যানেল" : "অ্যাডমিন লগইন"}
            >
              {isAdmin ? (
                <Shield size={18} className="animate-pulse" />
              ) : (
                <UserIcon size={18} />
              )}
            </button>

            {/* Center: Glowing site branding */}
            <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setActiveTab(NavigationTab.LIVE_MATCH)}>
              <span className="text-xl sm:text-2xl font-sans tracking-tight font-black bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(52,211,153,0.35)] font-sans">
                LiveKhela
              </span>
            </div>

            {/* Right: Notification Alerts button */}
            <button 
              id="header_bell_btn"
              onClick={() => setShowBellNotice(true)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition active:scale-90"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>
      )}

      {/* Global Bell Notification Banner Dialog */}
      <AnimatePresence>
        {showBellNotice && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBellNotice(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-zinc-900 border border-emerald-500/30 p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl backdrop-blur-md"
            >
              <button onClick={() => setShowBellNotice(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-emerald-500/20">
                <Bell size={20} className="animate-bounce" />
              </div>
              <h3 className="text-white text-base font-extrabold mb-1 font-sans">লাইভখেলা বিজ্ঞপ্তি</h3>
              <p className="text-slate-300 text-xs sm:text-sm font-sans mb-5 leading-normal">
                সব ধরণের ফুটবল, ক্রিকেট ও লাইভ খেলাধুলার সময়সূচী ও আপডেট তাৎক্ষনিকভাবে পেতে আমাদের প্রাতিষ্ঠানিক টেলিগ্রাম গ্রুপে যুক্ত হওয়া নিশ্চিত করুন।
              </p>
              <a 
                href={activeSettings.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowBellNotice(false)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-sans font-extrabold rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-emerald-500/10"
              >
                <Send size={14} className="fill-current" />
                <span>টেলিগ্রামে জয়েন হোন</span>
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secure Admin Sign-In form overlay */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-40">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setShowLoginModal(false)} />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-zinc-900 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center text-white backdrop-blur-2xl"
            >
              <button 
                id="close_login_modal"
                onClick={() => setShowLoginModal(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition"
              >
                <X size={16} />
              </button>

              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-md">
                <Shield size={22} />
              </div>

              <h2 className="text-xl font-sans tracking-tight font-black mb-1.5">অ্যাডমিন লগইন</h2>
              <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed mb-6 px-4">
                সিস্টেম প্যারামিটার পরিবর্তন করতে ও লাইভ চ্যানেল আপডেট করতে আপনার অনুমোদিত গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন।
              </p>

              {errorMessage && (
                <div className="p-3 mb-4 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-sans flex items-center gap-1.5 text-left leading-normal">
                  <AlertTriangle className="shrink-0" size={14} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                id="google_signin_btn"
                onClick={handleLoginSubmit}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-950 font-sans font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition hover:shadow-lg active:scale-95 shadow-md"
              >
                <Chrome size={18} />
                <span>গুগল দিয়ে সাইন-ইন করুন</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container Deck */}
      {!isSplashActive && (
        <main className="max-w-4xl mx-auto px-4 mt-4 select-none relative z-15">
          
          {/* Active smart video player stage */}
          {activePlayback && (
            <motion.section 
              id="active_player_stage"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <VideoPlayer
                server1Url={activePlayback.server1Url}
                server2Url={activePlayback.server2Url}
                server3Url={activePlayback.server3Url}
                server4Url={activePlayback.server4Url}
                title={activePlayback.title}
                onClose={() => setActivePlayback(null)}
              />
            </motion.section>
          )}

          {/* Sibling Admin Dashboard controls for logged in administrators */}
          {isAdmin && (
            <section id="admin_control_rail" className="mb-8">
              <AdminPanel 
                currentSettings={activeSettings}
                activeMatches={matches}
                upcomingMatches={upcoming}
                channels={channels}
                onClose={() => setActiveTab(NavigationTab.LIVE_MATCH)}
              />
            </section>
          )}

          {/* Public Views rendering */}
          {!isAdmin && (
            <div>
              {/* Live Match sport category Horizontal Navigation carousel */}
              {activeTab === NavigationTab.LIVE_MATCH && (
                <div 
                  id="category_scroller"
                  className="flex overflow-x-auto gap-2.5 pb-2.5 mb-6 scrollbar-none snap-x"
                >
                  {/* Category: ALL */}
                  <button
                    id="cat_btn_all"
                    onClick={() => setSelectedSport('all')}
                    className={`px-4 py-2.5 rounded-full border transition-all duration-300 font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 snap-start active:scale-95 ${
                      selectedSport === 'all'
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {/* Whistle inline SVG */}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M18 10h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
                      <path d="M14 6H5a4 4 0 0 0 0 8h9a4 4 0 0 0 4-4V6z" />
                      <path d="M9 14h1v3H9z" />
                    </svg>
                    <span>সব খেলা ({getSportActiveCount('all')})</span>
                  </button>

                  {/* Category: Cricket */}
                  <button
                    id="cat_btn_cricket"
                    onClick={() => setSelectedSport('cricket')}
                    className={`px-4 py-2.5 rounded-full border transition-all duration-300 font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 snap-start active:scale-95 ${
                      selectedSport === 'cricket'
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {/* Cricket Bat inline SVG */}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M18 3c.6-.6 1.4-.6 2 0s.6 1.4 0 2l-9.5 9.5-3-3z" />
                      <path d="M6 16l-3.5 3.5c-.7.7-.7 1.8 0 2.5s1.8.7 2.5 0L8.5 18.5" />
                      <circle cx="17.5" cy="17.5" r="2.5" />
                    </svg>
                    <span>ক্রিকেট ({getSportActiveCount('cricket')})</span>
                  </button>

                  {/* Category: Football */}
                  <button
                    id="cat_btn_football"
                    onClick={() => setSelectedSport('football')}
                    className={`px-4 py-2.5 rounded-full border transition-all duration-300 font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 snap-start active:scale-95 ${
                      selectedSport === 'football'
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {/* Soccer Ball inline SVG */}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m12 2 3.5 4.5L12 11 8.5 6.5Z" />
                      <path d="m12 22 3.5-4.5L12 13l-3.5 4.5Z" />
                      <path d="m2 12 4.5-3.5L11 12l-4.5 3.5Z" />
                      <path d="m22 12-4.5-3.5L13 12l4.5 3.5Z" />
                    </svg>
                    <span>ফুটবল ({getSportActiveCount('football')})</span>
                  </button>

                  {/* Category: Others */}
                  <button
                    id="cat_btn_others"
                    onClick={() => setSelectedSport('others')}
                    className={`px-4 py-2.5 rounded-full border transition-all duration-300 font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 snap-start active:scale-95 ${
                      selectedSport === 'others'
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {/* Physical Person SVG */}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="5" r="2" />
                      <path d="m18 22-3-8h-4l-3 8" />
                      <path d="m4 10 5-1 3 3h4l5-1" />
                    </svg>
                    <span>অন্যান্য ({getSportActiveCount('others')})</span>
                  </button>
                </div>
              )}

              {/* View layout rendering based on Navigation tab triggers */}
              <div id="deck_grid_view_container" className="min-h-[200px]">
                
                 {/* 1. Live sports match listings */}
                 {activeTab === NavigationTab.LIVE_MATCH && (
                   <div className="flex flex-col gap-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {filteredMatches.length === 0 ? (
                         <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center justify-center font-sans">
                           <Radio size={36} className="text-slate-700 animate-pulse mb-3" />
                           <span className="text-sm font-bold text-slate-400">এই মুহূর্তে কোন সচল ম্যাচ সম্প্রচার হচ্ছে না।</span>
                           <span className="text-xs text-slate-500 mt-1">দয়া করে পরবর্তীতে খেলা শুরুর নির্দিষ্ট সময়ে চেক করুন।</span>
                         </div>
                       ) : (
                         filteredMatches.map((m) => (
                           <MatchCard
                             key={m.id}
                             match={m}
                             onWatch={(activeItem) => handleLaunchWatch({
                               server1Url: activeItem.server1Url,
                               server2Url: activeItem.server2Url,
                               server3Url: activeItem.server3Url,
                               server4Url: activeItem.server4Url,
                               title: `${activeItem.team1Name} বনাম ${activeItem.team2Name}`
                             })}
                           />
                         ))
                       )}
                     </div>

                     {/* Premium Ad banner slot sitting organically below the matches */}
                     <BannerAd 
                       code={activeSettings.bannerAdCode} 
                       enabled={activeSettings.bannerAdEnabled} 
                     />
                   </div>
                 )}

                 {/* 2. IPTV Television Stations */}
                 {activeTab === NavigationTab.CATEGORIES && (
                   <div className="flex flex-col gap-8">
                     {channels.length === 0 ? (
                       <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center font-sans">
                         <Tv size={36} className="text-slate-700 mb-3" />
                         <span className="text-sm font-bold text-slate-400">কোন লাইভ টিভি চ্যানেল সম্প্রচার হচ্ছে না।</span>
                         <span className="text-xs text-slate-500 mt-1">অ্যাডমিন প্যানেল থেকে চ্যানেল যুক্ত হলে এখানে দেখতে পাবেন।</span>
                       </div>
                     ) : (
                       (() => {
                         const groups: { [key: string]: Channel[] } = {};
                         channels.forEach(ch => {
                           const cat = ch.category || 'বাংলাদেশ স্পোর্টস';
                           if (!groups[cat]) groups[cat] = [];
                           groups[cat].push(ch);
                         });

                         const sortedCategories = Object.keys(groups).sort((a, b) => {
                           const order: { [key: string]: number } = {
                             'বাংলাদেশ স্পোর্টস': 1,
                             'বাংলাদেশ নিউজ': 2,
                             'ইন্টারন্যাশনাল': 3,
                             'অন্যান্য': 4
                           };
                           const orderA = order[a] || 99;
                           const orderB = order[b] || 99;
                           if (orderA !== orderB) return orderA - orderB;
                           return a.localeCompare(b);
                         });

                         return sortedCategories.map(cat => (
                           <div key={cat} className="flex flex-col gap-4">
                             <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                               <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                               <h4 className="text-white text-sm sm:text-base font-extrabold font-sans tracking-tight">
                                 {cat} ({groups[cat].length})
                               </h4>
                             </div>

                             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 font-sans">
                               {groups[cat].map((ch) => (
                                 <ChannelCard
                                   key={ch.id}
                                   channel={ch}
                                   onWatch={(activeCh) => handleLaunchWatch({
                                     server1Url: activeCh.streamUrl1,
                                     server2Url: activeCh.streamUrl2,
                                     title: activeCh.name
                                   })}
                                 />
                               ))}
                             </div>
                           </div>
                         ));
                       })()
                     )}

                     {/* Premium Ad banner slot sitting organically below the TV channels */}
                     <BannerAd 
                       code={activeSettings.bannerAdCode} 
                       enabled={activeSettings.bannerAdEnabled} 
                     />
                   </div>
                 )}

                 {/* 3. Upcoming schedule matches list */}
                 {activeTab === NavigationTab.UPCOMING && (
                   <div className="flex flex-col gap-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {upcoming.length === 0 ? (
                         <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center justify-center font-sans">
                           <Clock size={36} className="text-slate-700 mb-3" />
                           <span className="text-sm font-bold text-slate-400">নিকট ভবিষ্যতে কোন ম্যাচ সিডিউল করা নাই।</span>
                           <span className="text-xs text-slate-500 mt-1">নতুন ম্যাচের সিডিউল আসার জন্য লাইভখেলার সাথে থাকুন।</span>
                         </div>
                       ) : (
                         upcoming.map((um) => (
                           <UpcomingCard
                             key={um.id}
                             upcoming={um}
                             isAdmin={isAdmin}
                             onCountdownCompleted={handleUpcomingFinished}
                           />
                         ))
                       )}
                     </div>

                     <BannerAd 
                       code={activeSettings.bannerAdCode} 
                       enabled={activeSettings.bannerAdEnabled} 
                     />
                   </div>
                 )}

              </div>
            </div>
          )}

        </main>
      )}



      {/* 3. Floating Bottom Navigation Glassmorphic bar */}
      {!isSplashActive && !isAdmin && (
        <nav 
          id="livekhela_bottom_navigation"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-zinc-900/65 border border-white/10 rounded-2xl p-2 flex items-center justify-around backdrop-blur-2xl shadow-2xl z-30 select-none transition-all duration-300"
        >
          {/* Tab 1: Live Matches */}
          <button
            id="nav_tab_live"
            onClick={() => {
              setActiveTab(NavigationTab.LIVE_MATCH);
              setSelectedSport('all'); // Reset filter
            }}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-3 rounded-xl transition-all duration-300 shrink-0 select-none ${
              activeTab === NavigationTab.LIVE_MATCH 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {/* Soccer Ball icon */}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m12 2 3.5 4.5L12 11 8.5 6.5Z" />
              <path d="m12 22 3.5-4.5L12 13l-3.5 4.5Z" />
              <path d="m2 12 4.5-3.5L11 12l-4.5 3.5Z" />
              <path d="m22 12-4.5-3.5L13 12l4.5 3.5Z" />
            </svg>
            <span className="text-[10px] sm:text-xs font-sans font-bold">লাইভ ভিডিও</span>
          </button>

          {/* Tab 2: Categories IPTV channels */}
          <button
            id="nav_tab_categories"
            onClick={() => setActiveTab(NavigationTab.CATEGORIES)}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-4 rounded-xl transition-all duration-300 shrink-0 select-none ${
              activeTab === NavigationTab.CATEGORIES 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv size={18} />
            <span className="text-[10px] sm:text-xs font-sans font-bold">টিভি চ্যানেল</span>
          </button>

          {/* Tab 3: Upcoming matches */}
          <button
            id="nav_tab_upcoming"
            onClick={() => setActiveTab(NavigationTab.UPCOMING)}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-4 rounded-xl transition-all duration-300 shrink-0 select-none ${
              activeTab === NavigationTab.UPCOMING 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={18} />
            <span className="text-[10px] sm:text-xs font-sans font-bold">সময়সূচী</span>
          </button>
        </nav>
      )}
    </div>
  );
}
