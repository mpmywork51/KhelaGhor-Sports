import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft, Eye, Lock, FileText, ExternalLink } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
            <Shield size={24} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Official Privacy Policy</span>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight mt-0.5">
              প্রাইভেসি পলিসি (Privacy Policy)
            </h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
          আমাদের অফিসিয়াল ডোমেইন <span className="text-emerald-400 font-bold font-mono">Livekhela.site</span>-এ আপনাকে স্বাগতম। আপনার গোপনীয়তা রক্ষা এবং সাইটের সঠিক ব্যবহার নিশ্চিত করার জন্য আমাদের নীতিমালা নিচে বিস্তারিত বাংলা ভাষায় তুলে ধরা হলো। দয়া করে মনোযোগ সহকারে পড়ুন।
        </p>
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-[10px] sm:text-xs text-slate-500 font-mono">
          <span>সর্বশেষ আপডেট: ২৯ জুন, ২০২৬</span>
          <span>•</span>
          <span>ডোমেইন: Livekhela.site</span>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="flex flex-col gap-6">
        
        {/* 1. Third-Party Ads Disclosure (Crucial Section) */}
        <section className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm relative">
          <div className="absolute top-4 right-4 text-rose-500/10">
            <ExternalLink size={60} />
          </div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-rose-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">
              ১. থার্ড-পার্টি বিজ্ঞাপন প্রকাশনা (Third-Party Ads Disclosure)
            </h2>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
            <p className="text-rose-400/90 font-bold">
              সতর্কীকরণ: Livekhela.site ওয়েবসাইটে ব্যানার বিজ্ঞাপন (Banner Ads) এবং পপ-আন্ডার (Pop-under) বিজ্ঞাপন ব্যবহার করা হয়।
            </p>
            <p>
              আমাদের সাইটে প্রদর্শিত বিজ্ঞাপনগুলো বিভিন্ন থার্ড-পার্টি বিজ্ঞাপন নেটওয়ার্ক দ্বারা সরবরাহ করা হয়। খেলা চলাকালীন সময়ে বা ক্লিক করার পর কোনো নতুন বিজ্ঞাপন উইন্ডো বা পপ-আন্ডার ট্যাব খুলতে পারে। এই থার্ড-পার্টি বিজ্ঞাপন নেটওয়ার্কগুলো ব্যবহারকারীর ব্রাউজিং অভিজ্ঞতা বা প্রাসঙ্গিক বিজ্ঞাপন প্রদর্শনের জন্য <span className="text-emerald-400 font-bold font-mono">Cookies</span> ব্যবহার করতে পারে।
            </p>
            <p className="bg-black/40 p-3.5 rounded-xl border border-white/5 text-slate-400">
              <span className="text-white font-bold block mb-1">দায়ের সম্পূর্ণ মুক্তি:</span>
              বিজ্ঞাপনগুলোর ভেতরের কোনো কনটেন্ট, বিজ্ঞাপনে ক্লিক করার মাধ্যমে রিডাইরেক্ট হওয়া বাইরের কোনো ওয়েবসাইট, অ্যাপ, বা তৃতীয় পক্ষের সেবার নিরাপত্তা, বিশ্বস্ততা বা আইনি বিষয়ের সাথে <span className="text-white font-bold">Livekhela.site</span> কর্তৃপক্ষ কোনোভাবেই জড়িত নয় এবং এর কোনো দায়ভার বহন করবে না। ব্যবহারকারী সম্পূর্ণ নিজস্ব ঝুঁকিতে সেগুলোতে প্রবেশ করবেন।
            </p>
          </div>
        </section>

        {/* 2. User Data Protection */}
        <section className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">
              ২. ব্যবহারকারীর ব্যক্তিগত তথ্য সুরক্ষা (User Data Protection)
            </h2>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
            <p>
              আমরা অত্যন্ত গর্বের সাথে ঘোষণা করছি যে, <span className="text-emerald-400 font-bold">Livekhela.site</span> সাধারণ দর্শকদের কোনো প্রকার ব্যক্তিগত তথ্য (যেমন: নাম, ইমেল ঠিকানা, ফোন নম্বর, বা ক্রেডিট কার্ড ডিটেইলস) সংগ্রহ, সঞ্চয় বা বিক্রি করে না।
            </p>
            <p>
              আমাদের ওয়েবসাইটটি ব্রাউজ করার জন্য কোনো অ্যাকাউন্ট খোলার বা ব্যক্তিগত তথ্য দেওয়ার প্রয়োজন পড়ে না। তবে সাইটের ট্রাফিক মনিটর এবং ইউজার ইন্টারফেস উন্নত করার জন্য সম্পূর্ণ বেনামী (Anonymous) টেকনিক্যাল ডেটা যেমন আইপি অ্যাড্রেস বা ব্রাউজার টাইপ স্বয়ংক্রিয়ভাবে ট্র্যাক হতে পারে, যা দ্বারা কোনো নির্দিষ্ট ব্যক্তিকে সনাক্ত করা অসম্ভব।
            </p>
          </div>
        </section>

        {/* 3. Cookies and Log Files */}
        <section className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">
              ৩. কুকিজ এবং লগ ফাইল (Cookies & Log Files)
            </h2>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
            <p>
              অন্যান্য স্ট্যান্ডার্ড ওয়েবসাইটের মতো, <span className="text-emerald-400 font-bold font-mono">Livekhela.site</span> আপনার ব্রাউজারে সাময়িক কুকিজ (Cookies) সংরক্ষণ করতে পারে যাতে ভিডিও প্লেয়ারের সেটিংস (যেমন আপনার কাস্টম সেট করা বাফার কন্ট্রোল বা মিডিয়া প্লেয়ার ভলিউম) পুনরায় সাইটে প্রবেশ করলে সক্রিয় থাকে।
            </p>
            <p>
              আপনি চাইলে যেকোনো সময় আপনার ব্রাউজার সেটিংস থেকে কুকিজ নিষ্ক্রিয় করতে পারেন। তবে মনে রাখবেন, কুকিজ বন্ধ করলে সাইটের কিছু ফিচার বা মিডিয়া প্লেয়ারের প্রি-সেট সেটিংস কাজ নাও করতে পারে।
            </p>
          </div>
        </section>

        {/* 4. Children's Privacy */}
        <section className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">
              ৪. শিশুদের গোপনীয়তা (Children's Privacy)
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">
            আমাদের প্ল্যাটফর্মটি ইন্টারনেট ব্যবহারকারী সকলের জন্য উন্মুক্ত। যেহেতু আমরা কোনো ব্যবহারকারীর ব্যক্তিগত তথ্য সংগ্রহ করি না, তাই শিশুদের গোপনীয়তা নষ্ট হওয়ার কোনো সুনির্দিষ্ট ঝুঁকি আমাদের ওয়েবসাইটে নেই। তবে অপ্রাপ্তবয়স্কদের ইন্টারনেট ব্রাউজিং এর সময় অভিভাবকীয় তদারকি আমরা সর্বদা উৎসাহিত করি।
          </p>
        </section>

        {/* 5. Changes to This Policy */}
        <section className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-white text-base sm:text-lg font-black tracking-tight">
              ৫. নীতিমালার পরিবর্তন (Changes to Policy)
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">
            Livekhela.site কর্তৃপক্ষ যেকোনো সময় এবং কোনো পূর্ব নোটিশ ছাড়াই এই প্রাইভেসি পলিসির যেকোনো ধারা পরিবর্তন, পরিবর্ধন বা সংশোধন করার সম্পূর্ণ অধিকার সংরক্ষণ করে। নীতিমালার যেকোনো পরিবর্তন এই পৃষ্ঠায় প্রকাশ করা মাত্রই তা কার্যকর হবে।
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
