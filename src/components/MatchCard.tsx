import React from 'react';
import { Match, SportCategory } from '../types';
import { Play } from 'lucide-react';

interface MatchCardProps {
  key?: React.Key;
  match: Match;
  onWatch: (match: Match) => void;
}

export default function MatchCard({ match, onWatch }: MatchCardProps) {
  const [img1Error, setImg1Error] = React.useState(false);
  const [img2Error, setImg2Error] = React.useState(false);

  const getCategoryLabel = (cat: SportCategory) => {
    switch (cat) {
      case 'cricket':
        return 'ক্রিকেট';
      case 'football':
        return 'ফুটবল';
      case 'others':
      default:
        return 'অন্যান্য স্পোর্টস';
    }
  };

  const getCategoryColor = (cat: SportCategory) => {
    switch (cat) {
      case 'cricket':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'football':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'others':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div 
      id={`live_card_${match.id}`}
      className="relative w-full rounded-2xl bg-zinc-950/40 hover:bg-zinc-975/60 border border-emerald-500/20 hover:border-emerald-500/40 p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all duration-300 select-none group"
    >
      {/* Glow highlight blur underneath */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Top Header Row within Card */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-sans tracking-wide border ${getCategoryColor(match.category)}`}>
          {getCategoryLabel(match.category)}
        </span>

        {/* Live Indicator Badge */}
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500 font-sans text-[10px] uppercase font-bold tracking-widest animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Live
        </span>
      </div>

      {/* Main Teams Head to Head Body */}
      <div className="flex items-center justify-between py-2 sm:py-3 relative z-10 mb-2">
        {/* Left Side: Team 1 (Logo + Name) */}
        <div className="flex items-center gap-3 w-5/12 justify-start">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center ${match.team1Logo && !img1Error ? 'p-0' : 'p-1.5'} overflow-hidden shadow-inner shrink-0 group-hover:scale-105 transition duration-300`}>
            {match.team1Logo && !img1Error ? (
              <img 
                src={match.team1Logo} 
                alt={`${match.team1Name} logo`} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImg1Error(true)}
              />
            ) : (
              <span className="text-white font-mono text-xs font-bold leading-none select-none">
                {match.team1Name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <h4 className="text-white text-sm sm:text-base font-extrabold truncate uppercase font-sans tracking-tight">
            {match.team1Name}
          </h4>
        </div>

        {/* Center: "VS" Circle Badge */}
        <div className="flex items-center justify-center shrink-0 w-2/12">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px] sm:text-xs flex items-center justify-center shadow-lg shadow-emerald-500/5 select-none font-sans">
            VS
          </div>
        </div>

        {/* Right Side: Team 2 (Name + Logo) */}
        <div className="flex items-center gap-3 w-5/12 justify-end text-right">
          <h4 className="text-white text-sm sm:text-base font-extrabold truncate uppercase font-sans tracking-tight">
            {match.team2Name}
          </h4>

          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center ${match.team2Logo && !img2Error ? 'p-0' : 'p-1.5'} overflow-hidden shadow-inner shrink-0 group-hover:scale-105 transition duration-300`}>
            {match.team2Logo && !img2Error ? (
              <img 
                src={match.team2Logo} 
                alt={`${match.team2Name} logo`} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImg2Error(true)}
              />
            ) : (
              <span className="text-white font-mono text-xs font-bold leading-none select-none">
                {match.team2Name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row within Card */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 relative z-10 gap-4 mt-2">
        <span className="text-slate-400 text-xs sm:text-sm font-sans font-medium truncate">
          {match.competition || 'লাইভ খেলাঘর সম্প্রচার'}
        </span>

        {/* Stream Play button */}
        <button
          onClick={() => onWatch(match)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-xl font-sans font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all duration-300 shrink-0 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
        >
          <Play size={14} className="fill-current" />
          <span>দেখুন</span>
        </button>
      </div>
    </div>
  );
}
