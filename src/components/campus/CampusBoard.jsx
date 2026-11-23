import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon,
  Edit3,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';

export const CampusBoard = () => {
  const {
    currentUser,
    announcements,
    boardInfo,
    dailyAllowance,
    refreshCampusBoard,
    handleCreateAnnouncement,
    handleUpdateAnnouncement,
    handleDeleteAnnouncement,
    handleUpvoteAnnouncement,
    addToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Post State
  const [newPost, setNewPost] = useState({
    title: '',
    category: 'Campus Event',
    content: '',
    isUrgent: false,
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Edit Post State
  const [editingPost, setEditingPost] = useState(null);

  const categories = [
    'All',
    'Cultural Fest',
    'Debate & Lit',
    'Sports Tournament',
    'Lost & Found',
    'Social Event',
    'Academic Notice',
    'Campus Club'
  ];

  const collegeName =
    currentUser?.college_name ||
    boardInfo?.collegeName ||
    currentUser?.education?.collegeName ||
    'Your College';

  // Strictly filter by user's verified college
  const collegeAnnouncements = (announcements || []).filter(
    (a) =>
      !a.college_name ||
      !collegeName ||
      a.college_name.trim().toLowerCase() === collegeName.trim().toLowerCase()
  );

  const filteredAnnouncements = collegeAnnouncements.filter((a) => {
    const title = (a.title || '').toLowerCase();
    const content = (a.content || '').toLowerCase();
    const authorName = (a.author_name || a.author?.displayName || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchSearch =
      title.includes(query) || content.includes(query) || authorName.includes(query);
    const matchCat = selectedCategory === 'All' ? true : a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshCampusBoard) {
      await refreshCampusBoard();
    }
    setIsRefreshing(false);
    addToast('Campus Board refreshed with latest notices.', 'info');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype || file.type)) {
      addToast('Please upload a valid image file (JPEG, PNG, or WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image attachment cannot exceed 5MB.', 'error');
      return;
    }

    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      addToast('Please provide both headline and details for your announcement.', 'error');
      return;
    }

    if (dailyAllowance?.isLimitReached) {
      addToast('You have reached your daily announcement limit. You can post again tomorrow.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleCreateAnnouncement(newPost, selectedImageFile);
      setNewPost({ title: '', category: 'Campus Event', content: '', isUrgent: false });
      handleRemoveImage();
      setIsPostModalOpen(false);
    } catch (err) {
      // Error toast is handled in AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPost || !editingPost.title.trim() || !editingPost.content.trim()) return;

    setIsSubmitting(true);
    try {
      await handleUpdateAnnouncement(editingPost.id, {
        title: editingPost.title,
        content: editingPost.content,
        category: editingPost.category,
        isUrgent: editingPost.isUrgent,
      });
      setEditingPost(null);
    } catch (err) {
      // Handled in AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (annId) => {
    if (window.confirm('Are you sure you want to delete this announcement? Note: deleting will remove it from the feed, but does not restore today\'s posting allowance.')) {
      try {
        await handleDeleteAnnouncement(annId);
      } catch (err) {
        // Handled in AppContext
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      
      {/* College Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl mb-6 relative overflow-hidden border border-rose-900/40">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-300 text-[11px] font-semibold">
                <Lock className="w-3.5 h-3.5" /> Campus-Exclusive Group
              </span>

              {/* Daily Limit Counter Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  dailyAllowance?.isLimitReached
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
                title="Resets at midnight in Asia/Kolkata timezone"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{dailyAllowance?.message || 'Announcements used today: 0/5'}</span>
              </span>
            </div>

            <h1 className="font-display font-bold text-xl sm:text-3xl tracking-tight flex items-center gap-2">
              <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" />
              <span>{collegeName} Campus Board</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Automatic broadcast hub for verified {collegeName} students. No external colleges can view or post.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center justify-center border border-white/10 shrink-0"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsPostModalOpen(true)}
              disabled={dailyAllowance?.isLimitReached}
              className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                dailyAllowance?.isLimitReached
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                  : 'gradient-brand-bg text-white shadow-rose-600/30 hover:brightness-110 active:scale-95'
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{dailyAllowance?.isLimitReached ? 'Daily Limit Reached' : 'Make Announcement'}</span>
            </button>
          </div>
        </div>

        {/* Protection disclaimer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Only approved students of {collegeName} belong to this shared board.</span>
          </div>
          {boardInfo?.memberCount && (
            <span className="text-slate-300 font-semibold">
              {boardInfo.memberCount} verified member{boardInfo.memberCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Daily limit reached banner if at 5/5 */}
      {dailyAllowance?.isLimitReached && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Daily posting allowance exhausted:</span> You have reached your daily announcement limit (5/5). You can post again tomorrow after midnight (Asia/Kolkata).
          </div>
        </div>
      )}

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
          filteredAnnouncements.map((ann) => {
            const isAuthor =
              ann.isOwner ||
              ann.authorId === currentUser?.id ||
              ann.author_name === currentUser?.display_name;

            return (
              <div
                key={ann.id}
                className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-sm ${
                  ann.isUrgent || ann.pinned
                    ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {ann.category}
                    </span>
                    {(ann.isUrgent || ann.is_urgent) && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <Pin className="w-3 h-3 fill-amber-500" /> Urgent Notice
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {ann.date || 'Recent'}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2 leading-snug">
                  {ann.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                  {ann.content}
                </p>

                {/* Optional Image Attachment */}
                {(ann.imageUrl || ann.image_url) && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-80 bg-slate-100 dark:bg-slate-950">
                    <img
                      src={ann.imageUrl || ann.image_url}
                      alt={ann.title}
                      className="w-full h-auto object-cover max-h-80"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 min-w-0 max-w-[65%] sm:max-w-none">
                    {/* Author Avatar */}
                    {ann.author?.avatarUrl || ann.author_avatar ? (
                      <img
                        src={ann.author?.avatarUrl || ann.author_avatar}
                        alt={ann.author_name}
                        className="w-7 h-7 rounded-full object-cover border border-rose-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full gradient-brand-bg text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {(ann.author_name || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-xs min-w-0 truncate">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {ann.author_name || ann.author?.displayName || 'Campus Student'}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
                        • {ann.author_role || ann.author?.course || 'Student'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Author Edit / Delete Controls */}
                    {isAuthor && (
                      <div className="flex items-center gap-1 mr-2 border-r border-slate-200 dark:border-slate-700 pr-2">
                        <button
                          onClick={() =>
                            setEditingPost({
                              id: ann.id,
                              title: ann.title,
                              category: ann.category,
                              content: ann.content,
                              isUrgent: ann.isUrgent || ann.is_urgent || false,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit your announcement (does not consume daily allowance)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleUpvoteAnnouncement(ann.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                      <span>{ann.upvotes || 0}</span>
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
            );
          })
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Megaphone className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              No announcements in this category
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Be the first to share campus fest updates, auditions, or notices with {collegeName}!
            </p>
            <button
              onClick={() => setIsPostModalOpen(true)}
              disabled={dailyAllowance?.isLimitReached}
              className="px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Post Announcement
            </button>
          </div>
        )}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950 animate-slide-up max-h-[90dvh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Post to {collegeName} Board
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsPostModalOpen(false);
                  handleRemoveImage();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daily limit badge inside modal */}
            <div className="mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">
                Daily Posting Limit (Asia/Kolkata):
              </span>
              <span className={`font-bold ${dailyAllowance?.isLimitReached ? 'text-amber-500' : 'text-emerald-500'}`}>
                {dailyAllowance?.usedToday || 0} / 5 used today
              </span>
            </div>

            <form onSubmit={handleSubmitPost} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Campus Event">Campus Event</option>
                  <option value="Cultural Fest">Cultural Fest</option>
                  <option value="Debate & Lit">Debate & Lit</option>
                  <option value="Sports Tournament">Sports Tournament</option>
                  <option value="Lost & Found">Lost & Found</option>
                  <option value="Academic Notice">Academic Notice</option>
                  <option value="Social Event">Social Event</option>
                  <option value="Campus Club">Campus Club</option>
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
                  maxLength={150}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  maxLength={3000}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Optional Image Upload */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Poster / Image Attachment (Max 5MB)
                </label>
                {imagePreviewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-rose-200 dark:border-rose-900 max-h-48">
                    <img src={imagePreviewUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl hover:border-rose-400 cursor-pointer bg-slate-50 dark:bg-slate-800/50 transition-colors">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-[11px] text-slate-500">Click to upload fest poster, flyer, or photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Urgent Notice Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgentToggle"
                  checked={newPost.isUrgent}
                  onChange={(e) => setNewPost({ ...newPost, isUrgent: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <label htmlFor="urgentToggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Mark as Urgent Notice
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsPostModalOpen(false);
                    handleRemoveImage();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || dailyAllowance?.isLimitReached}
                  className="px-5 py-2 gradient-brand-bg text-white font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Broadcasting...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EDIT ANNOUNCEMENT MODAL */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950 animate-slide-up max-h-[90dvh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Announcement
                </h3>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
              Note: Editing your existing announcement does not consume today's posting allowance.
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Headline
                </label>
                <input
                  type="text"
                  required
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  maxLength={150}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  maxLength={3000}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 gradient-brand-bg text-white font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
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
