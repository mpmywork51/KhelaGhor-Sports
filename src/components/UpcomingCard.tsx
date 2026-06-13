import React, { useEffect, useState } from 'react';
import { UpcomingMatch } from '../types';
import { Clock, Calendar } from 'lucide-react';

interface UpcomingCardProps {
  key?: React.Key;
  upcoming: UpcomingMatch;
  onCountdownCompleted: (um: UpcomingMatch) => void;
  isAdmin: boolean;
}

export default function UpcomingCard({ upcoming, onCountdownCompleted, isAdmin }: UpcomingCardProps) {
  const [img1Error, setImg1Error] = useState(false);
  const [img2Error, setImg2Error] = useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const diff = upcoming.scheduledTime - now;

      if (diff <= 0) {
        setTimeLeft(prev => ({ ...prev, isOver: true }));
        onCountdownCompleted(upcoming);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [upcoming, onCountdownCompleted]);

  // Bengali translation formatting helpers
  const formatBengaliNumber = (num: number) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(digit => {
      const parsed = parseInt(digit, 10);
      return isNaN(parsed) ? digit : bengaliDigits[parsed];
    }).join('');
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'cricket') return 'ক্রিকেট';
    if (cat === 'football') return 'ফুটবল';
    return 'অন্যান্য স্পোর্টস';
  };

  const getFormattedDateString = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div 
      id={`upcoming_card_${upcoming.id}`}
      className="relative w-full rounded-2xl bg-zinc-950/20 border border-white/5 hover:border-emerald-500/10 p-4 sm:p-5 backdrop-blur-md shadow-md transition-all duration-300 group"
    >
      {/* Visual Header Row */}
      <div className="flex items-center justify-between mb-4">
        <span className="px-2.5 py-1 rounded-lg text-xs font-sans tracking-wide border border-white/10 bg-white/5 text-slate-400">
          {getCategoryLabel(upcoming.category)}
        </span>

        <span className="flex items-center gap-1 text-slate-500 font-sans text-xs">
          <Calendar size={12} />
          <span className="text-[11px] sm:text-xs">আসন্ন ম্যাচ</span>
        </span>
      </div>

      {/* Main Symmetrical Head to Head Info */}
      <div className="flex items-center justify-between py-1 relative z-10 mb-4">
        {/* Team 1 logo and name */}
        <div className="flex items-center gap-3 w-5/12 justify-start">
          <div className={`w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center ${upcoming.team1Logo && !img1Error ? 'p-0' : 'p-1.5'} overflow-hidden shrink-0`}>
            {upcoming.team1Logo && !img1Error ? (
              <img 
                src={upcoming.team1Logo} 
                alt={upcoming.team1Name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImg1Error(true)}
              />
            ) : (
              <span className="text-slate-400 font-mono text-xs">
                {upcoming.team1Name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <h4 className="text-slate-350 text-sm sm:text-base font-bold truncate uppercase font-sans tracking-tight">
            {upcoming.team1Name}
          </h4>
        </div>

        {/* VS text element */}
        <div className="flex items-center justify-center shrink-0 w-2/12">
          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 text-slate-500 text-[10px] font-bold flex items-center justify-center">
            VS
          </div>
        </div>

        {/* Team 2 logo and name */}
        <div className="flex items-center gap-3 w-5/12 justify-end text-right">
          <h4 className="text-slate-350 text-sm sm:text-base font-bold truncate uppercase font-sans tracking-tight">
            {upcoming.team2Name}
          </h4>

          <div className={`w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center ${upcoming.team2Logo && !img2Error ? 'p-0' : 'p-1.5'} overflow-hidden shrink-0`}>
            {upcoming.team2Logo && !img2Error ? (
              <img 
                src={upcoming.team2Logo} 
                alt={upcoming.team2Name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImg2Error(true)}
              />
            ) : (
              <span className="text-slate-400 font-mono text-xs">
                {upcoming.team2Name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Countdown Timer Section */}
      <div className="flex flex-col gap-2 pt-3 border-t border-white/5 mt-2">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-sans flex items-center gap-1">
            <Clock size={12} className="text-emerald-500/80 animate-pulse" />
            <span>সময়সূচী: {getFormattedDateString(upcoming.scheduledTime)}</span>
          </span>
        </div>

        {/* Timer ticker bubbles */}
        {!timeLeft.isOver ? (
          <div className="flex justify-start gap-2 mt-1">
            {timeLeft.days > 0 && (
              <div className="flex items-baseline gap-0.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-xs text-white">
                <span className="font-mono font-bold text-emerald-400">{formatBengaliNumber(timeLeft.days)}</span>
                <span className="text-[10px] text-slate-400 font-sans ml-0.5">দিন</span>
              </div>
            )}
            <div className="flex items-baseline gap-0.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-xs text-white">
              <span className="font-mono font-bold text-emerald-400">{formatBengaliNumber(timeLeft.hours)}</span>
              <span className="text-[10px] text-slate-400 font-sans ml-0.5">ঘণ্টা</span>
            </div>
            <div className="flex items-baseline gap-0.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-xs text-white">
              <span className="font-mono font-bold text-emerald-400">{formatBengaliNumber(timeLeft.minutes)}</span>
              <span className="text-[10px] text-slate-400 font-sans ml-0.5">মিনিট</span>
            </div>
            <div className="flex items-baseline gap-0.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-xs text-white">
              <span className="font-mono font-bold text-rose-400 animate-pulse">{formatBengaliNumber(timeLeft.seconds)}</span>
              <span className="text-[10px] text-slate-400 font-sans ml-0.5">সেকেন্ড</span>
            </div>
          </div>
        ) : (
          <span className="text-emerald-400 text-xs font-bold animate-pulse font-sans">
            ম্যাচটি শুরু করা হচ্ছে...
          </span>
        )}
      </div>
    </div>
  );
}
