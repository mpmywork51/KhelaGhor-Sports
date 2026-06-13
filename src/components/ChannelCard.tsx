import React from 'react';
import { Channel } from '../types';
import { Tv } from 'lucide-react';

interface ChannelCardProps {
  key?: React.Key;
  channel: Channel;
  onWatch: (channel: Channel) => void;
}

export default function ChannelCard({ channel, onWatch }: ChannelCardProps) {
  const [logoError, setLogoError] = React.useState(false);

  return (
    <button 
      id={`channel_card_${channel.id}`}
      onClick={() => onWatch(channel)}
      className="relative aspect-square w-full rounded-2xl bg-zinc-950/40 hover:bg-zinc-900/60 border border-white/5 hover:border-emerald-500/30 overflow-hidden flex flex-col items-center justify-center p-3 transition-all duration-300 group shadow-md hover:shadow-emerald-950/25 active:scale-95"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
      
      {/* Logo Container */}
      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-900/60 border border-white/5 ${channel.logoUrl && !logoError ? 'p-1.5' : 'p-3'} overflow-hidden flex items-center justify-center transition duration-300 group-hover:scale-105 shrink-0 shadow-inner`}>
        {channel.logoUrl && !logoError ? (
          <img 
            src={channel.logoUrl} 
            alt={channel.name} 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <Tv size={32} className="text-slate-600 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider">TV</span>
          </div>
        )}
      </div>
      
      {/* Channel Name */}
      <h3 className="text-white text-xs sm:text-sm font-extrabold font-sans text-center mt-3.5 truncate w-full px-1.5 text-slate-300 group-hover:text-emerald-400 transition-colors duration-250">
        {channel.name}
      </h3>
    </button>
  );
}
