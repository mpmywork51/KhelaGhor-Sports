import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, AlertCircle, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  welcomeTitle: string;
  welcomeMessage: string;
  telegramUrl: string;
}

export default function WelcomeModal({ isOpen, onClose, welcomeTitle, welcomeMessage, telegramUrl }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-40">
        {/* Soft glassmorphic backdrop overlay */}
        <motion.div
          id="welcome_modal_overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Dialog Content */}
        <motion.div
          id="welcome_modal_content"
          initial={{ scale: 0.9, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 15, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative w-full max-w-md bg-zinc-900/80 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden text-center text-white"
        >
          {/* Subtle decoration light beam */}
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          {/* Close corner icon button */}
          <button 
            id="welcome_modal_close_icon"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X size={16} />
          </button>

          {/* Icon Brand badge */}
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner relative mb-5">
            <Sparkles className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
          </div>

          {/* Translated Title */}
          <h2 className="text-xl sm:text-2xl font-sans tracking-tight font-extrabold text-white mb-3">
            {welcomeTitle || 'লাইভখেলা-য় স্বাগতম'}
          </h2>

          {/* Customizable welcome text */}
          <div className="text-slate-300 font-sans text-sm sm:text-base leading-relaxed mb-6 px-1">
            <p className="whitespace-pre-wrap">
              {welcomeMessage || 'আপনাকে স্বাগতম আমাদের লাইভখেলা ওয়েবসাইটে! লাইভ খেলা দেখতে আমাদের সাথেই থাকুন।'}
            </p>
          </div>

          {/* Dual Response Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Button 1: Dismiss / Outside */}
            <button
              id="welcome_modal_dismiss_btn"
              onClick={onClose}
              className="flex-1 order-2 sm:order-1 px-5 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:text-white text-slate-300 font-sans font-medium text-sm transition active:scale-95"
            >
              বাহির হন
            </button>

            {/* Button 2: Telegram redirect */}
            <a
              id="welcome_modal_telegram_btn"
              href={telegramUrl || 'https://t.me/livekhela_official'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose} // dismiss the modal on link click
              className="flex-1 order-1 sm:order-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              <Send size={16} className="fill-current" />
              <span>টেলিগ্রামে জয়েন হন</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
