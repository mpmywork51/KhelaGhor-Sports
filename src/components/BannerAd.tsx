import React, { useEffect, useRef } from 'react';

interface BannerAdProps {
  code: string;
  enabled: boolean;
}

export default function BannerAd({ code, enabled }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !code || !containerRef.current) return;
    
    try {
      containerRef.current.innerHTML = '';
      const range = document.createRange();
      const documentFragment = range.createContextualFragment(code);
      containerRef.current.appendChild(documentFragment);
    } catch (e) {
      console.error('Failed to parse and insert dynamic banner ad:', e);
    }
  }, [code, enabled]);

  if (!enabled) return null;

  return (
    <div 
      id="livekhela_banner_ad"
      ref={containerRef} 
      className="w-full max-w-4xl mx-auto my-6 p-2 rounded-xl bg-zinc-950/20 border border-white/5 flex items-center justify-center overflow-hidden min-h-[90px] backdrop-blur-md"
    />
  );
}
