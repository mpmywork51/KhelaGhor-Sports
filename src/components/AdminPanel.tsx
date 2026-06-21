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
  Pencil,
  Smartphone,
  Users,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Match, UpcomingMatch, Channel, GlobalSettings, SportCategory } from '../types';
import { 
  addMatch, 
  deleteMatch, 
  updateMatch,
  addUpcomingMatch, 
  deleteUpcomingMatch, 
  updateUpcomingMatch,
  addChannel, 
  deleteChannel, 
  updateChannel,
  saveGlobalSettings,
  logoutUser,
  AUTHORIZED_ADMIN,
  subscribeToActiveSessions,
  purgeStaleSessions,
  ActiveSession
} from '../lib/store';
import { isFirebaseConfigured } from '../lib/firebase';

interface AdminPanelProps {
  currentSettings: GlobalSettings;
  activeMatches: Match[];
  upcomingMatches: UpcomingMatch[];
  channels: Channel[];
  onClose: () => void;
}

type AdminSubTab = 'live-matches' | 'scheduled' | 'iptv-channels' | 'ads-settings' | 'realtime-analytics';

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
  const [liveSerial, setLiveSerial] = useState('999');

  // Scheduled Match Fields
  const [upCat, setUpCat] = useState<SportCategory>('cricket');
  const [upTeam1Name, setUpTeam1Name] = useState('');
  const [upTeam1Logo, setUpTeam1Logo] = useState('');
  const [upTeam2Name, setUpTeam2Name] = useState('');
  const [upTeam2Logo, setUpTeam2Logo] = useState('');
  const [upServer1, setUpServer1] = useState('');
  const [upServer2, setUpServer2] = useState('');
  const [upServer3, setUpServer3] = useState('');
  const [upServer4, setUpServer4] = useState('');
  const [upComp, setUpComp] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [upSerial, setUpSerial] = useState('999');

  // IPTV Fields
  const [channelName, setChannelName] = useState('');
  const [channelLogo, setChannelLogo] = useState('');
  const [channelStream1, setChannelStream1] = useState('');
  const [channelStream2, setChannelStream2] = useState('');
  const [channelCategory, setChannelCategory] = useState('বাংলাদেশ স্পোর্টস');
  const [customCategory, setCustomCategory] = useState('');
  const [channelSerial, setChannelSerial] = useState('999');

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
  const [trafficSimulationEnabled, setTrafficSimulationEnabled] = useState(currentSettings.trafficSimulationEnabled !== false);
  const [simulatedBaselineTraffic, setSimulatedBaselineTraffic] = useState(currentSettings.simulatedBaselineTraffic || 180);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Real-time visitor list tracking state
  const [sessions, setSessions] = useState<ActiveSession[]>([]);

  // Cleanup/listen routine hook
  React.useEffect(() => {
    if (activeSubTab === 'realtime-analytics') {
      const unsub = subscribeToActiveSessions((list) => {
        setSessions(list);
      });
      // Invoke stale session sweep periodically
      purgeStaleSessions();
      return () => unsub();
    }
  }, [activeSubTab]);

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
        competition,
        serial: liveSerial ? Number(liveSerial) : 999
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
      setLiveSerial('999');
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
        server3Url: upServer3,
        server4Url: upServer4,
        competition: upComp,
        scheduledTime: scheduledTimeMs,
        serial: upSerial ? Number(upSerial) : 999
      });
      triggerNotification('আসন্ন ম্যাচ সফলভাবে সিডিউল করা হয়েছে!');
      setUpTeam1Name('');
      setUpTeam1Logo('');
      setUpTeam2Name('');
      setUpTeam2Logo('');
      setUpServer1('');
      setUpServer2('');
      setUpServer3('');
      setUpServer4('');
      setUpComp('');
      setScheduledDateTime('');
      setUpSerial('999');
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
        category: finalCategory,
        serial: channelSerial ? Number(channelSerial) : 999
      });
      triggerNotification('নতুন টিভি চ্যানেল সফলভাবে যোগ হয়েছে!');
      setChannelName('');
      setChannelLogo('');
      setChannelStream1('');
      setChannelStream2('');
      setCustomCategory('');
      setChannelSerial('999');
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
  const [editChSerial, setEditChSerial] = useState('999');

  const startEditingChannel = (ch: Channel) => {
    setEditingChannel(ch);
    setEditChName(ch.name);
    setEditChLogo(ch.logoUrl);
    setEditChStream1(ch.streamUrl1);
    setEditChStream2(ch.streamUrl2);
    setEditChCategory(ch.category || 'বাংলাদেশ স্পোর্টস');
    setEditChSerial(ch.serial !== undefined ? ch.serial.toString() : '999');
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
        category: editChCategory,
        serial: editChSerial ? Number(editChSerial) : 999
      });
      triggerNotification('টিভি চ্যানেল সফলভাবে আপডেট হয়েছে!');
      setEditingChannel(null);
    } catch (err: any) {
      triggerNotification('আপডেট করতে ত্রুটি হয়েছে: ' + err.message, 'error');
    }
  };

  // Editing Live Match states
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editMatchCat, setEditMatchCat] = useState<SportCategory>('cricket');
  const [editMatchComp, setEditMatchComp] = useState('');
  const [editMatchTeam1Name, setEditMatchTeam1Name] = useState('');
  const [editMatchTeam1Logo, setEditMatchTeam1Logo] = useState('');
  const [editMatchTeam2Name, setEditMatchTeam2Name] = useState('');
  const [editMatchTeam2Logo, setEditMatchTeam2Logo] = useState('');
  const [editMatchServer1, setEditMatchServer1] = useState('');
  const [editMatchServer2, setEditMatchServer2] = useState('');
  const [editMatchServer3, setEditMatchServer3] = useState('');
  const [editMatchServer4, setEditMatchServer4] = useState('');
  const [editMatchSerial, setEditMatchSerial] = useState('999');

  const startEditingMatch = (m: Match) => {
    setEditingMatch(m);
    setEditMatchCat(m.category);
    setEditMatchComp(m.competition || '');
    setEditMatchTeam1Name(m.team1Name);
    setEditMatchTeam1Logo(m.team1Logo || '');
    setEditMatchTeam2Name(m.team2Name);
    setEditMatchTeam2Logo(m.team2Logo || '');
    setEditMatchServer1(m.server1Url);
    setEditMatchServer2(m.server2Url || '');
    setEditMatchServer3(m.server3Url || '');
    setEditMatchServer4(m.server4Url || '');
    setEditMatchSerial(m.serial !== undefined && m.serial !== null ? m.serial.toString() : '999');
  };

  const handleEditMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    if (!editMatchTeam1Name || !editMatchTeam2Name || !editMatchServer1) {
      triggerNotification('অনুগ্রহ করে দলের নাম এবং সার্ভার ১ এর লিঙ্ক পূরণ করুন।', 'error');
      return;
    }
    try {
      await updateMatch(editingMatch.id, {
        category: editMatchCat,
        team1Name: editMatchTeam1Name,
        team1Logo: editMatchTeam1Logo,
        team2Name: editMatchTeam2Name,
        team2Logo: editMatchTeam2Logo,
        server1Url: editMatchServer1,
        server2Url: editMatchServer2,
        server3Url: editMatchServer3,
        server4Url: editMatchServer4,
        isLive: editingMatch.isLive ?? true,
        competition: editMatchComp,
        serial: editMatchSerial ? Number(editMatchSerial) : 999
      });
      triggerNotification('লাইভ ম্যাচ সফলভাবে আপডেট হয়েছে!');
      setEditingMatch(null);
    } catch (err: any) {
      triggerNotification('আপডেট করতে ত্রুটি হয়েছে: ' + err.message, 'error');
    }
  };

  // Editing Upcoming Match states
  const [editingUpcomingMatch, setEditingUpcomingMatch] = useState<UpcomingMatch | null>(null);
  const [editUpCat, setEditUpCat] = useState<SportCategory>('cricket');
  const [editUpComp, setEditUpComp] = useState('');
  const [editUpTeam1Name, setEditUpTeam1Name] = useState('');
  const [editUpTeam1Logo, setEditUpTeam1Logo] = useState('');
  const [editUpTeam2Name, setEditUpTeam2Name] = useState('');
  const [editUpTeam2Logo, setEditUpTeam2Logo] = useState('');
  const [editUpServer1, setEditUpServer1] = useState('');
  const [editUpServer2, setEditUpServer2] = useState('');
  const [editUpServer3, setEditUpServer3] = useState('');
  const [editUpServer4, setEditUpServer4] = useState('');
  const [editUpDateTime, setEditUpDateTime] = useState('');
  const [editUpSerial, setEditUpSerial] = useState('999');

  const startEditingUpcomingMatch = (um: UpcomingMatch) => {
    setEditingUpcomingMatch(um);
    setEditUpCat(um.category);
    setEditUpComp(um.competition || '');
    setEditUpTeam1Name(um.team1Name);
    setEditUpTeam1Logo(um.team1Logo || '');
    setEditUpTeam2Name(um.team2Name);
    setEditUpTeam2Logo(um.team2Logo || '');
    setEditUpServer1(um.server1Url || '');
    setEditUpServer2(um.server2Url || '');
    setEditUpServer3(um.server3Url || '');
    setEditUpServer4(um.server4Url || '');
    
    // Format epoch ms to YYYY-MM-DDThh:mm for datetime-local value
    const d = new Date(um.scheduledTime);
    const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    setEditUpDateTime(localISOTime);
    setEditUpSerial(um.serial !== undefined && um.serial !== null ? um.serial.toString() : '999');
  };

  const handleEditUpcomingMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUpcomingMatch) return;
    if (!editUpTeam1Name || !editUpTeam2Name || !editUpDateTime) {
      triggerNotification('অনুগ্রহ করে দলের নাম ও ম্যাচের সময়সূচী পূরণ করুন।', 'error');
      return;
    }

    const scheduledTimeMs = new Date(editUpDateTime).getTime();
    if (isNaN(scheduledTimeMs)) {
      triggerNotification('অকার্যকর তারিখ ও সময় ফরম্যাট।', 'error');
      return;
    }

    try {
      await updateUpcomingMatch(editingUpcomingMatch.id, {
        category: editUpCat,
        team1Name: editUpTeam1Name,
        team1Logo: editUpTeam1Logo,
        team2Name: editUpTeam2Name,
        team2Logo: editUpTeam2Logo,
        server1Url: editUpServer1,
        server2Url: editUpServer2,
        server3Url: editUpServer3,
        server4Url: editUpServer4,
        competition: editUpComp,
        scheduledTime: scheduledTimeMs,
        serial: editUpSerial ? Number(editUpSerial) : 999
      });
      triggerNotification('আসন্ন ম্যাচ সফলভাবে আপডেট হয়েছে!');
      setEditingUpcomingMatch(null);
    } catch (err: any) {
      triggerNotification('আপডেট করতে ত্রুটি হয়েছে: ' + err.message, 'error');
    }
  };

  const handleMoveMatch = async (m: Match, direction: 'up' | 'down') => {
    const currentSerial = m.serial !== undefined && m.serial !== null ? m.serial : 999;
    const targetSerial = direction === 'up' ? Math.max(1, currentSerial - 1) : currentSerial + 1;
    try {
      await updateMatch(m.id, {
        category: m.category,
        team1Name: m.team1Name,
        team1Logo: m.team1Logo,
        team2Name: m.team2Name,
        team2Logo: m.team2Logo,
        server1Url: m.server1Url,
        server2Url: m.server2Url,
        server3Url: m.server3Url || '',
        server4Url: m.server4Url || '',
        isLive: m.isLive ?? true,
        competition: m.competition || '',
        serial: targetSerial
      });
      triggerNotification('ম্যাচের সিরিয়াল পরিবর্তন করা হয়েছে!');
    } catch (err: any) {
      triggerNotification('সিরিয়াল পরিবর্তন করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  const handleMoveUpcomingMatch = async (um: UpcomingMatch, direction: 'up' | 'down') => {
    const currentSerial = um.serial !== undefined && um.serial !== null ? um.serial : 999;
    const targetSerial = direction === 'up' ? Math.max(1, currentSerial - 1) : currentSerial + 1;
    try {
      await updateUpcomingMatch(um.id, {
        category: um.category,
        team1Name: um.team1Name,
        team1Logo: um.team1Logo,
        team2Name: um.team2Name,
        team2Logo: um.team2Logo,
        server1Url: um.server1Url,
        server2Url: um.server2Url,
        server3Url: um.server3Url || '',
        server4Url: um.server4Url || '',
        competition: um.competition || '',
        scheduledTime: um.scheduledTime,
        serial: targetSerial
      });
      triggerNotification('আসন্ন ম্যাচের সিরিয়াল পরিবর্তন করা হয়েছে!');
    } catch (err: any) {
      triggerNotification('সিরিয়াল পরিবর্তন করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  const handleMoveChannel = async (ch: Channel, direction: 'up' | 'down') => {
    const currentSerial = ch.serial !== undefined && ch.serial !== null ? ch.serial : 999;
    const targetSerial = direction === 'up' ? Math.max(1, currentSerial - 1) : currentSerial + 1;
    try {
      await updateChannel(ch.id, {
        name: ch.name,
        logoUrl: ch.logoUrl,
        streamUrl1: ch.streamUrl1,
        streamUrl2: ch.streamUrl2,
        category: ch.category || 'বাংলাদেশ স্পোর্টস',
        serial: targetSerial
      });
      triggerNotification('চ্যানেলের সিরিয়াল পরিবর্তন করা হয়েছে!');
    } catch (err: any) {
      triggerNotification('সিরিয়াল পরিবর্তন করতে সমস্যা হয়েছে: ' + err.message, 'error');
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
        termsUrl,
        trafficSimulationEnabled,
        simulatedBaselineTraffic
      });
      triggerNotification('সিস্টেম ও বিজ্ঞাপন সেটিংস সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      triggerNotification('সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message, 'error');
    }
  };

  return (
    <div 
      id="livekhela_admin_dashboard"
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
              লাইভখেলা অ্যাডমিন প্যানেল 
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

        <button
          onClick={() => setActiveSubTab('realtime-analytics')}
          className={`px-4 py-2 text-xs sm:text-sm font-sans font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
            activeSubTab === 'realtime-analytics' 
              ? 'bg-emerald-500 text-slate-950 font-bold' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity size={14} className={activeSubTab === 'realtime-analytics' ? 'animate-pulse text-slate-950' : 'text-emerald-400'} />
          <span className="font-sans font-bold flex items-center gap-1">রিয়েল-টাইম ইউজার 🟢</span>
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

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">ক্রমিক নম্বর / পজিশন (১ হলে সবার উপরে থাকবে)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="উদা: ১, ২, ৩ ... (ডিফল্ট: ৯৯৯)"
                    value={liveSerial}
                    onChange={(e) => setLiveSerial(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
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
                          {m.serial !== undefined && m.serial !== 999 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">সিরিয়াল: {m.serial}</span>
                          )}
                        </div>
                        <span className="text-slate-400 font-medium text-xs">
                          ক্যাটাগরি: {m.category === 'cricket' ? 'ক্রিকেট' : m.category === 'football' ? 'ফুটবল' : 'অন্যান্য'} | কম্পিটিশন: {m.competition || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-black/30 rounded border border-white/5 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleMoveMatch(m, 'up')}
                            className="p-1.5 px-2.5 hover:bg-white/10 text-slate-300 hover:text-white transition text-xs font-bold"
                            title="উপরে নিন"
                          >
                            ▲
                          </button>
                          <div className="w-[1px] h-4 bg-white/5" />
                          <button
                            type="button"
                            onClick={() => handleMoveMatch(m, 'down')}
                            className="p-1.5 px-2.5 hover:bg-white/10 text-slate-300 hover:text-white transition text-xs font-bold"
                            title="নিচে নামান"
                          >
                            ▼
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => startEditingMatch(m)}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg border border-emerald-500/20 transition"
                          title="ম্যাচ পরিবর্তন করুন"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMatch(m.id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg border border-rose-500/20 transition duration-200"
                          title="Finish Match"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="স্ট্রিম ২"
                    value={upServer2}
                    onChange={(e) => setUpServer2(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="স্ট্রিম ৩ (ঐচ্ছিক)"
                    value={upServer3}
                    onChange={(e) => setUpServer3(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="স্ট্রিম ৪ (ঐচ্ছিক)"
                    value={upServer4}
                    onChange={(e) => setUpServer4(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/40 rounded-lg border border-white/5 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <label className="text-xs text-slate-400">ক্রমিক নম্বর / পজিশন (১ হলে সবার উপরে থাকবে)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="উদা: ১, ২, ৩ ... (ডিফল্ট: ৯৯৯)"
                    value={upSerial}
                    onChange={(e) => setUpSerial(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
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
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold uppercase text-white tracking-tight">{um.team1Name} VS {um.team2Name}</span>
                          {um.serial !== undefined && um.serial !== 999 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">সিরিয়াল: {um.serial}</span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs font-medium">
                          সময়: {new Date(um.scheduledTime).toLocaleString('bn-BD')} | {um.competition || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-black/30 rounded border border-white/5 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleMoveUpcomingMatch(um, 'up')}
                            className="p-1.5 px-2.5 hover:bg-white/10 text-slate-300 hover:text-white transition text-xs font-bold"
                            title="উপরে নিন"
                          >
                            ▲
                          </button>
                          <div className="w-[1px] h-4 bg-white/5" />
                          <button
                            type="button"
                            onClick={() => handleMoveUpcomingMatch(um, 'down')}
                            className="p-1.5 px-2.5 hover:bg-white/10 text-slate-300 hover:text-white transition text-xs font-bold"
                            title="নিচে নামান"
                          >
                            ▼
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => startEditingUpcomingMatch(um)}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg border border-emerald-500/20 transition"
                          title="আসন্ন ম্যাচ এডিট করুন"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteUpcomingMatch(um.id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg border border-rose-500/20 transition duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400">ক্রমিক নম্বর / পজিশন (১ হলে সবার উপরে থাকবে)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="উদা: ১, ২, ৩ ... (ডিফল্ট: ৯৯৯)"
                  value={channelSerial}
                  onChange={(e) => setChannelSerial(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
                />
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
                      <div className="flex items-center gap-3 overflow-hidden">
                        {ch.logoUrl && (
                          <div className="w-8 h-8 rounded bg-zinc-900 border border-white/5 flex items-center justify-center p-1 overflow-hidden shrink-0">
                            <img src={ch.logoUrl} alt={ch.name} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white tracking-tight truncate">{ch.name}</span>
                            {ch.serial !== undefined && ch.serial !== 999 && (
                              <span className="px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0">P-{ch.serial}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold tracking-wider truncate">{ch.category || 'বাংলাদেশ স্পোর্টস'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-black/30 rounded border border-white/5 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleMoveChannel(ch, 'up')}
                            className="p-1.5 px-2.5 hover:bg-white/10 text-slate-300 hover:text-white transition text-xs font-bold"
                            title="উপরে নিন"
                          >
                            ▲
                          </button>
                          <div className="w-[1px] h-4 bg-white/5" />
                          <button
                            type="button"
                            onClick={() => handleMoveChannel(ch, 'down')}
                            className="p-1.5 px-2.5 hover:bg-white/10 text-slate-300 hover:text-white transition text-xs font-bold"
                            title="নিচে নামান"
                          >
                            ▼
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => startEditingChannel(ch)}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg border border-emerald-500/20 transition"
                          title="চ্যানেল পরিবর্তন করুন"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
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

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">ক্রমিক নম্বর / পজিশন (১ হলে সবার উপরে থাকবে)</label>
                      <input
                        type="number"
                        min="1"
                        value={editChSerial}
                        onChange={(e) => setEditChSerial(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-black/45 rounded-lg border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-sans"
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
                    <span className="text-[10px] text-slate-500 mt-0.5">ভিজিটর ক্লিক করলে অন্য উইন্ডো তে খোলে (একবার প্রতি সেশান)।</span>
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
            <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2 mt-4 font-sans col-span-1 md:col-span-2">
              <Globe size={16} />
              <span>স্বাগতম নোটিশ ও সোশ্যাল গ্রুপ সেটিংস</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans col-span-1 md:col-span-2">
              {/* Telegram Channel URL */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs text-slate-400">টেলিগ্রাম চ্যানেল লিঙ্ক (Telegram URL)</label>
                <input
                  type="url"
                  placeholder="https://t.me/livekhela_official"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Welcome Title */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs text-slate-200">স্বাগতম নোটিশের শিরোনাম</label>
                <input
                  type="text"
                  placeholder="লাইভখেলা-য় স্বাগতম"
                  value={welcomeTitle}
                  onChange={(e) => setWelcomeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Welcome Messages */}
              <div className="flex flex-col gap-1 md:col-span-2 text-left">
                <label className="text-xs text-slate-400">স্বাগতম নোটিশের বার্তা (HTML/Text)</label>
                <textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full p-2.5 bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>

              {/* Privacy/Terms */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs text-slate-400">প্রাইভেসি পলিসি লিঙ্ক</label>
                <input
                  type="url"
                  value={privacyPolicyUrl}
                  onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs text-slate-400">সার্ভিস শর্তাবলী লিঙ্ক</label>
                <input
                  type="url"
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

        {/* TAB 5: Real-time traffic analytics */}
        {activeSubTab === 'realtime-analytics' && (
          <div className="flex flex-col gap-6 font-sans">
            {/* Header / Summary */}
            <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-fade-in text-left">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Activity className="text-emerald-400 animate-pulse" size={24} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">রিয়েল-টাইম ভিজিটর ট্র্যাকার ও অ্যানালিটিক্স</h3>
                  <p className="text-xs text-slate-400">আপনার ওয়েবসাইট এবং অ্যান্ড্রয়েড অ্যাপের লাইভ ট্রাফিক পর্যবেক্ষণ করুন</p>
                </div>
              </div>
            </div>

            {/* Real-time Traffic Simulation Controls */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 animate-fade-in text-left">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 font-sans">
                <Activity className="text-emerald-400 font-bold" size={16} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">অনলাইন ট্রাফিক সিমুলেশন কন্ট্রোল (অন/অফ)</span>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-200">ডেমো ট্রাফিক সিমুলেশন মোড</span>
                  <p className="text-xs text-slate-400 max-w-xl">
                    আপনার ওয়েবসাইট ফাঁকা দেখানোর বদলে একটি বাস্তবসম্মত ভিজিটর ট্রাফিক প্রদর্শন ট্র্যাকার চালু করুন। 
                    নিশ্চিন্তে এটি বন্ধও করতে পারেন সম্পূর্ণ বাস্তব ডাটাবেজের ইউজার সেশন দেখার জন্য।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const nextVal = !trafficSimulationEnabled;
                    setTrafficSimulationEnabled(nextVal);
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
                        termsUrl,
                        trafficSimulationEnabled: nextVal,
                        simulatedBaselineTraffic
                      });
                      window.dispatchEvent(new Event('livekhela_local_update'));
                      triggerNotification(nextVal ? 'সিমুলেশন চালু করা হয়েছে!' : 'সিমুলেশন বন্ধ করা হয়েছে।');
                    } catch (e) {
                      triggerNotification('পরিবর্তন সংরক্ষণ করতে ব্যর্থ হয়েছে', 'error');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold font-sans text-xs transition duration-250 shrink-0 self-start md:self-center ${
                    trafficSimulationEnabled
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold shadow-lg shadow-emerald-500/10'
                      : 'bg-zinc-800 text-slate-400 hover:bg-zinc-700'
                  }`}
                >
                  {trafficSimulationEnabled ? '✅ সিমুলেশন চালু (ON)' : '❌ সিমুলেশন বন্ধ (OFF)'}
                </button>
              </div>

              {trafficSimulationEnabled && (
                <div className="flex flex-col gap-3 mt-1 pt-3 border-t border-white/5 font-sans">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-300">বেসলাইন দর্শক সংখ্যা (Baseline Live Spectators):</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      {simulatedBaselineTraffic} জন বাফারিং দর্শক
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <input
                      type="range"
                      min="15"
                      max="1200"
                      step="5"
                      value={simulatedBaselineTraffic}
                      onChange={(e) => {
                        setSimulatedBaselineTraffic(Number(e.target.value));
                      }}
                      onMouseUp={async (e: any) => {
                        const val = Number(e.target.value);
                        setSimulatedBaselineTraffic(val);
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
                            termsUrl,
                            trafficSimulationEnabled,
                            simulatedBaselineTraffic: val
                          });
                          window.dispatchEvent(new Event('livekhela_local_update'));
                          triggerNotification(`সিমুলেশন বেসলাইন দর্শক সংখ্যা সেট করা হয়েছে: ${val} জন`);
                        } catch (err) {}
                      }}
                      onTouchEnd={async (e: any) => {
                        const val = Number(e.target.value);
                        setSimulatedBaselineTraffic(val);
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
                            termsUrl,
                            trafficSimulationEnabled,
                            simulatedBaselineTraffic: val
                          });
                          window.dispatchEvent(new Event('livekhela_local_update'));
                          triggerNotification(`সিমুলেশন বেসলাইন দর্শক সংখ্যা সেট করা হয়েছে: ${val} জন`);
                        } catch (err) {}
                      }}
                      className="w-full h-1.5 bg-zinc-850 progress-bar rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex gap-1.5 justify-end">
                      {[120, 250, 500, 1000].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={async () => {
                            setSimulatedBaselineTraffic(num);
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
                                termsUrl,
                                trafficSimulationEnabled,
                                simulatedBaselineTraffic: num
                              });
                              window.dispatchEvent(new Event('livekhela_local_update'));
                              triggerNotification(`রিয়েল-টাইম দর্শক বেস সেট করা হয়েছে: ${num} জন`);
                            } catch (err) {}
                          }}
                          className={`px-2 py-1 text-[10px] font-mono font-bold rounded border transition ${
                            simulatedBaselineTraffic === num
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-slate-300 border-white/5'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>



            {/* Quick Stat Cards */}
            {(() => {
              const now = Date.now();
              const onlineTimeout = 65000; // 65 seconds
              
              // Filter out unique device visit tokens from the live active count calculations
              const actualLiveSessions = sessions.filter(s => !s.id.startsWith('visit_') || (now - s.lastActive <= onlineTimeout));
              
              const activeList = actualLiveSessions.filter(s => now - s.lastActive <= onlineTimeout);
              const offlineList = actualLiveSessions.filter(s => now - s.lastActive > onlineTimeout && now - s.lastActive <= 900000); // 15 mins
              
              const androidOnline = activeList.filter(s => s.platform === 'Android App').length;
              const webOnline = activeList.filter(s => s.platform === 'Website Browser').length;
              const totalOnline = activeList.length;
              const totalOfflineRecent = offlineList.length;

              // Generate a persistent, stable lifetime visits metric
              // Count all visit_ tokens and unique users
              const uniqueIds = new Set();
              sessions.forEach(s => {
                const cleanId = s.id
                  .replace('session_', 'dev_')
                  .replace('visit_mock_', 'dev_')
                  .replace('visit_', 'dev_')
                  .replace('mock_online_', 'dev_')
                  .replace('mock_offline_', 'dev_');
                uniqueIds.add(cleanId);
              });

              // Lifetime totals consists of registered unique real DB device visits + any historical mock simulator counts
              const totalUniqueCount = Math.max(942, uniqueIds.size);

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in font-sans text-left">
                    {/* Card 1: Cumulative Lifetime Visitors */}
                    <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden group hover:border-emerald-500/20 transition duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">সর্বমোট ইউনিক ভিজিটর</span>
                        <Users size={14} className="text-sky-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1 font-sans">
                        <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono tracking-tight">{totalUniqueCount}</span>
                        <span className="text-[10px] text-slate-500">জন মোট</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <CheckCircle size={10} className="text-sky-400/80" />
                        <span>লাইফটাইম ডিভাইস রেকর্ড</span>
                      </div>
                    </div>

                    {/* Card 2: Total Online */}
                    <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden group hover:border-emerald-500/20 transition duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">অনলাইন দর্শক</span>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1 font-sans">
                        <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">{totalOnline}</span>
                        <span className="text-[10px] text-slate-400">জন সক্রিয়</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Wifi size={10} className="text-emerald-400" />
                        <span>লাইভ সেকেন্ড স্ট্রিম ট্র্যাকিং</span>
                      </div>
                    </div>

                    {/* Card 3: Android Users */}
                    <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden group hover:border-emerald-500/20 transition duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">অ্যান্ড্রয়েড অ্যাপ (Live)</span>
                        <Smartphone size={14} className="text-emerald-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1 font-sans">
                        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">{androidOnline}</span>
                        <span className="text-[10px] text-slate-400">জন অ্যাপে</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Smartphone size={10} className="text-emerald-400/80" />
                        <span>মোবাইল ও অ্যান্ড্রয়েড অ্যাপ</span>
                      </div>
                    </div>

                    {/* Card 4: Browser Users */}
                    <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden group hover:border-emerald-500/20 transition duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">ওয়েবসাইট ব্রাউজার</span>
                        <Chrome size={14} className="text-emerald-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1 font-sans">
                        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">{webOnline}</span>
                        <span className="text-[10px] text-slate-400">জন সাইটে</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Globe size={10} className="text-teal-400/80" />
                        <span>সরাসরি পিসি ও মোবাইল ওয়েব</span>
                      </div>
                    </div>

                    {/* Card 5: Offline Users */}
                    <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden group hover:border-emerald-500/20 transition duration-300 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">অফলাইন (শেষ ১৫ মিনিট)</span>
                        <WifiOff size={14} className="text-slate-500" />
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1 font-sans">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-400 font-mono tracking-tight">{totalOfflineRecent}</span>
                        <span className="text-[10px] text-slate-500">জন অফলাইন</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Info size={10} />
                        <span>শেষ ১৫ মিনিটে প্রস্থান</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Visitors detailed table/list */}
                  <div className="bg-black/20 border border-white/5 p-5 rounded-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3 font-sans">
                      <span className="text-sm font-extrabold text-white flex items-center gap-2">
                        <Users size={16} className="text-emerald-400" />
                        <span>সক্রিয় ব্যবহারকারীদের তালিকা ({activeList.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 italic font-mono">রিয়েল-টাইম লাইভ আপডেট হচ্ছে...</span>
                    </div>

                    {activeList.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-sm font-sans flex flex-col items-center justify-center gap-2">
                        <Activity className="text-white/10 animate-pulse" size={48} />
                        <span>বর্তমানে কোনো সক্রিয় ইউজার সেশন ডাটাবেজে রেকর্ড নেই।</span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300 font-sans border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-slate-400 text-xs font-bold font-mono tracking-wider">
                              <th className="py-2.5 px-3 text-left">সেশন টোকেন আইডি</th>
                              <th className="py-2.5 px-2 text-left">ডিভাইস প্ল্যাটফর্ম</th>
                              <th className="py-2.5 px-2 text-right">শেষ সক্রিয় উপস্থিতি</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeList.map((session, index) => {
                              const timeDiff = Math.max(0, Math.floor((now - session.lastActive) / 1000));
                              let liveStatus = '১ সেকেন্ড আগে';
                              if (timeDiff > 1) {
                                liveStatus = `${timeDiff} সেকেন্ড আগে`;
                              }

                              return (
                                <tr key={session.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="py-3 px-3 font-mono text-xs text-sky-400 flex items-center gap-2">
                                    <span className="text-slate-500 select-none">{index + 1}.</span>
                                    <span>{session.id.startsWith('mock_session') ? `🧬 ${session.id}` : `🔒 ${session.id.substring(0, 24)}...`}</span>
                                  </td>
                                  <td className="py-3 px-2">
                                    {session.platform === 'Android App' ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <Smartphone size={10} />
                                        <span>অ্যান্ড্রয়েড অ্যাপ</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-sky-400 border border-blue-500/20">
                                        <Globe size={10} />
                                        <span>ওয়েবসাইট ব্রাউজার</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-2 text-right font-mono text-xs text-emerald-400 font-extrabold">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                                    {liveStatus}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}







      </div>

      {/* Live Match editing popup modal overlay */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-emerald-400 font-sans tracking-tight uppercase flex items-center gap-2">
                <Radio size={16} className="animate-pulse" />
                <span>লাইভ ম্যাচ এডিট করুন</span>
              </h3>
              <button
                onClick={() => setEditingMatch(null)}
                className="text-slate-400 hover:text-white transition font-bold font-sans text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
              >
                বাতিল
              </button>
            </div>

            <form onSubmit={handleEditMatchSubmit} className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-left">
              {/* Category selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400">ক্যাটাগরি নির্ধারণ করুন</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cricket', 'football', 'others'] as SportCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditMatchCat(cat)}
                      className={`py-2 text-xs font-sans rounded-lg border transition ${
                        editMatchCat === cat 
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
                  value={editMatchComp}
                  onChange={(e) => setEditMatchComp(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
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
                    value={editMatchTeam1Name}
                    onChange={(e) => setEditMatchTeam1Name(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                  <input
                    type="url"
                    placeholder="লোগো লিংক (Web URL)"
                    value={editMatchTeam1Logo}
                    onChange={(e) => setEditMatchTeam1Logo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-black/40 rounded-lg border border-white/20 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">দল ২ (নাম)</label>
                  <input
                    type="text"
                    required
                    placeholder="উদা: NZ"
                    value={editMatchTeam2Name}
                    onChange={(e) => setEditMatchTeam2Name(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                  <input
                    type="url"
                    placeholder="লোগো লিংক (Web URL)"
                    value={editMatchTeam2Logo}
                    onChange={(e) => setEditMatchTeam2Logo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-black/40 rounded-lg border border-white/20 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition font-sans"
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
                    value={editMatchServer1}
                    onChange={(e) => setEditMatchServer1(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">সার্ভার ২ স্ট্রিম লিঙ্ক (.m3u8 URL - ব্যাকআপ)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/live/stream2.m3u8"
                    value={editMatchServer2}
                    onChange={(e) => setEditMatchServer2(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">সার্ভার ৩ স্ট্রিম লিঙ্ক (.m3u8 URL - ব্যাকআপ)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/live/stream3.m3u8"
                    value={editMatchServer3}
                    onChange={(e) => setEditMatchServer3(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">সার্ভার ৪ স্ট্রিম লিঙ্ক (.m3u8 URL - ব্যাকআপ)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/live/stream4.m3u8"
                    value={editMatchServer4}
                    onChange={(e) => setEditMatchServer4(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">ক্রমিক নম্বর / পজিশন (১ হলে সবার উপরে থাকবে)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="উদা: ১, ২, ৩ ... (ডিফল্ট: ৯৯৯)"
                    value={editMatchSerial}
                    onChange={(e) => setEditMatchSerial(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
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

      {/* Upcoming Match editing popup modal overlay */}
      {editingUpcomingMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-emerald-400 font-sans tracking-tight uppercase flex items-center gap-2">
                <Calendar size={16} />
                <span>আসন্ন ম্যাচ এডিট করুন</span>
              </h3>
              <button
                onClick={() => setEditingUpcomingMatch(null)}
                className="text-slate-400 hover:text-white transition font-bold font-sans text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
              >
                বাতিল
              </button>
            </div>

            <form onSubmit={handleEditUpcomingMatchSubmit} className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400">ক্যাটাগরি</label>
                <div className="grid grid-cols-3 gap-2 font-sans">
                  {(['cricket', 'football', 'others'] as SportCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditUpCat(cat)}
                      className={`py-2 text-xs font-sans rounded-lg border transition ${
                        editUpCat === cat 
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
                    value={editUpTeam1Name}
                    onChange={(e) => setEditUpTeam1Name(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="লোগো লিংক"
                    value={editUpTeam1Logo}
                    onChange={(e) => setEditUpTeam1Logo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-black/40 rounded-lg border border-white/25 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">দল ২ (নাম)</label>
                  <input
                    type="text"
                    required
                    placeholder="উদা: PAK"
                    value={editUpTeam2Name}
                    onChange={(e) => setEditUpTeam2Name(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="লোগো লিংক"
                    value={editUpTeam2Logo}
                    onChange={(e) => setEditUpTeam2Logo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-black/40 rounded-lg border border-white/25 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              {/* Release datetime input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400">কখন লাইভ শুরু হবে?</label>
                <input
                  type="datetime-local"
                  required
                  value={editUpDateTime}
                  onChange={(e) => setEditUpDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              {/* Additional optional fields */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">কম্পিটিশন ও অন্যান্য লিঙ্ক (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="উদা: T20 World Cup"
                  value={editUpComp}
                  onChange={(e) => setEditUpComp(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <input
                    type="url"
                    placeholder="স্ট্রিম ১"
                    value={editUpServer1}
                    onChange={(e) => setEditUpServer1(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-black/40 rounded-lg border border-white/25 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="স্ট্রিম ২"
                    value={editUpServer2}
                    onChange={(e) => setEditUpServer2(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-black/40 rounded-lg border border-white/25 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="স্ট্রিম ৩ (ঐচ্ছিক)"
                    value={editUpServer3}
                    onChange={(e) => setEditUpServer3(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-black/40 rounded-lg border border-white/25 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <input
                    type="url"
                    placeholder="স্ট্রিম ৪ (ঐচ্ছিক)"
                    value={editUpServer4}
                    onChange={(e) => setEditUpServer4(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-[11px] bg-black/40 rounded-lg border border-white/25 text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1 mt-1.5">
                  <label className="text-xs text-slate-400">ক্রমিক নম্বর / পজিশন (১ হলে সবার উপরে থাকবে)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="উদা: ১, ২, ৩ ... (ডিফল্ট: ৯৯৯)"
                    value={editUpSerial}
                    onChange={(e) => setEditUpSerial(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/40 rounded-lg border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-sans"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-2 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingUpcomingMatch(null)}
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
  );
}
