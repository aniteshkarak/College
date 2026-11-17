import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Megaphone,
  PlusCircle,
  Pin,
  ThumbsUp,
  GraduationCap,
  Lock,
  Search,
  Filter,
  Calendar,
  X,
  Share2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const CampusBoard = () => {
  const { currentUser, announcements, handleCreateAnnouncement, handleUpvoteAnnouncement, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', category: 'Campus Event', content: '' });

  const categories = ['All', 'Cultural Fest', 'Debate & Lit', 'Lost & Found', 'Social Event', 'Academic Notice'];

  // Strictly filter by user's college
  const collegeAnnouncements = announcements.filter(
    (a) => a.college_name === currentUser.college_name
  );

  const filteredAnnouncements = collegeAnnouncements.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' ? true : a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleSubmitPost = (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    handleCreateAnnouncement(newPost);
    setNewPost({ title: '', category: 'Campus Event', content: '' });
    setIsPostModalOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      
      {/* College Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden border border-rose-900/40">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-300 text-[11px] font-semibold mb-3">
              <Lock className="w-3.5 h-3.5" /> Campus-Exclusive Group
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-rose-400" />
              <span>{currentUser.college_name} Campus Board</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Automatic broadcast hub for your college. No external students can view or post. Strictly announcements—no chat spam or distractions.
            </p>
          </div>

          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-5 py-3 rounded-2xl gradient-brand-bg text-white text-xs font-bold shadow-lg shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Make Announcement</span>
          </button>
        </div>

        {/* Protection disclaimer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Only verified students of {currentUser.college_name} are added to this board.</span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campus notices, fests, items..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-sm ${
                ann.pinned
                  ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ann.badge_color || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ann.category}
                  </span>
                  {ann.pinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      <Pin className="w-3 h-3 fill-rose-500" /> Pinned
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {ann.date}
                </span>
              </div>

              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2 leading-snug">
                {ann.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                {ann.content}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {ann.author_name}
                  </span>
                  <span>•</span>
                  <span className="text-[11px] text-slate-400">{ann.author_role}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpvoteAnnouncement(ann.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                    <span>{ann.upvotes}</span>
                  </button>
                  <button
                    onClick={() => addToast('Notice link copied to clipboard!', 'info')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Share notice"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Megaphone className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              No announcements in this category
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Be the first to share campus fest updates, auditions, or notices!
            </p>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-bold"
            >
              Post Announcement
            </button>
          </div>
        )}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-950 animate-slide-up">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Post to {currentUser.college_name} Board
                </h3>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Cultural Fest">Cultural Fest</option>
                  <option value="Debate & Lit">Debate & Lit</option>
                  <option value="Sports Tournament">Sports Tournament</option>
                  <option value="Lost & Found">Lost & Found</option>
                  <option value="Academic Notice">Academic Notice</option>
                  <option value="Social Event">Social Event</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Headline
                </label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="e.g. Band night auditions this Friday at Kalidas Auditorium..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Include dates, venue, contact details, or audition requirements..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500">
                Notice: Campus Board is strictly for announcements. No 1-on-1 messaging or chatting is enabled in this group.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 gradient-brand-bg text-white font-bold rounded-xl shadow"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default CampusBoard;
