import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Tv, 
  Calendar, 
  Radio, 
  CheckCircle, 
  LogOut, 
  ShieldCheck, 
  Globe, 
  Info, 
  AlertTriangle, 
  Code,
  Chrome,
  Pencil
} from 'lucide-react';
import { Match, UpcomingMatch, Channel, GlobalSettings, SportCategory } from '../types';
import { 
  addMatch, 
  deleteMatch, 
  addUpcomingMatch, 
  deleteUpcomingMatch, 
  addChannel, 
  deleteChannel, 
  updateChannel,
  saveGlobalSettings,
  logoutUser,
  AUTHORIZED_ADMIN
} from '../lib/store';
import { isFirebaseConfigured } from '../lib/firebase';

interface AdminPanelProps {
  currentSettings: GlobalSettings;
  activeMatches: Match[];
  upcomingMatches: UpcomingMatch[];
  channels: Channel[];
  onClose: () => void;
}

type AdminSubTab = 'live-matches' | 'scheduled' | 'iptv-channels' | 'ads-settings';

export default function AdminPanel({ 
  currentSettings, 
  activeMatches, 
  upcomingMatches, 
  channels, 
  onClose 
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('live-matches');

  // Live Match Fields
  const [liveCat, setLiveCat] = useState<SportCategory>('cricket');
  const [team1Name, setTeam1Name] = useState('');
  const [team1Logo, setTeam1Logo] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team2Logo, setTeam2Logo] = useState('');
  const [server1Url, setServer1Url] = useState('');
  const [server2Url, setServer2Url] = useState('');
  const [server3Url, setServer3Url] = useState('');
  const [server4Url, setServer4Url] = useState('');
  const [competition, setCompetition] = useState('');

  // Scheduled Match Fields
  const [upCat, setUpCat] = useState<SportCategory>('cricket');
  const [upTeam1Name, setUpTeam1Name] = useState('');
  const [upTeam1Logo, setUpTeam1Logo] = useState('');
  const [upTeam2Name, setUpTeam2Name] = useState('');
  const [upTeam2Logo, setUpTeam2Logo] = useState('');
  const [upServer1, setUpServer1] = useState('');
  const [upServer2, setUpServer2] = useState('');
  const [upComp, setUpComp] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // IPTV Fields
  const [channelName, setChannelName] = useState('');
  const [channelLogo, setChannelLogo] = useState('');
  const [channelStream1, setChannelStream1] = useState('');
  const [channelStream2, setChannelStream2] = useState('');
  const [channelCategory, setChannelCategory] = useState('বাংলাদেশ স্পোর্টস');
  const [customCategory, setCustomCategory] = useState('');

  // Ad Networks & Global Policy Settings Fields
  const [bannerAdEnabled, setBannerAdEnabled] = useState(currentSettings.bannerAdEnabled);
  const [bannerAdCode, setBannerAdCode] = useState(currentSettings.bannerAdCode);
  const [popunderAdEnabled, setPopunderAdEnabled] = useState(currentSettings.popunderAdEnabled);
  const [popunderAdCode, setPopunderAdCode] = useState(currentSettings.popunderAdCode);
  const [welcomeTitle, setWelcomeTitle] = useState(currentSettings.welcomeTitle);
  const [welcomeMessage, setWelcomeMessage] = useState(currentSettings.welcomeMessage);
  const [telegramUrl, setTelegramUrl] = useState(currentSettings.telegramUrl);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(currentSettings.privacyPolicyUrl);
  const [termsUrl, setTermsUrl] = useState(currentSettings.termsUrl);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Submit Matches
  const handleAddLiveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1Name || !team2Name || !server1Url) {
      triggerNotification('অনুগ্রহ করে দলের নাম এবং সার্ভার ১ এর লিঙ্ক পূরণ করুন।', 'error');
      return;
    }

    try {
      await addMatch({
        category: liveCat,
        team1Name,
        team1Logo,
        team2Name,
        team2Logo,
        server1Url,
        server2Url,
        server3Url,
        server4Url,
        isLive: true,
        competition
      });
      triggerNotification('নতুন লাইভ ম্যাচ সফলভাবে যোগ হয়েছে!');
      // Reset
      setTeam1Name('');
      setTeam1Logo('');
      setTeam2Name('');
      setTeam2Logo('');
      setServer1Url('');
      setServer2Url('');
      setServer3Url('');
      setServer4Url('');
      setCompetition('');
    } catch (err: any) {
      triggerNotification('যোগ করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  // Schedule Match
  const handleAddUpcomingMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upTeam1Name || !upTeam2Name || !scheduledDateTime) {
      triggerNotification('অনুগ্রহ করে দলের নাম ও ম্যাচের সময়সূচী পূরণ করুন।', 'error');
      return;
    }

    const scheduledTimeMs = new Date(scheduledDateTime).getTime();
    if (isNaN(scheduledTimeMs)) {
      triggerNotification('অকার্যকর তারিখ ও সময় ফরম্যাট।', 'error');
      return;
    }

    try {
      await addUpcomingMatch({
        category: upCat,
        team1Name: upTeam1Name,
        team1Logo: upTeam1Logo,
        team2Name: upTeam2Name,
        team2Logo: upTeam2Logo,
        server1Url: upServer1,
        server2Url: upServer2,
        competition: upComp,
        scheduledTime: scheduledTimeMs
      });
      triggerNotification('আসন্ন ম্যাচ সফলভাবে সিডিউল করা হয়েছে!');
      setUpTeam1Name('');
      setUpTeam1Logo('');
      setUpTeam2Name('');
      setUpTeam2Logo('');
      setUpServer1('');
      setUpServer2('');
      setUpComp('');
      setScheduledDateTime('');
    } catch (err: any) {
      triggerNotification('সিডিউল করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  // Add TV Channel
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName || !channelLogo || !channelStream1) {
      triggerNotification('অনুগ্রহ করে চ্যানেলের নাম, লোগো লিঙ্ক ও স্ট্রিম লিঙ্ক পূরণ করুন।', 'error');
      return;
    }

    const finalCategory = channelCategory === 'কাস্টম' ? (customCategory.trim() || 'অন্যান্য') : channelCategory;

    try {
      await addChannel({
        name: channelName,
        logoUrl: channelLogo,
        streamUrl1: channelStream1,
        streamUrl2: channelStream2,
        category: finalCategory
      });
      triggerNotification('নতুন টিভি চ্যানেল সফলভাবে যোগ হয়েছে!');
      setChannelName('');
      setChannelLogo('');
      setChannelStream1('');
      setChannelStream2('');
      setCustomCategory('');
    } catch (err: any) {
      triggerNotification('চ্যানেল যোগ করতে ত্রুটি হয়েছে: ' + err.message, 'error');
    }
  };

  // Editing TV Channel states
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editChName, setEditChName] = useState('');
  const [editChLogo, setEditChLogo] = useState('');
  const [editChStream1, setEditChStream1] = useState('');
  const [editChStream2, setEditChStream2] = useState('');
  const [editChCategory, setEditChCategory] = useState('বাংলাদেশ স্পোর্টস');

  const startEditingChannel = (ch: Channel) => {
    setEditingChannel(ch);
    setEditChName(ch.name);
    setEditChLogo(ch.logoUrl);
    setEditChStream1(ch.streamUrl1);
    setEditChStream2(ch.streamUrl2);
    setEditChCategory(ch.category || 'বাংলাদেশ স্পোর্টস');
  };

  const handleEditChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    if (!editChName || !editChLogo || !editChStream1) {
      triggerNotification('অনুগ্রহ করে চ্যানেলের নাম, লোগো লিঙ্ক ও স্ট্রিম লিঙ্ক পূরণ করুন।', 'error');
      return;
    }
    try {
      await updateChannel(editingChannel.id, {
        name: editChName,
        logoUrl: editChLogo,
        streamUrl1: editChStream1,
        streamUrl2: editChStream2,
        category: editChCategory
      });
      triggerNotification('টিভি চ্যানেল সফলভাবে আপডেট হয়েছে!');
      setEditingChannel(null);
    } catch (err: any) {
      triggerNotification('আপডেট করতে ত্রুটি হয়েছে: ' + err.message, 'error');
    }
  };

  // Save Config Global Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveGlobalSettings({
        bannerAdEnabled,
        bannerAdCode,
        popunderAdEnabled,
        popunderAdCode,
        welcomeTitle,
        welcomeMessage,
        telegramUrl,
        privacyPolicyUrl,
        termsUrl
      });
      triggerNotification('সিস্টেম ও বিজ্ঞাপন সেটিংস সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      triggerNotification('সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  return (
    <div 
      id="khelaghor_admin_dashboard"
      className="w-full bg-zinc-900 border border-emerald-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur-2xl text-white select-none relative overflow-hidden shadow-2xl"
    >
      {/* Visual back-lights */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-sans tracking-tight font-black flex items-center gap-1.5 uppercase text-white">
              খেলাঘর অ্যাডমিন প্যানেল 
            </h2>
            <p className="text-slate-400 text-xs font-sans mt-0.5">
               সহজেই লাইভ ম্যাচ, বিজ্ঞাপন ও সিস্টেম কনফিগারেশন নিয়ন্ত্রণ করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification status bar banner */}
          {!isFirebaseConfigured && (
            <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono font-medium flex items-center gap-1">
              <Info size={12} />
              লোকাল ডেমো মোড
            </span>
          )}

          <button
            onClick={logoutUser}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-500 text-xs font-sans font-semibold rounded-lg flex items-center gap-1.5 transition active:scale-95"
          >
            <LogOut size={14} />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {notification && (
        <div 
          className={`px-4 py-3 rounded-lg border mb-5 flex items-center gap-2 text-sm font-sans animate-fade-in ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <CheckCircle size={16} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sub-navigation categories */}
      <div className="flex overflow-x-auto gap-1 p-1 bg-black/30 rounded-xl border border-white/5 mb-6 backdrop-blur-md relative z-10 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('live-matches')}
          className={`px-4 py-2 text-xs sm:text-sm font-sans font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeSubTab === 'live-matches' 
              ? 'bg-emerald-500 text-slate-950 font-bold' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio size={14} />
          <span>লাইভ ম্যাচ ({activeMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scheduled')}
          className={`px-4 py-2 text-xs sm:text-sm font-sans font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeSubTab === 'scheduled' 
              ? 'bg-emerald-500 text-slate-950 font-bold' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar size={14} />
          <span>আসন্ন ম্যাচ ({upcomingMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('iptv-channels')}
          className={`px-4 py-2 text-xs sm:text-sm font-sans font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeSubTab === 'iptv-channels' 
              ? 'bg-emerald-500 text-slate-950 font-bold' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Tv size={14} />
          <span>টিভি চ্যানেল ({channels.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ads-settings')}
          className={`px-4 py-2 text-xs sm:text-sm font-sans font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeSubTab === 'ads-settings' 
              ? 'bg-emerald-500 text-slate-950 font-bold' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={14} />
          <span>প্লাটফর্ম সেটিংস </span>
        </button>
      </div>

      {/* Main Tab forms */}
      <div className="relative z-10">
        
        {/* TAB 1: Live Sports Matches Creation */}
        {activeSubTab === 'live-matches' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Left */}
            <form onSubmit={handleAddLiveMatch} className="lg:col-span-5 bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2 mb-1">
                <Plus size={16} />
                <span>ম্যাচ যোগ করুন</span>
              </h3>

              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400">ক্যাটাগরি নির্ধারণ করুন</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cricket', 'football', 'others'] as SportCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLiveCat(cat)}
                      className={`py-2 text-xs font-sans rounded-lg border transition ${
                        liveCat === cat 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' 
                          : 'border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {cat === 'cricket' ? 'ক্রিকেট' : cat === 'football' ? 'ফুটবল' : 'অন্যান্য'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tournament Competition tag */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">টুর্নামেন্ট / কম্পিটিশন নাম (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="উদা: FIFA World Cup, IPL"
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
                />
              </div>

              {/* Symmetric Teams Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">দল ১ (নাম)</label>
                  <input
                    type="text"
                    required
                    placeholder="উদা: BAN"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                  <input
                    type="url"
                    placeholder="লোগো লিংক (Web URL)"
                    value={team1Logo}
                    onChange={(e) => setTeam1Logo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">দল ২ (নাম)</label>
                  <input
                    type="text"
                    required
                    placeholder="উদা: NZ"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                  <input
                    type="url"
                    placeholder="লোগো লিংক (Web URL)"
                    value={team2Logo}
                    onChange={(e) => setTeam2Logo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                </div>
              </div>

              {/* Streaming Links */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">সার্ভার ১ স্ট্রিম লিঙ্ক (.m3u8 URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/live/stream1.m3u8"
                    value={server1Url}
                    onChange={(e) => setServer1Url(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">সার্ভার ২ স্ট্রিম লিঙ্ক (.m3u8 URL - ব্যাকআপ)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/live/stream2.m3u8"
                    value={server2Url}
                    onChange={(e) => setServer2Url(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">সার্ভার ৩ স্ট্রিম লিঙ্ক (.m3u8 URL - ব্যাকআপ)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/live/stream3.m3u8"
                    value={server3Url}
                    onChange={(e) => setServer3Url(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">সার্ভার ৪ স্ট্রিম লিঙ্ক (.m3u8 URL - ব্যাকআপ)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/live/stream4.m3u8"
                    value={server4Url}
                    onChange={(e) => setServer4Url(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-sm rounded-xl active:scale-95 transition"
              >
                লাইভ সম্প্রচার চালু করুন
              </button>
            </form>

            {/* List Right */}
            <div className="lg:col-span-7 bg-black/20 border border-white/5 p-4 rounded-xl">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 border-b border-white/5 pb-2 mb-4">
                 বর্তমানে সম্প্রচারিত ম্যাচ ({activeMatches.length})
              </h3>

              {activeMatches.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center font-sans">
                  <Radio size={28} className="text-slate-600 mb-2 animate-pulse" />
                  <span>কোন সচল ম্যাচ ব্রডকাস্ট হচ্ছে না।</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto scrollbar-none pr-1">
                  {activeMatches.map(m => (
                    <div 
                      key={m.id} 
                      className="p-3 bg-zinc-950/40 rounded-xl border border-white/5 flex items-center justify-between font-sans text-sm hover:border-emerald-500/20 transition"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="font-bold uppercase text-white tracking-tight">{m.team1Name} VS {m.team2Name}</span>
                        </div>
                        <span className="text-slate-400 font-medium text-xs">
                          ক্যাটাগরি: {m.category === 'cricket' ? 'ক্রিকেট' : m.category === 'football' ? 'ফুটবল' : 'অন্যান্য'} | কম্পিটিশন: {m.competition || 'N/A'}
                        </span>
                      </div>

                      {/* One-click Finish Match Button */}
                      <button
                        onClick={() => deleteMatch(m.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg border border-rose-500/20 transition duration-200"
                        title="Finish Match"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Upcoming matches queue */}
        {activeSubTab === 'scheduled' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Left */}
            <form onSubmit={handleAddUpcomingMatch} className="lg:col-span-5 bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2 mb-1">
                <Plus size={16} />
                <span>ম্যাচ রিলিজ সিডিউল করুন</span>
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400">ক্যাটাগরি</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cricket', 'football', 'others'] as SportCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setUpCat(cat)}
                      className={`py-2 text-xs font-sans rounded-lg border transition ${
                        upCat === cat 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300' 
                          : 'border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {cat === 'cricket' ? 'ক্রিকেট' : cat === 'football' ? 'ফুটবল' : 'অন্যান্য'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symmetrical team structures */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">দল ১ (নাম)</label>
                  <input
                    type="text"
                    required
                    placeholder="উদা: IND"
                    value={upTeam1Name}
                    onChange={(e) => setUpTeam1Name(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="লোগো লিংক"
                    value={upTeam1Logo}
                    onChange={(e) => setUpTeam1Logo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">দল ২ (নাম)</label>
                  <input
                    type="text"
                    required
                    placeholder="উদা: PAK"
                    value={upTeam2Name}
                    onChange={(e) => setUpTeam2Name(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="লোগো লিংক"
                    value={upTeam2Logo}
                    onChange={(e) => setUpTeam2Logo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              {/* Release datetime input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400">কখন লাইভ শুরু হবে?</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
                <span className="text-[10px] text-slate-500 leading-normal font-sans">
                  *কাউন্টডাউন শূন্যে পৌঁছালে ম্যাচটি স্বয়ংক্রিয়ভাবে হোমপেজে লাইভ সেকশানে চলে যাবে।
                </span>
              </div>

              {/* Additional optional fields */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">কম্পিটিশন ও অন্যান্য লিঙ্ক (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="উদা: T20 World Cup"
                  value={upComp}
                  onChange={(e) => setUpComp(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <input
                    type="url"
                    placeholder="স্ট্রিম ১"
                    value={upServer1}
                    onChange={(e) => setUpServer1(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-305 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="স্ট্রিম ২"
                    value={upServer2}
                    onChange={(e) => setUpServer2(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-305 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-sm rounded-xl active:scale-95 transition"
              >
                 সিডিউল ভুক্ত করুন
              </button>
            </form>

            {/* List Right */}
            <div className="lg:col-span-7 bg-black/20 border border-white/5 p-4 rounded-xl">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 border-b border-white/5 pb-2 mb-4">
                 আসন্ন ম্যাচের তালিকা ({upcomingMatches.length})
              </h3>

              {upcomingMatches.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center font-sans">
                  <Calendar size={28} className="text-slate-600 mb-2" />
                  <span>কোন আসন্ন ম্যাচ সিডিউল করা নেই।</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto scrollbar-none pr-1">
                  {upcomingMatches.map(um => (
                    <div 
                      key={um.id} 
                      className="p-3 bg-zinc-950/40 rounded-xl border border-white/5 flex items-center justify-between font-sans text-sm hover:border-emerald-500/20 transition"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold uppercase text-white tracking-tight">{um.team1Name} VS {um.team2Name}</span>
                        <span className="text-slate-400 text-xs font-medium">
                          সময়: {new Date(um.scheduledTime).toLocaleString('bn-BD')} | {um.competition || 'N/A'}
                        </span>
                      </div>

                      <button
                        onClick={() => deleteUpcomingMatch(um.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg border border-rose-500/20 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Linear TV IPTV Channels */}
        {activeSubTab === 'iptv-channels' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Left */}
            <form onSubmit={handleAddChannel} className="lg:col-span-12 xl:col-span-5 bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2 mb-1">
                <Plus size={16} />
                <span>চ্যানেল যোগ করুন (IPTV)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">চ্যানেলের নাম</label>
                  <input
                    type="text"
                    required
                    placeholder="উদা: T Sports Live"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">চ্যানেল লোগো লিঙ্ক (Web URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/stream/logo.png"
                    value={channelLogo}
                    onChange={(e) => setChannelLogo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              {/* Dynamic Channel Category System Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">চ্যানেল ক্যাটাগরি</label>
                  <select
                    value={channelCategory}
                    onChange={(e) => setChannelCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                  >
                    <option value="বাংলাদেশ স্পোর্টস" className="bg-slate-950 text-white">বাংলাদেশ স্পোর্টস (Bangladesh Sports)</option>
                    <option value="বাংলাদেশ নিউজ" className="bg-slate-950 text-white">বাংলাদেশ নিউজ (Bangladesh News)</option>
                    <option value="ইন্টারন্যাশনাল" className="bg-slate-950 text-white">ইন্টারন্যাশনাল (International)</option>
                    <option value="অন্যান্য" className="bg-slate-950 text-white">অন্যান্য (Others)</option>
                    <option value="কাস্টম" className="bg-slate-950 text-emerald-400 font-bold">কাস্টম ক্যাটাগরি (Type Custom...)</option>
                  </select>
                </div>

                {channelCategory === 'কাস্টম' && (
                  <div className="flex flex-col gap-1 animate-fadeIn">
                    <label className="text-xs text-slate-400">কাস্টম ক্যাটাগরি নাম লিখুন</label>
                    <input
                      type="text"
                      required
                      placeholder="উদা: বিনোদন বা লাইভ মুভি"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">স্ট্রিম ইউআরএল ১ (.m3u8)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/livetv.m3u8"
                    value={channelStream1}
                    onChange={(e) => setChannelStream1(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">স্ট্রিম ইউআরএল ২ (ব্যাকআপ .m3u8)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/livetv_2.m3u8"
                    value={channelStream2}
                    onChange={(e) => setChannelStream2(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-sm rounded-xl active:scale-95 transition"
              >
                নতুন টিভি চ্যানেল ব্রডকাস্ট করুন
              </button>
            </form>

            {/* List Right */}
            <div className="lg:col-span-12 xl:col-span-7 bg-black/20 border border-white/5 p-4 rounded-xl">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 border-b border-white/5 pb-2 mb-4">
                 সচল আইপিটিভি চ্যানেলের তালিকা ({channels.length})
              </h3>

              {channels.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center font-sans">
                  <Tv size={28} className="text-slate-600 mb-2 animate-pulse" />
                  <span>কোন লাইভ IPTV চ্যানেল যোগ করা হয়নি।</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto scrollbar-none pr-1">
                  {channels.map(ch => (
                    <div 
                      key={ch.id} 
                      className="p-3 bg-zinc-950/40 rounded-xl border border-white/5 flex items-center justify-between font-sans text-sm hover:border-emerald-500/20 transition"
                    >
                      <div className="flex items-center gap-3">
                        {ch.logoUrl && (
                          <div className="w-8 h-8 rounded bg-zinc-900 border border-white/5 flex items-center justify-center p-1 overflow-hidden">
                            <img src={ch.logoUrl} alt={ch.name} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-extrabold text-white tracking-tight">{ch.name}</span>
                          <span className="text-[10px] text-emerald-400 font-bold tracking-wider">{ch.category || 'বাংলাদেশ স্পোর্টস'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEditingChannel(ch)}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg border border-emerald-500/20 transition"
                          title="চ্যানেল পরিবর্তন করুন"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteChannel(ch.id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg border border-rose-500/20 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TV Channel editing popup modal overlay */}
            {editingChannel && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h3 className="text-sm font-bold text-emerald-400 font-sans tracking-tight uppercase flex items-center gap-2">
                      <Tv size={16} />
                      <span>টিভি চ্যানেল এডিট করুন</span>
                    </h3>
                    <button
                      onClick={() => setEditingChannel(null)}
                      className="text-slate-400 hover:text-white transition font-bold font-sans text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
                    >
                      বাতিল
                    </button>
                  </div>

                  <form onSubmit={handleEditChannelSubmit} className="flex flex-col gap-4 font-sans text-xs sm:text-sm">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">চ্যানেলের নাম (Channel Name)</label>
                      <input
                        type="text"
                        required
                        value={editChName}
                        onChange={(e) => setEditChName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">লোগো লিংক (Logo Web URL)</label>
                      <input
                        type="url"
                        required
                        value={editChLogo}
                        onChange={(e) => setEditChLogo(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-black/45 rounded-lg border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">ক্যাটাগরি (Category)</label>
                      <select
                        value={editChCategory}
                        onChange={(e) => setEditChCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-black/45 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition"
                      >
                        <option value="বাংলাদেশ স্পোর্টস">বাংলাদেশ স্পোর্টস</option>
                        <option value="বাংলাদেশ নিউজ">বাংলাদেশ নিউজ</option>
                        <option value="ইন্টারন্যাশনাল ক্রিকেট">ইন্টারন্যাশনাল ক্রিকেট</option>
                        <option value="ইন্টারন্যাশনাল নিউজ">ইন্টারন্যাশনাল নিউজ</option>
                        <option value="বিনোদন ও অন্যান্য">বিনোদন ও অন্যান্য</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">সার্ভার ১ স্ট্রিম লিঙ্ক (.m3u8 URL)</label>
                      <input
                        type="url"
                        required
                        value={editChStream1}
                        onChange={(e) => setEditChStream1(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-black/45 rounded-lg border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">সার্ভার ২ স্ট্রিম লিঙ্ক (ঐচ্ছিক ব্যাকআপ)</label>
                      <input
                        type="url"
                        value={editChStream2}
                        onChange={(e) => setEditChStream2(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-black/45 rounded-lg border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono"
                      />
                    </div>

                    <div className="flex gap-2.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setEditingChannel(null)}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl active:scale-95 transition"
                      >
                        পরিবর্তন সংরক্ষণ করুন
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Adsterra Monetization controls & Global Policies */}
        {activeSubTab === 'ads-settings' && (
          <form onSubmit={handleSaveSettings} className="bg-black/20 border border-white/5 p-4 sm:p-6 rounded-xl flex flex-col gap-6 font-sans">
            <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Code size={16} />
              <span>মুদ্রাকীকরন ও বিজ্ঞাপন সেটিংস (Monetization Hub)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Adsterra Banner block */}
              <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-white">১. ব্যানার বিজ্ঞাপন (Banner Ad 728x90)</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">লাইভ স্ট্রিম প্লেয়ারের নিচে প্রদর্শিত হয়।</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={bannerAdEnabled}
                      onChange={(e) => setBannerAdEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">ব্যানার এড স্ক্রিপ্ট কোড (HTML/JS)</label>
                  <textarea
                    rows={4}
                    value={bannerAdCode}
                    onChange={(e) => setBannerAdCode(e.target.value)}
                    placeholder='উদা: <script type="text/javascript" src="https://example.com/banner.js"></script>'
                    className="w-full p-2.5 bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
                  />
                </div>
              </div>

              {/* Popup network script */}
              <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-white">২. পপ-আন্ডার সাইট বিজ্ঞাপন (Pop-Under Ads)</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">ভিজিটর ক্লিক করলে অন্য উইন্ডোতে খোলে (একবার প্রতি সেশান)।</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={popunderAdEnabled}
                      onChange={(e) => setPopunderAdEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">পপ-আন্ডার স্ক্রিপ্ট কোড (HTML/JS)</label>
                  <textarea
                    rows={4}
                    value={popunderAdCode}
                    onChange={(e) => setPopunderAdCode(e.target.value)}
                    placeholder='উদা: <script type="text/javascript">var ad_id = "12345";</script>'
                    className="w-full p-2.5 bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Global parameters / Welcome dialogues / Telegram */}
            <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2 mt-4">
              <Globe size={16} />
              <span>স্বাগতম পপ-আপ ও সোশাল কনফিগারেশন</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telegram Channel URL */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">টেলিগ্রাম চ্যানেল ইনভাইট লিঙ্ক ({telegramUrl ? 'Active' : 'Empty'})</label>
                <input
                  type="url"
                  placeholder="https://t.me/your_telegram"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Welcome Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">স্বাগতম নোটিশের শিরোনাম</label>
                <input
                  type="text"
                  placeholder="খেলাঘর-এ স্বাগতম"
                  value={welcomeTitle}
                  onChange={(e) => setWelcomeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Welcome pop-up messages */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-slate-400">স্বাগতম নোটিশের বিস্তারিত বার্তা</label>
                <textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full p-3 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Privacy and terms policy links */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">প্রাইভেসি পলিসি লিঙ্ক (Privacy Policy URL)</label>
                <input
                  type="url"
                  placeholder="https://yourdomain.com/privacy"
                  value={privacyPolicyUrl}
                  onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">সার্ভিস শর্তাবলী লিঙ্ক (Terms & Conditions URL)</label>
                <input
                  type="url"
                  placeholder="https://yourdomain.com/terms"
                  value={termsUrl}
                  onChange={(e) => setTermsUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-extrabold text-sm rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 transition"
            >
              কনফিগারেশন সংরক্ষণ করুন
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
