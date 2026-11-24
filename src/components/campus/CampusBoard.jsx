import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import {
  Megaphone,
  PlusCircle,
  Pin,
  ThumbsUp,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Lock,
  Search,
  Filter,
  Calendar,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon,
  Edit3,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  UploadCloud,
  Send,
  Flag,
  MapPin,
  User,
  Tag,
  HelpCircle,
  BookOpen,
  Award,
  Layers,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  PartyPopper
} from 'lucide-react';

export const CampusBoard = () => {
  const {
    currentUser,
    announcements,
    setAnnouncements,
    boardInfo,
    dailyAllowance,
    refreshCampusBoard,
    handleCreateAnnouncement,
    handleUpdateAnnouncement,
    handleDeleteAnnouncement,
    handleToggleLikePost,
    handleToggleSavePost,
    addToast,
  } = useApp();

  // Navigation Tabs: 'feed' | 'events' | 'saved'
  const [activeTab, setActiveTab] = useState('feed');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostType, setSelectedPostType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Post Modals State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Post Form
  const [newPost, setNewPost] = useState({
    title: '',
    postType: 'POST',
    category: 'General',
    content: '',
    isUrgent: false,
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Edit Post State
  const [editingPost, setEditingPost] = useState(null);

  // Comments State (open comment drawers per post id)
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState(null);
  const [postCommentsMap, setPostCommentsMap] = useState({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState(null);
  const [newCommentText, setNewCommentText] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Events State
  const [campusEvents, setCampusEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventCategoryFilter, setEventCategoryFilter] = useState('All');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    category: 'Cultural Fest',
    eventDate: '',
    location: '',
    organizer: '',
  });
  const [selectedPosterFile, setSelectedPosterFile] = useState(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState(null);

  // Saved Posts State
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Report Modal
  const [reportingTarget, setReportingTarget] = useState(null); // { type: 'POST'|'COMMENT', id: string }
  const [reportReason, setReportReason] = useState('');
  const [reportCategory, setReportCategory] = useState('INAPPROPRIATE');

  // Deep Link Highlight
  const [highlightedPostId, setHighlightedPostId] = useState(null);

  const collegeName =
    currentUser?.college_name ||
    boardInfo?.collegeName ||
    currentUser?.education?.collegeName ||
    'Your College';

  const categories = [
    'All',
    'General',
    'Cultural Fest',
    'Debate & Lit',
    'Sports Tournament',
    'Lost & Found',
    'Social Event',
    'Academic Notice',
    'Campus Club',
  ];

  const postTypes = [
    { id: 'ALL', label: 'All Posts' },
    { id: 'POST', label: 'Discussions' },
    { id: 'QUESTION', label: 'Questions' },
    { id: 'STUDY', label: 'Study Groups' },
    { id: 'ANNOUNCEMENT', label: 'Notices' },
  ];

  const eventCategories = [
    'All',
    'Cultural Fest',
    'Technical',
    'Workshops',
    'Sports',
    'Competitions',
    'Student Meetups',
  ];

  // Check URL query parameters for deep linking (?post=<id>)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const deepPostId = urlParams.get('post');
      if (deepPostId) {
        setHighlightedPostId(deepPostId);
        setActiveTab('feed');
        setTimeout(() => {
          const el = document.getElementById(`post-${deepPostId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, []);

  // Fetch Events when Events tab is active
  useEffect(() => {
    if (activeTab === 'events') {
      loadEvents();
    } else if (activeTab === 'saved') {
      loadSavedPosts();
    }
  }, [activeTab]);

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await api.campus.getEvents();
      if (res?.data?.events) {
        setCampusEvents(res.data.events);
      }
    } catch (err) {
      console.warn('Failed to load campus events:', err.message);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const loadSavedPosts = async () => {
    setIsLoadingSaved(true);
    try {
      const res = await api.campus.getSavedPosts();
      if (res?.data?.posts) {
        setSavedPosts(res.data.posts);
      }
    } catch (err) {
      console.warn('Failed to load saved posts:', err.message);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Strictly filter announcements for user's verified college
  const collegeAnnouncements = useMemo(() => {
    return (announcements || []).filter((a) => {
      if (!a.college_name && !a.collegeName) return true;
      const cName = a.college_name || a.collegeName;
      return !collegeName || cName.trim().toLowerCase() === collegeName.trim().toLowerCase();
    });
  }, [announcements, collegeName]);

  const filteredAnnouncements = useMemo(() => {
    return collegeAnnouncements.filter((a) => {
      const title = (a.title || '').toLowerCase();
      const content = (a.content || '').toLowerCase();
      const authorName = (a.author_name || a.author?.displayName || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchSearch =
        title.includes(query) || content.includes(query) || authorName.includes(query);
      const matchCat = selectedCategory === 'All' ? true : a.category === selectedCategory;
      const matchType =
        selectedPostType === 'ALL'
          ? true
          : (a.postType || a.post_type || 'POST').toUpperCase() === selectedPostType;

      return matchSearch && matchCat && matchType;
    });
  }, [collegeAnnouncements, searchQuery, selectedCategory, selectedPostType]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshCampusBoard) {
      await refreshCampusBoard();
    }
    if (activeTab === 'events') {
      await loadEvents();
    } else if (activeTab === 'saved') {
      await loadSavedPosts();
    }
    setIsRefreshing(false);
    addToast('Campus Board refreshed with live college updates.', 'info');
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

  const handlePosterSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype || file.type)) {
      addToast('Please upload a valid image (JPEG, PNG, or WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Event poster cannot exceed 5MB.', 'error');
      return;
    }

    setSelectedPosterFile(file);
    setPosterPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePoster = () => {
    setSelectedPosterFile(null);
    if (posterPreviewUrl) {
      URL.revokeObjectURL(posterPreviewUrl);
      setPosterPreviewUrl(null);
    }
  };

  // Submit Post
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      addToast('Please provide both headline and details for your post.', 'error');
      return;
    }

    const isQuotaRestricted =
      newPost.postType === 'ANNOUNCEMENT' || newPost.isUrgent || newPost.category === 'Academic Notice';

    if (isQuotaRestricted && dailyAllowance?.isLimitReached) {
      addToast('You have reached your daily announcement limit. You can post standard discussions or questions anytime!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleCreateAnnouncement(newPost, selectedImageFile);
      setNewPost({ title: '', postType: 'POST', category: 'General', content: '', isUrgent: false });
      handleRemoveImage();
      setIsPostModalOpen(false);
    } catch (err) {
      // Handled in AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit Post
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPost || !editingPost.title.trim() || !editingPost.content.trim()) return;

    setIsSubmitting(true);
    try {
      await handleUpdateAnnouncement(editingPost.id, {
        title: editingPost.title,
        content: editingPost.content,
        category: editingPost.category,
        postType: editingPost.postType,
        isUrgent: editingPost.isUrgent,
      });
      setEditingPost(null);
    } catch (err) {
      // Handled in AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Post
  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post from your campus feed?')) {
      try {
        await handleDeleteAnnouncement(postId);
      } catch (err) {}
    }
  };

  // Comments Handling
  const toggleCommentsDrawer = async (postId) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
      return;
    }

    setExpandedCommentsPostId(postId);
    if (!postCommentsMap[postId]) {
      setLoadingCommentsPostId(postId);
      try {
        const res = await api.campus.getComments(postId);
        if (res?.data?.comments) {
          setPostCommentsMap((prev) => ({
            ...prev,
            [postId]: res.data.comments,
          }));
        }
      } catch (err) {
        console.warn('Failed to load comments:', err.message);
      } finally {
        setLoadingCommentsPostId(null);
      }
    }
  };

  const handleAddComment = async (postId) => {
    const text = (newCommentText[postId] || '').trim();
    if (!text) return;

    try {
      const res = await api.campus.createComment(postId, text);
      if (res?.data?.comment) {
        const comment = res.data.comment;
        setPostCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment],
        }));
        setNewCommentText((prev) => ({ ...prev, [postId]: '' }));

        // Update post comment count locally
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === postId
              ? {
                  ...a,
                  commentsCount: (a.commentsCount || 0) + 1,
                  comments_count: (a.comments_count || 0) + 1,
                }
              : a
          )
        );
      }
    } catch (err) {
      addToast(err.message || 'Could not post comment', 'error');
    }
  };

  const handleEditComment = async (postId, commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const res = await api.campus.updateComment(commentId, editingCommentText.trim());
      if (res?.data?.comment) {
        setPostCommentsMap((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).map((c) => (c.id === commentId ? res.data.comment : c)),
        }));
        setEditingCommentId(null);
        setEditingCommentText('');
        addToast('Comment updated.', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Could not update comment', 'error');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Remove this comment?')) return;
    try {
      await api.campus.deleteComment(commentId);
      setPostCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === postId
            ? {
                ...a,
                commentsCount: Math.max(0, (a.commentsCount || 1) - 1),
                comments_count: Math.max(0, (a.comments_count || 1) - 1),
              }
            : a
        )
      );
      addToast('Comment deleted.', 'info');
    } catch (err) {
      addToast(err.message || 'Could not delete comment', 'error');
    }
  };

  // Submit Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.description.trim()) {
      addToast('Please enter an event title and description.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let payload;
      if (selectedPosterFile) {
        const formData = new FormData();
        formData.append('title', newEvent.title.trim());
        formData.append('description', newEvent.description.trim());
        formData.append('category', newEvent.category);
        if (newEvent.eventDate) formData.append('eventDate', newEvent.eventDate);
        if (newEvent.location) formData.append('location', newEvent.location.trim());
        if (newEvent.organizer) formData.append('organizer', newEvent.organizer.trim());
        formData.append('image', selectedPosterFile);
        payload = formData;
      } else {
        payload = {
          title: newEvent.title.trim(),
          description: newEvent.description.trim(),
          category: newEvent.category,
          eventDate: newEvent.eventDate || undefined,
          location: newEvent.location.trim() || 'Campus Auditorium',
          organizer: newEvent.organizer.trim() || currentUser?.display_name || 'Campus Community',
        };
      }

      const res = await api.campus.createEvent(payload);
      if (res?.data?.event) {
        setCampusEvents((prev) => [res.data.event, ...prev]);
        addToast('Campus event published! 🎉', 'success');
      }
      setIsEventModalOpen(false);
      setNewEvent({
        title: '',
        description: '',
        category: 'Cultural Fest',
        eventDate: '',
        location: '',
        organizer: '',
      });
      handleRemovePoster();
    } catch (err) {
      addToast(err.message || 'Could not create event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this campus event?')) return;
    try {
      await api.campus.deleteEvent(eventId);
      setCampusEvents((prev) => prev.filter((e) => e.id !== eventId));
      addToast('Campus event removed.', 'info');
    } catch (err) {
      addToast(err.message || 'Could not delete event', 'error');
    }
  };

  // Copy Shareable Link
  const handleCopyLink = (postId) => {
    const url = `${window.location.origin}/campus-board?post=${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast('Direct link to this post copied to clipboard! 📋', 'success');
    }).catch(() => {
      addToast(`Direct post link: /campus-board?post=${postId}`, 'info');
    });
  };

  // Report Handling
  const handleSubmitReport = async () => {
    if (!reportingTarget) return;
    try {
      if (reportingTarget.type === 'POST') {
        await api.campus.reportPost(reportingTarget.id, {
          category: reportCategory,
          reason: reportReason.trim() || 'Reported for review',
        });
      } else {
        await api.campus.reportComment(reportingTarget.id, {
          category: reportCategory,
          reason: reportReason.trim() || 'Reported for review',
        });
      }
      addToast('Report submitted to campus moderation team.', 'success');
      setReportingTarget(null);
      setReportReason('');
    } catch (err) {
      addToast(err.message || 'Could not submit report', 'error');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-fade-in">
      
      {/* College Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl mb-5 sm:mb-6 relative overflow-hidden border border-rose-900/40">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-300 text-[11px] font-semibold">
                <Lock className="w-3.5 h-3.5" /> Verified Campus Exclusive
              </span>

              {/* Daily Limit Badge for Official Notices */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                  dailyAllowance?.isLimitReached
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
                title="Only applies to official announcements. Discussions and questions are unlimited."
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Notice Quota: {dailyAllowance?.usedToday || 0}/5 today</span>
              </span>
            </div>

            <h1 className="font-display font-bold text-xl sm:text-3xl tracking-tight flex items-center gap-2">
              <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" />
              <span>{collegeName} Community</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Private community board for verified students of {collegeName}. Share discussions, study resources, ask questions, or broadcast official notices.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-all flex items-center justify-center border border-white/10 shrink-0 active:scale-95"
              title="Refresh feed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsPostModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-bold shadow-lg gradient-brand-bg text-white shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Create Post</span>
            </button>
          </div>
        </div>

        {/* Board Meta & Member Count */}
        <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Students from other colleges cannot view or join discussions.</span>
          </div>
          {boardInfo?.memberCount && (
            <span className="text-slate-300 font-semibold">
              {boardInfo.memberCount} verified member{boardInfo.memberCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-5 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'feed'
              ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Campus Feed</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
            {collegeAnnouncements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'events'
              ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PartyPopper className="w-4 h-4" />
          <span>Events & Fests</span>
          {campusEvents.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
              {campusEvents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Posts</span>
        </button>
      </div>

      {/* TAB 1: CAMPUS FEED */}
      {activeTab === 'feed' && (
        <>
          {/* Post Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
            {postTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedPostType(type.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedPostType === type.id
                    ? 'gradient-brand-bg text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notices, questions, study notes..."
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

          {/* Posts Stream */}
          <div className="space-y-4">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((post) => {
                const isAuthor =
                  post.isOwner ||
                  post.authorId === currentUser?.id ||
                  post.author_name === currentUser?.display_name;

                const postType = (post.postType || post.post_type || 'POST').toUpperCase();
                const isCommentsOpen = expandedCommentsPostId === post.id;
                const comments = postCommentsMap[post.id] || post.comments || [];
                const isHighlighted = highlightedPostId === post.id;

                return (
                  <div
                    key={post.id}
                    id={`post-${post.id}`}
                    className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-sm ${
                      isHighlighted
                        ? 'border-rose-500 ring-4 ring-rose-500/20'
                        : post.isUrgent || post.is_urgent
                        ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Post Header: Badges & Date */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Post Type Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          postType === 'QUESTION'
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : postType === 'STUDY'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : postType === 'ANNOUNCEMENT'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {postType}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {post.category}
                        </span>

                        {post.isOfficial && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <ShieldCheck className="w-3 h-3 text-amber-500" /> Official Notice
                          </span>
                        )}

                        {(post.isUrgent || post.is_urgent) && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <Pin className="w-3 h-3 fill-rose-500" /> Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {post.date || 'Recent'}
                        </span>
                        
                        {/* Report Post Trigger */}
                        <button
                          onClick={() => setReportingTarget({ type: 'POST', id: post.id })}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Report post"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Post Title */}
                    <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2 leading-snug">
                      {post.title}
                    </h3>

                    {/* Post Content */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Optional Image */}
                    {(post.imageUrl || post.image_url) && (
                      <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-96 bg-slate-100 dark:bg-slate-950">
                        <img
                          src={post.imageUrl || post.image_url}
                          alt={post.title}
                          className="w-full h-auto object-cover max-h-96"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Post Footer: Author, Like, Comment, Save, Share */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      
                      {/* Author Info */}
                      <div className="flex items-center gap-2 min-w-0 max-w-[55%] sm:max-w-none">
                        {post.author?.avatarUrl || post.author_avatar ? (
                          <img
                            src={post.author?.avatarUrl || post.author_avatar}
                            alt={post.author_name}
                            className="w-7 h-7 rounded-full object-cover border border-rose-500/30 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full gradient-brand-bg text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {(post.author_name || 'S').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="text-xs min-w-0 truncate">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                            {post.author_name || post.author?.displayName || 'Campus Student'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {post.author_role || post.author?.course || 'Student'}
                          </span>
                        </div>
                      </div>

                      {/* Interaction Controls */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        
                        {/* Author Controls */}
                        {isAuthor && (
                          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-1.5">
                            <button
                              onClick={() =>
                                setEditingPost({
                                  id: post.id,
                                  title: post.title,
                                  category: post.category,
                                  postType: post.postType || 'POST',
                                  content: post.content,
                                  isUrgent: post.isUrgent || post.is_urgent || false,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit post"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title="Delete post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Like Button */}
                        <button
                          onClick={() => handleToggleLikePost(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            post.isLiked || post.is_liked
                              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${post.isLiked || post.is_liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                          <span>{post.likesCount ?? post.likes_count ?? post.upvotes ?? 0}</span>
                        </button>

                        {/* Comment Drawer Toggle */}
                        <button
                          onClick={() => toggleCommentsDrawer(post.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isCommentsOpen
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{post.commentsCount ?? post.comments_count ?? 0}</span>
                        </button>

                        {/* Bookmark / Save */}
                        <button
                          onClick={() => handleToggleSavePost(post.id)}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            post.isSaved || post.is_saved
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-500'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                          title={post.isSaved || post.is_saved ? 'Bookmarked' : 'Save post'}
                        >
                          <Bookmark className={`w-4 h-4 ${post.isSaved || post.is_saved ? 'fill-amber-500' : ''}`} />
                        </button>

                        {/* Direct Share Link */}
                        <button
                          onClick={() => handleCopyLink(post.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          title="Copy shareable link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                      </div>
                    </div>

                    {/* EXPANDABLE COMMENTS DRAWER */}
                    {isCommentsOpen && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-slide-down">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Campus Discussions ({comments.length})</span>
                          </h4>
                          <span className="text-[10px] text-slate-400">Own college only</span>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mb-3 scrollbar-thin">
                          {loadingCommentsPostId === post.id ? (
                            <div className="text-center py-4 text-xs text-slate-400">Loading replies...</div>
                          ) : comments.length > 0 ? (
                            comments.map((comment) => {
                              const isCommentAuthor =
                                comment.isOwner || comment.authorId === currentUser?.id;
                              const isEditing = editingCommentId === comment.id;

                              return (
                                <div
                                  key={comment.id}
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-slate-900 dark:text-white">
                                        {comment.author?.displayName || 'Student'}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        • {comment.author?.course || 'Campus Member'}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-400">
                                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                      </span>

                                      {isCommentAuthor && !isEditing && (
                                        <div className="flex items-center gap-0.5 ml-1">
                                          <button
                                            onClick={() => {
                                              setEditingCommentId(comment.id);
                                              setEditingCommentText(comment.content);
                                            }}
                                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            title="Edit comment"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteComment(post.id, comment.id)}
                                            className="p-1 text-rose-400 hover:text-rose-600"
                                            title="Delete comment"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}

                                      <button
                                        onClick={() => setReportingTarget({ type: 'COMMENT', id: comment.id })}
                                        className="p-1 text-slate-400 hover:text-rose-500"
                                        title="Report comment"
                                      >
                                        <Flag className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {isEditing ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <input
                                        type="text"
                                        value={editingCommentText}
                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                        maxLength={1000}
                                      />
                                      <button
                                        onClick={() => handleEditComment(post.id, comment.id)}
                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingCommentId(null)}
                                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-slate-700 dark:text-slate-300 leading-snug">
                                      {comment.content}
                                    </p>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-3 text-xs text-slate-400">
                              No comments yet. Start the conversation!
                            </div>
                          )}
                        </div>

                        {/* Add Comment Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newCommentText[post.id] || ''}
                            onChange={(e) =>
                              setNewCommentText({ ...newCommentText, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            placeholder="Add your reply or question..."
                            maxLength={1000}
                            className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="p-2 gradient-brand-bg text-white rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all"
                            title="Post reply"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Megaphone className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  No posts found in this section
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Be the first to share questions, discussions, or fest updates with {collegeName}!
                </p>
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow active:scale-95 transition-all"
                >
                  Create First Post
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: CAMPUS EVENTS & FESTS */}
      {activeTab === 'events' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-rose-500" />
                <span>Upcoming Campus Events & Fests</span>
              </h2>
              <p className="text-xs text-slate-500">
                Fests, hackathons, sports tournaments, and club activities happening at {collegeName}.
              </p>
            </div>

            <button
              onClick={() => setIsEventModalOpen(true)}
              className="px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host an Event</span>
            </button>
          </div>

          {/* Events Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {eventCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setEventCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  eventCategoryFilter === cat
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Events Cards Grid */}
          {isLoadingEvents ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading campus events...</div>
          ) : campusEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campusEvents
                .filter((evt) =>
                  eventCategoryFilter === 'All' ? true : evt.category === eventCategoryFilter
                )
                .map((evt) => {
                  const isAuthor =
                    evt.isOwner || evt.authorId === currentUser?.id;

                  return (
                    <div
                      key={evt.id}
                      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      {evt.posterUrl || evt.poster_url ? (
                        <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
                          <img
                            src={evt.posterUrl || evt.poster_url}
                            alt={evt.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                            {evt.category}
                          </span>
                        </div>
                      ) : (
                        <div className="h-24 w-full bg-gradient-to-r from-rose-900/40 via-purple-900/40 to-slate-900/40 p-3 flex items-start justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                            {evt.category}
                          </span>
                        </div>
                      )}

                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {evt.eventDate
                                ? new Date(evt.eventDate).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Upcoming'}
                            </span>
                            {evt.isOfficial && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                                Official
                              </span>
                            )}
                          </div>

                          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-1.5 leading-snug">
                            {evt.title}
                          </h3>

                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-3">
                            {evt.description}
                          </p>

                          <div className="space-y-1 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{evt.location || 'Campus Auditorium'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">Organized by: {evt.organizer || 'Student Committee'}</span>
                            </div>
                          </div>
                        </div>

                        {isAuthor && (
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Event
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <PartyPopper className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                No events posted yet
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Be the first to list a college fest, club workshop, or sports tournament!
              </p>
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="px-4 py-2 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow"
              >
                Host an Event
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED POSTS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" />
              <span>Bookmarked Posts</span>
            </h2>
            <span className="text-xs text-slate-400">
              {savedPosts.length} saved
            </span>
          </div>

          {isLoadingSaved ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading saved posts...</div>
          ) : savedPosts.length > 0 ? (
            savedPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {post.category}
                  </span>
                  <button
                    onClick={() => {
                      handleToggleSavePost(post.id);
                      setSavedPosts((prev) => prev.filter((p) => p.id !== post.id));
                    }}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-rose-500" /> Remove Bookmark
                  </button>
                </div>

                <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-2">
                  {post.content}
                </p>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>By {post.author_name || post.author?.displayName || 'Student'}</span>
                  <span>•</span>
                  <span>{post.date || 'Recent'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                No saved posts yet
              </h4>
              <p className="text-xs text-slate-500">
                Click the bookmark icon on any campus feed post to save it for quick reference!
              </p>
            </div>
          )}
        </div>
      )}

      {/* CREATE POST MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950 animate-slide-up max-h-[92dvh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Post to {collegeName} Community
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

            {/* Post Type Selector Pills */}
            <div className="mb-4">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                Post Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'POST', label: 'Discussion', desc: 'Unlimited' },
                  { id: 'QUESTION', label: 'Question', desc: 'Unlimited' },
                  { id: 'STUDY', label: 'Study Group', desc: 'Unlimited' },
                  { id: 'ANNOUNCEMENT', label: 'Notice', desc: '5/day quota' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNewPost({ ...newPost, postType: t.id })}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      newPost.postType === t.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-[10px] opacity-75">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily limit badge if notice selected */}
            {newPost.postType === 'ANNOUNCEMENT' && (
              <div className="mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  Notice Daily Limit (Asia/Kolkata):
                </span>
                <span className={`font-bold ${dailyAllowance?.isLimitReached ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {dailyAllowance?.usedToday || 0} / 5 used today
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitPost} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="General">General</option>
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
                  Title / Headline
                </label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="e.g. Seeking teammates for Inter-college Hackathon or Kalidas play auditions..."
                  maxLength={150}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content / Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Share details, dates, venue, contact info, or discussion points..."
                  maxLength={3000}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Optional Image Upload */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Poster / Image (Max 5MB)
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
                  <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl hover:border-rose-400 cursor-pointer bg-slate-50 dark:bg-slate-800/50 transition-colors">
                    <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[11px] text-slate-500">Attach photo, flyer, or infographic</span>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 gradient-brand-bg text-white font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Publish Post'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EDIT POST MODAL */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950 animate-slide-up max-h-[90dvh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Post
                </h3>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title
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
                  Content
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

      {/* CREATE EVENT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950 animate-slide-up max-h-[92dvh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Host a Campus Event
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsEventModalOpen(false);
                  handleRemovePoster();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Annual Cultural Fest 'Echoes 2026' or Inter-departmental Cricket Cup"
                  maxLength={150}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Cultural Fest">Cultural Fest</option>
                    <option value="Technical">Technical</option>
                    <option value="Workshops">Workshops</option>
                    <option value="Sports">Sports</option>
                    <option value="Competitions">Competitions</option>
                    <option value="Student Meetups">Student Meetups</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="e.g. Main Auditorium, Ground 2"
                    maxLength={150}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organizer / Club
                  </label>
                  <input
                    type="text"
                    value={newEvent.organizer}
                    onChange={(e) => setNewEvent({ ...newEvent, organizer: e.target.value })}
                    placeholder="e.g. Literary Club, IEEE Chapter"
                    maxLength={100}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Registration Info
                </label>
                <textarea
                  rows={3}
                  required
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Detail schedules, rules, entry criteria, prizes, or registration links..."
                  maxLength={3000}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Event Poster Upload */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Banner / Poster (Max 5MB)
                </label>
                {posterPreviewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-rose-200 dark:border-rose-900 max-h-40">
                    <img src={posterPreviewUrl} alt="Poster" className="w-full h-auto object-cover max-h-40" />
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl hover:border-rose-400 cursor-pointer bg-slate-50 dark:bg-slate-800/50 transition-colors">
                    <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[11px] text-slate-500">Upload festival banner or poster</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePosterSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEventModalOpen(false);
                    handleRemovePoster();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 gradient-brand-bg text-white font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-sm w-full p-4 sm:p-6 shadow-2xl border border-rose-100 dark:border-rose-950 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Report {reportingTarget.type === 'POST' ? 'Post' : 'Comment'}
                </h3>
              </div>
              <button
                onClick={() => setReportingTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Report
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="INAPPROPRIATE">Inappropriate Content</option>
                  <option value="HARASSMENT">Harassment or Bullying</option>
                  <option value="SPAM">Spam or Promotion</option>
                  <option value="MISINFORMATION">Misinformation</option>
                  <option value="OTHER">Other Violation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain why this content violates community safety rules..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportingTarget(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CampusBoard;
