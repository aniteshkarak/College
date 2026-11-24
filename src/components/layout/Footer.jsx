import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Heart, MapPin, Sparkles } from 'lucide-react';
import AkitsModal from './AkitsModal';

export const Footer = () => {
  const { navigateTo } = useApp();
  const [isAkitsModalOpen, setIsAkitsModalOpen] = useState(false);

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-20 md:pb-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-orange-500 p-0.5 shadow-md shrink-0">
                <div className="w-full h-full bg-white rounded-[10px] p-0.5 flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Collage Story Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <span className="font-display font-bold text-2xl text-white tracking-tight">
                Collage Story
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              A platform for college students to meet, chat and build meaningful connections. Built to encourage genuine conversations without rush or relationship pressure.
            </p>
            <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
              <Heart className="w-3.5 h-3.5 fill-rose-400" />
              <span>Meet. Chat. Connect.</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo('how-it-works')} className="hover:text-rose-400 transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-rose-400 transition-colors">
                  About Collage Story
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('games')} className="hover:text-rose-400 transition-colors">
                  Conversation Games
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('relationship')} className="hover:text-rose-400 transition-colors">
                  Mutual Relationship Mode
                </button>
              </li>
            </ul>
          </div>

          {/* Safety & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Trust & Safety</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo('safety')} className="hover:text-rose-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Safety Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('community')} className="hover:text-rose-400 transition-colors">
                  Community Standards
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('privacy')} className="hover:text-rose-400 transition-colors">
                  DPDP Privacy Policy (2023)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('terms')} className="hover:text-rose-400 transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-rose-400 transition-colors">
                  Contact & Grievance Officer
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('admin')} className="hover:text-purple-400 transition-colors flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Admin Portal (Staff Only)
                </button>
              </li>
            </ul>
          </div>

          {/* Campus Launch Hubs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Campus Hubs
            </h4>
            <p className="text-xs text-slate-400 mb-2">
              <span className="text-slate-200 font-semibold">Active Launch:</span> Kharagpur, Kolkata, Midnapore & West Bengal colleges.
            </p>
            <p className="text-xs text-slate-400">
              <span className="text-slate-200 font-semibold">Upcoming:</span> Bengaluru, Delhi, Pune, Mumbai, Hyderabad & nationwide.
            </p>
          </div>

        </div>

        {/* Legal Disclaimer & AKITS Copyright Section */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center md:text-left text-slate-400">
            <span>© 2026 All Rights Reserved by</span>
            <button
              type="button"
              onClick={() => setIsAkitsModalOpen(true)}
              className="font-bold text-purple-400 hover:text-purple-300 underline decoration-purple-500/50 hover:decoration-purple-300 underline-offset-2 transition-all cursor-pointer inline-flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-purple-500 rounded"
              title="Click to view AKITS company profile, services and portfolio"
            >
              <span>AKITS (Anitesh Karak IT Solution)</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => navigateTo('terms')}
              className="hover:text-purple-300 underline decoration-slate-700 hover:decoration-purple-400 transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => navigateTo('privacy')}
              className="hover:text-purple-300 underline decoration-slate-700 hover:decoration-purple-400 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
          <p className="text-center md:text-right max-w-xl text-slate-400">
            A digital match or relationship status is not a legally binding or real-world commitment. Collage Story complies with India's Digital Personal Data Protection Act, 2023. No video calling or location tracking.
          </p>
        </div>

        {/* AKITS Company Information, Services & Portfolio Modal */}
        <AkitsModal
          isOpen={isAkitsModalOpen}
          onClose={() => setIsAkitsModalOpen(false)}
        />
      </div>
    </footer>
  );
};

export default Footer;
