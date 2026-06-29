import React from 'react';
import { motion } from 'motion/react';
import { FileText, ArrowLeft, AlertTriangle, ShieldCheck, Scale, Globe } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto px-4 py-8 font-sans text-slate-300 select-text"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm transition-all duration-300 active:scale-95 group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        <span>হোমে ফিরে যান (Back to Home)</span>
      </button>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-emerald-500/20 p-6 sm:p-8 mb-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-[-50px] right-[-50px] w-36 h-36 rounded-full bg-emerald-500/10 blur-[50px] pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileText size={24} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Official Terms & Disclaimers</span>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight mt-0.5">
              শর্তাবলী ও দায়মুক্তি (Terms of Service)
            </h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
          <span className="text-emerald-400 font-bold font-mono">Livekhela.site</span> ওয়েবসাইটের নিয়মাবলী এবং আইনি শর্তসমূহ বিস্তারিত বাংলা ভাষায় নিচে দেওয়া হলো। আমাদের সেবা ব্যবহারের পূর্বে এই নীতিমালা মনোযোগ দিয়ে পড়া আবশ্যক।
        </p>
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-[10px] sm:text-xs text-slate-500 font-mono">
          <span>সর্বশেষ আপডেট: ২৯ জুন, ২০২৬</span>
          <span>•</span>
          <span>ডোমেইন: Livekhela.site</span>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="flex flex-col gap-6">
        
        {/* 1. Absolute Non-Hosting Disclaimer */}
        <section className="bg-zinc-900/60 border border-emerald-500/15 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm relative">
          <div className="absolute top-4 right-4 text-emerald-400/10">
            <Globe size={60} />
          </div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">
              ১. ভিডিও হোস্ট না করার ঘোষণা (Absolute Non-Hosting Disclaimer)
            </h2>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
            <p className="text-emerald-300 font-bold">
              গুরুত্বপূর্ণ ঘোষণা: Livekhela.site তার নিজস্ব সার্ভারে কোনো ধরণের ভিডিও বা লাইভ স্ট্রিমিং ফাইল আপলোড, সংরক্ষণ, হোস্ট বা সম্প্রচার করে না।
            </p>
            <p>
              আমাদের এই প্ল্যাটফর্মে প্রদর্শিত বা শেয়ারকৃত সমস্ত খেলাধুলার লাইভ স্ট্রিম, ভিডিও, এবং আইপিটিভি চ্যানেলের লিংকসমূহ ইন্টারনেটে সর্বসাধারণের জন্য উন্মুক্ত বিভিন্ন পাবলিক সোর্স (যেমন সোশ্যাল মিডিয়া, পাবলিক স্ট্রিমিং পোর্টাল, বা অন্যান্য ফ্রি ভিডিও হোস্টিং সাইট) থেকে স্বয়ংক্রিয়ভাবে বা ম্যানুয়ালি সংগ্রহ ও এমবেড করা হয়েছে। 
            </p>
          </div>
        </section>

        {/* 2. Zero Liability Clause */}
        <section className="bg-zinc-900/60 border border-emerald-500/15 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm relative">
          <div className="absolute top-4 right-4 text-emerald-400/10">
            <Scale size={60} />
          </div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">
              ২. আইনি দায়মুক্তি (Zero Liability Clause)
            </h2>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
            <p>
              আমরা শুধুমাত্র একটি মুক্ত লিংক ডিরেক্টরি এবং উন্নত প্রক্সি (Stream Indexing & Proxy Tool) হিসেবে কাজ করি যা ব্যবহারকারীদের সুবিধার্থে পাবলিক স্ট্রিমিং খুঁজে পেতে সাহায্য করে।
            </p>
            <p className="bg-black/55 p-4 rounded-xl border border-white/5 text-slate-300 font-bold leading-normal">
              কপিরাইট বা স্বত্বাধিকার সংক্রান্ত যেকোনো দাবি বা অভিযোগের ক্ষেত্রে, দয়া করে মূল হোস্টিং সার্ভার, ভিডিও সোর্স বা ব্রডকাস্টারের সাথে সরাসরি যোগাযোগ করুন। Livekhela.site কোনো প্রকার ডিজিটাল পাইরেসি সমর্থন করে না এবং মূল ভিডিও লিংক বা স্ট্রিমিং এর কনটেন্টের ওপর আমাদের কোনো নিয়ন্ত্রণ নেই। আইনি কোনো বিষয়ে কোনোভাবেই আমাদের কোম্পানি বা সাইটকে দায়ী করা যাবে না।
            </p>
          </div>
        </section>

        {/* 3. As-Is Basis and User Risk */}
        <section className="bg-zinc-900/60 border border-rose-500/20 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm relative">
          <div className="absolute top-4 right-4 text-rose-500/10">
            <AlertTriangle size={60} />
          </div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-rose-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight text-rose-400">
              ৩. ব্যবহারকারীর ঝুঁকি ও বিজ্ঞাপন শর্তসমূহ (As-Is Basis & User Risk)
            </h2>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
            <p>
              ব্যবহারকারীরা সম্পূর্ণ নিজস্ব দায়বদ্ধতা এবং ঝুঁকিতে এই প্ল্যাটফর্ম ব্যবহার করবেন। ভিডিও প্লে করতে গিয়ে তৃতীয় পক্ষের বিজ্ঞাপনে ক্লিক পড়ার কারণে আপনার ডিভাইসে স্প্যাম রিডাইরেক্ট হলে বা অন্য কোনো সফটওয়্যার ডাউনলোড হলে কর্তৃপক্ষ তার জন্য দায়বদ্ধ থাকবে না।
            </p>
            <p>
              আমাদের সকল লাইভ ভিডিও লিঙ্ক কোনো ওয়ারেন্টি বা গ্যারান্টি ছাড়াই সম্পূর্ণ <span className="text-rose-400 font-bold font-mono">"AS-IS"</span> ভিত্তিতে প্রদান করা হয়। নেটওয়ার্ক সমস্যা বা সোর্স লিংক বন্ধ হয়ে যাওয়ার কারণে স্ট্রিমিং সাময়িক বন্ধ থাকলে আমরা তা পুনরায় সচল করার চেষ্টা করব, তবে এর স্থায়িত্বের কোনো নিশ্চয়তা নেই।
            </p>
          </div>
        </section>

        {/* 4. Acceptable Use Policy */}
        <section className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">
              ৪. প্ল্যাটফর্মের ব্যবহারযোগ্যতা (Acceptable Use)
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">
            কোনো ব্যবহারকারী এই ওয়েবসাইটকে ক্ষতিগ্রস্ত করতে পারে এমন কোনো অটোমেটেড ক্রলার বা স্ক্রিপ্ট বা ডিল-অফ-সার্ভিস আক্রমণ চালাতে পারবেন না। আমরা আমাদের সাইট এবং মিডিয়া প্লেয়ার ইঞ্জিনকে সুরক্ষিত এবং দর্শকদের জন্য স্মুথ রাখার জন্য যেকোনো প্রকার অনাকাঙ্ক্ষিত আক্রমণ প্রতিরোধ করতে আইপি ব্লক করার অধিকার রাখি।
          </p>
        </section>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center border-t border-white/5 pt-6 text-slate-500 text-xs sm:text-sm flex flex-col items-center gap-1.5">
        <span className="font-sans font-black text-white bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
          LiveKhela
        </span>
        <p>© 2026 Livekhela.site. সর্বস্বত্ব সংরক্ষিত।</p>
      </div>
    </motion.div>
  );
}
