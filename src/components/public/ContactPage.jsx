import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Mail, MapPin, Send, ShieldCheck } from 'lucide-react';

export const ContactPage = () => {
  const { navigateTo, addToast } = useApp();
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Support', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    addToast('Your support query has been logged. Our student support team will reply within 24 hours.', 'success');
    setFormData({ name: '', email: '', subject: 'Support', message: '' });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigateTo('landing')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <span className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2 block">
        Support & Redressal
      </span>
      <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white mb-2">
        Contact & Grievance Support
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-8">
        Have questions, feedback, or need moderation assistance? We are here to help.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Contact Info */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            <Mail className="w-5 h-5 text-rose-500 mb-2" />
            <p className="font-bold text-slate-900 dark:text-white">General Support</p>
            <p className="text-slate-500 mt-1">support@college-india.app</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="font-bold text-slate-900 dark:text-white">DPDP Grievance Officer</p>
            <p className="text-slate-500 mt-1">grievance@college-india.app</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Statutory 48-hr response target</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            <MapPin className="w-5 h-5 text-purple-500 mb-2" />
            <p className="font-bold text-slate-900 dark:text-white">Campus Headquarters</p>
            <p className="text-slate-500 mt-1">Kharagpur & Kolkata, West Bengal, India</p>
          </div>
        </div>

        {/* Message Form */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
            Send an Inquiry
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College Email or Registered Mobile
              </label>
              <input
                type="text"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Support">Account or Technical Support</option>
                <option value="Safety">Safety or Moderation Concern</option>
                <option value="DPDP">DPDP Personal Data Request</option>
                <option value="Campus">College Campus Ambassador</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can our team help you today?"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 gradient-brand-bg text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 hover:brightness-105"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;
