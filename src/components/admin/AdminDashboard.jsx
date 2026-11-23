import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api, getStoredAdminUser } from '../../services/api';
import AdminLogin from './AdminLogin';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Clock,
  Sparkles,
  ArrowLeft,
  FileCheck2,
  Image as ImageIcon,
  Check,
  X,
  Building,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  UserCheck,
  UserX,
  RefreshCw,
  ZoomIn,
  ShieldCheck,
  GraduationCap,
  MapPin,
  ExternalLink,
  ChevronRight,
  Info,
  LogOut,
  Database,
  Lock,
  Activity
} from 'lucide-react';

/**
 * Secure Admin Asset Image component
 * Automatically fetches private storage assets using admin Bearer token,
 * or displays standard URL for public/demo assets.
 */
const AdminAssetImage = ({ src, applicationId, assetType, assetId, alt, className, onClick }) => {
  const [imgUrl, setImgUrl] = useState(src || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!src) return;

    // If it's already a full HTTP URL or blob/data URL, use directly
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:') || src.startsWith('data:')) {
      setImgUrl(src);
      return;
    }

    // Otherwise, fetch private asset from backend vault using admin token
    if (applicationId && assetId) {
      setIsLoading(true);
      const url = assetType === 'document'
        ? api.admin.getDocumentUrl(applicationId, assetId)
        : api.admin.getPhotoUrl(applicationId, assetId);

      api.admin.fetchPrivateAssetBlob(url)
        .then((blobUrl) => {
          if (isMounted) {
            setImgUrl(blobUrl);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setImgUrl('');
            setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [src, applicationId, assetType, assetId]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 ${className}`}>
        <RefreshCw className="w-5 h-5 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!imgUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 ${className}`}>
        <ImageIcon className="w-5 h-5 opacity-40" />
      </div>
    );
  }

  return <img src={imgUrl} alt={alt || 'Asset'} className={className} onClick={onClick} />;
};

/**
 * Helper to normalize backend Prisma application vs frontend mock application fields
 */
const normalizeApplication = (app) => {
  if (!app) return null;

  const photos = app.photographs || [];
  const photo1 = photos.find((p) => p.photoOrder === 1)?.photoUrl || app.photo_1 || app.photo1;
  const photo2 = photos.find((p) => p.photoOrder === 2)?.photoUrl || app.photo_2 || app.photo2;
  const photo3 = photos.find((p) => p.photoOrder === 3)?.photoUrl || app.photo_3 || app.photo3;

  const idDoc = app.identityDocument;
  const idDocUrl = idDoc?.filePath || app.verification_id_url || app.documentUrl;
  const idDocType = idDoc?.documentType || app.verification_id_type || app.documentType || 'College Student ID';

  return {
    ...app,
    id: app.id,
    application_id: app.applicationId || app.application_id || app.id,
    legal_name: app.legalName || app.legal_name || app.full_name,
    display_name: app.displayName || app.display_name,
    date_of_birth: app.dateOfBirth
      ? (typeof app.dateOfBirth === 'string' ? app.dateOfBirth.split('T')[0] : new Date(app.dateOfBirth).toISOString().split('T')[0])
      : app.date_of_birth,
    age: app.age,
    gender: app.gender,
    city: app.city,
    state: app.state,
    languages_spoken: app.languagesSpoken || app.languages_spoken || ['English', 'Hindi'],
    email: app.email,
    mobile: app.mobileNumber || app.mobile,
    college_name: app.collegeName || app.college_name,
    university_name: app.universityName || app.university_name,
    degree_name: app.degreeName || app.degree_name || app.course,
    department_stream: app.departmentStream || app.department_stream,
    academic_year: app.academicYear || app.academic_year,
    current_semester: app.currentSemester || app.current_semester,
    graduation_year: app.graduationYear || app.graduation_year,
    student_status: app.studentStatus || app.student_status,
    bio: app.bio,
    interests: app.interests || [],
    hobbies: app.hobbies || [],
    looking_for: app.lookingFor || app.looking_for,
    status: app.status,
    assigned_admin: app.assignedAdminId || app.assigned_admin,
    submitted_at: app.submittedAt || app.submitted_at,
    review_deadline: app.reviewDeadline || app.review_deadline,
    rejection_reason: app.rejectionReason || app.rejection_reason,
    correction_message: app.correctionMessage || app.correction_message,
    correction_fields: app.correctionFields || app.correction_fields || [],
    verification_id_url: idDocUrl,
    verification_id_type: idDocType,
    identityDocumentId: idDoc?.id,
    photo_1: photo1,
    photo_2: photo2,
    photo_3: photo3,
    photo1_id: photos.find((p) => p.photoOrder === 1)?.id,
    photo2_id: photos.find((p) => p.photoOrder === 2)?.id,
    photo3_id: photos.find((p) => p.photoOrder === 3)?.id,
  };
};

export const AdminDashboard = () => {
  const {
    adminMetrics,
    adminReports,
    adminAuditLogs,
    navigateTo,
    addToast,
    pendingVerifications
  } = useApp();

  // Administrator Session State
  const [adminUser, setAdminUser] = useState(() => getStoredAdminUser());
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Applications State (fetched from PostgreSQL API)
  const [liveApplications, setLiveApplications] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState(null);

  // UI Tabs & Filters
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications' | 'overview' | 'reports' | 'logs'
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Action 1: Approval Confirmation Checklist Modal
  const [approveModalApp, setApproveModalApp] = useState(null);
  const [approvalChecklist, setApprovalChecklist] = useState({
    age18: false,
    education: false,
    idLegible: false,
    threePhotos: false,
    consents: false
  });
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Action 2: Reject Modal
  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectCategory, setRejectCategory] = useState('Ineligible / Under 18');
  const [rejectReasonText, setRejectReasonText] = useState('');

  // Action 3: Request Correction Modal
  const [correctionModalApp, setCorrectionModalApp] = useState(null);
  const [selectedCorrectionFields, setSelectedCorrectionFields] = useState([]);
  const [correctionNoteText, setCorrectionNoteText] = useState('');

  // Safety Reports state
  const [selectedReport, setSelectedReport] = useState(null);

  // -------------------------------------------------------------
  // Data Fetching: Live Applications & Platform Metrics
  // -------------------------------------------------------------
  const loadLiveData = useCallback(async () => {
    setIsRefreshing(true);
    let connected = false;

    // 1. Fetch Live Applications from PostgreSQL backend
    try {
      const res = await api.admin.listApplications({
        status: verificationFilter === 'OVERDUE' ? 'ALL' : verificationFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res && res.success && res.data) {
        connected = true;
        const normalized = (res.data.applications || []).map(normalizeApplication);
        setLiveApplications(normalized);
        if (res.data.metrics) {
          setLiveMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.warn('Backend live application fetch error:', err.message);
    }

    // 2. If Super Admin, fetch live metrics
    if (adminUser?.roleName === 'SUPER_ADMIN') {
      try {
        const metricsRes = await api.admin.getMetrics();
        if (metricsRes && metricsRes.success && metricsRes.data) {
          connected = true;
          setLiveMetrics(metricsRes.data.metrics);
        }
      } catch (err) {
        // Verification Admin or non-superadmin will get 403 on metrics per audit rules
      }
    }

    setIsBackendConnected(connected);
    setIsRefreshing(false);
  }, [verificationFilter, searchQuery, adminUser?.roleName]);

  useEffect(() => {
    if (adminUser) {
      loadLiveData();
    }
  }, [adminUser, loadLiveData]);

  // If not logged in as Administrator, render AdminLogin view
  if (!adminUser) {
    return (
      <AdminLogin
        onLoginSuccess={(admin) => {
          setAdminUser(admin);
          addToast(`Logged in as ${admin.fullName} (${admin.roleName})`, 'success');
        }}
        onCancel={() => navigateTo('landing')}
      />
    );
  }

  const handleAdminLogout = () => {
    api.admin.logout();
    setAdminUser(null);
    addToast('Administrator session ended.', 'info');
  };

  // Applications list: use live applications if backend connected; fallback to normalized local
  const currentApplications = isBackendConnected
    ? liveApplications
    : pendingVerifications.map(normalizeApplication);

  // Helper: compute remaining review hours and overdue state (72 hours target)
  const getDeadlineStatus = (deadlineIso, status) => {
    if (!deadlineIso) return { text: 'N/A', isOverdue: false, hours: 0 };
    if (['APPROVED', 'REJECTED'].includes(status)) {
      return { text: 'Completed', isOverdue: false, hours: 0 };
    }
    const diffMs = new Date(deadlineIso) - new Date();
    const hours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffMs < 0) {
      return {
        text: `Overdue by ${Math.abs(hours)}h`,
        isOverdue: true,
        hours: Math.abs(hours)
      };
    }
    return {
      text: `${hours}h remaining`,
      isOverdue: false,
      hours
    };
  };

  // Metrics computation
  const totalApps = currentApplications.length;
  const pendingApps = currentApplications.filter((v) => v.status === 'PENDING_REVIEW').length;
  const underReviewApps = currentApplications.filter((v) => v.status === 'UNDER_REVIEW').length;
  const needsCorrectionApps = currentApplications.filter((v) => v.status === 'NEEDS_CORRECTION').length;
  const resubmittedApps = currentApplications.filter((v) => v.status === 'RESUBMITTED').length;
  const approvedApps = currentApplications.filter((v) => v.status === 'APPROVED').length;
  const rejectedApps = currentApplications.filter((v) => v.status === 'REJECTED').length;
  const overdueApps = currentApplications.filter(
    (v) =>
      ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(v.status) &&
      new Date(v.review_deadline) < new Date()
  ).length;

  // Filtered applications
  const filteredVerifications = currentApplications.filter((app) => {
    if (verificationFilter === 'OVERDUE') {
      const isOverdue =
        ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(app.status) &&
        new Date(app.review_deadline) < new Date();
      if (!isOverdue) return false;
    } else if (verificationFilter !== 'ALL' && app.status !== verificationFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = (app.application_id || app.id || '').toLowerCase().includes(q);
      const matchName = (app.legal_name || app.full_name || '').toLowerCase().includes(q);
      const matchDisplay = (app.display_name || '').toLowerCase().includes(q);
      const matchEmail = (app.email || '').toLowerCase().includes(q);
      const matchCollege = (app.college_name || '').toLowerCase().includes(q);
      return matchId || matchName || matchDisplay || matchEmail || matchCollege;
    }

    return true;
  });

  // Action Handlers (Live Backend + Local State Synchronization)
  const handleStartReview = async (app) => {
    setIsSubmittingAction(true);
    try {
      await api.admin.claim(app.id);
      addToast(`Review claimed for application ${app.application_id}`, 'success');
      loadLiveData();
    } catch (err) {
      console.warn('Backend claim review error:', err.message);
      addToast(err.message || 'Unable to claim application review.', 'warning');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleOpenApproveModal = (app) => {
    setApproveModalApp(app);
    setApprovalChecklist({
      age18: false,
      education: false,
      idLegible: false,
      threePhotos: false,
      consents: false
    });
  };

  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!approveModalApp) return;
    const allChecked = Object.values(approvalChecklist).every(Boolean);
    if (!allChecked) {
      addToast('Please confirm all 5 verification conditions in the checklist.', 'warning');
      return;
    }

    setIsSubmittingAction(true);
    try {
      await api.admin.approve(approveModalApp.id);
      addToast(`Application ${approveModalApp.application_id} approved! Active student account created. 🎉`, 'success');
      setApproveModalApp(null);
      if (selectedApplication && selectedApplication.id === approveModalApp.id) {
        setSelectedApplication(null);
      }
      loadLiveData();
    } catch (err) {
      addToast(err.message || 'Approval transaction failed.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleOpenRejectModal = (app) => {
    setRejectModalApp(app);
    setRejectCategory('Ineligible / Under 18');
    setRejectReasonText('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalApp) return;
    if (!rejectReasonText.trim()) {
      addToast('Mandatory rejection explanation is required.', 'warning');
      return;
    }

    setIsSubmittingAction(true);
    const fullReason = `[${rejectCategory}] ${rejectReasonText.trim()}`;
    try {
      await api.admin.reject(rejectModalApp.id, fullReason);
      addToast(`Application ${rejectModalApp.application_id} was rejected. Notice dispatched to applicant.`, 'info');
      setRejectModalApp(null);
      if (selectedApplication && selectedApplication.id === rejectModalApp.id) {
        setSelectedApplication(null);
      }
      loadLiveData();
    } catch (err) {
      addToast(err.message || 'Rejection request failed.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleOpenCorrectionModal = (app) => {
    setCorrectionModalApp(app);
    setSelectedCorrectionFields([]);
    setCorrectionNoteText('');
  };

  const toggleCorrectionField = (field) => {
    setSelectedCorrectionFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleConfirmCorrection = async (e) => {
    e.preventDefault();
    if (!correctionModalApp) return;
    if (selectedCorrectionFields.length === 0) {
      addToast('Please select at least one field requiring correction.', 'warning');
      return;
    }
    if (!correctionNoteText.trim()) {
      addToast('Please provide an instruction note for the applicant.', 'warning');
      return;
    }

    setIsSubmittingAction(true);
    try {
      await api.admin.requestCorrection(
        correctionModalApp.id,
        selectedCorrectionFields,
        correctionNoteText.trim()
      );
      addToast(`Correction request dispatched for application ${correctionModalApp.application_id}.`, 'info');
      setCorrectionModalApp(null);
      if (selectedApplication && selectedApplication.id === correctionModalApp.id) {
        setSelectedApplication(null);
      }
      loadLiveData();
    } catch (err) {
      addToast(err.message || 'Correction request failed.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const renderStatusBadge = (status, isOverdue) => {
    let bg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    let label = status;

    switch (status) {
      case 'PENDING_REVIEW':
        bg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
        label = 'Pending Review';
        break;
      case 'UNDER_REVIEW':
        bg = 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800';
        label = 'Under Review';
        break;
      case 'NEEDS_CORRECTION':
        bg = 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-800';
        label = 'Needs Correction';
        break;
      case 'RESUBMITTED':
        bg = 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800';
        label = 'Resubmitted';
        break;
      case 'APPROVED':
        bg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
        label = 'Approved & Active';
        break;
      case 'REJECTED':
        bg = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
        label = 'Rejected';
        break;
      default:
        break;
    }

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${bg}`}>
          {label}
        </span>
        {isOverdue && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
            OVERDUE
          </span>
        )}
      </div>
    );
  };

  // Role permissions check
  const isSuperAdmin = adminUser.roleName === 'SUPER_ADMIN';
  const canPerformReviews = ['SUPER_ADMIN', 'VERIFICATION_ADMIN'].includes(adminUser.roleName);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 animate-fade-in">
      
      {/* Top Administrator Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('landing')}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
            title="Exit Admin Portal / Return to Collage Story Website"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                Collage Story Admin & Verification Portal
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                adminUser.roleName === 'SUPER_ADMIN'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                  : adminUser.roleName === 'VERIFICATION_ADMIN'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
              }`}>
                {adminUser.roleName}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isBackendConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200'
              }`}>
                <Database className="w-3 h-3" />
                {isBackendConnected ? 'PostgreSQL Live' : 'Local Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Signed in as <strong>{adminUser.fullName}</strong> ({adminUser.email}) • Strict 72-Hour Verification Protocol
            </p>
          </div>
        </div>

        {/* Action Controls: Refresh, Tab Switcher, Logout */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadLiveData}
            disabled={isRefreshing}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Refresh Live Data from Backend"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="px-3 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900"
            title="Sign out of Admin Session"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto w-full md:w-auto scrollbar-none">
            {[
              { id: 'verifications', label: `Queue (${pendingApps + underReviewApps + resubmittedApps})` },
              { id: 'overview', label: 'Platform Metrics' },
              { id: 'reports', label: `Safety Reports (${adminReports.length})` },
              { id: 'logs', label: 'Audit Trail' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Role Warning for SUPPORT_ADMIN */}
      {!canPerformReviews && (
        <div className="mb-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-blue-600" />
          <span>
            You are signed in with the <strong>SUPPORT_ADMIN</strong> role. Application review and approval actions are restricted to <strong>VERIFICATION_ADMIN</strong> and <strong>SUPER_ADMIN</strong>.
          </span>
        </div>
      )}

      {/* Overdue Urgent Alert Banner */}
      {overdueApps > 0 && activeTab === 'verifications' && (
        <div className="mb-5 p-4 rounded-3xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-900 flex items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-red-900 dark:text-red-200">
                High Priority: {overdueApps} Application{overdueApps > 1 ? 's' : ''} Exceeded the 72-Hour SLA
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300">
                These applicants submitted more than 72 hours ago without resolution. Please inspect immediately to maintain platform SLA.
              </p>
            </div>
          </div>
          <button
            onClick={() => setVerificationFilter('OVERDUE')}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs transition-colors"
          >
            Filter Overdue ({overdueApps})
          </button>
        </div>
      )}

      {/* -------------------- 1. APPLICATION VERIFICATION QUEUE TAB -------------------- */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">

          {/* 72-Hour Review Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {[
              { id: 'ALL', label: 'Total', count: totalApps, color: 'text-slate-900 dark:text-white', bg: 'bg-white dark:bg-slate-900' },
              { id: 'PENDING_REVIEW', label: 'Pending', count: pendingApps, color: 'text-amber-600', bg: 'bg-amber-50/60 dark:bg-amber-950/30' },
              { id: 'UNDER_REVIEW', label: 'In Review', count: underReviewApps, color: 'text-blue-600', bg: 'bg-blue-50/60 dark:bg-blue-950/30' },
              { id: 'NEEDS_CORRECTION', label: 'Correction', count: needsCorrectionApps, color: 'text-orange-600', bg: 'bg-orange-50/60 dark:bg-orange-950/30' },
              { id: 'RESUBMITTED', label: 'Resubmitted', count: resubmittedApps, color: 'text-purple-600', bg: 'bg-purple-50/60 dark:bg-purple-950/30' },
              { id: 'APPROVED', label: 'Approved', count: approvedApps, color: 'text-emerald-600', bg: 'bg-emerald-50/60 dark:bg-emerald-950/30' },
              { id: 'REJECTED', label: 'Rejected', count: rejectedApps, color: 'text-rose-600', bg: 'bg-rose-50/60 dark:bg-rose-950/30' },
              { id: 'OVERDUE', label: 'Overdue >72h', count: overdueApps, color: 'text-red-600 font-extrabold', bg: 'bg-red-100/70 dark:bg-red-950/50 border border-red-300 dark:border-red-900' }
            ].map((stat) => (
              <button
                key={stat.id}
                onClick={() => setVerificationFilter(stat.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${stat.bg} ${
                  verificationFilter === stat.id
                    ? 'border-purple-600 dark:border-purple-400 ring-2 ring-purple-600/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className={`text-xl font-extrabold mt-0.5 block ${stat.color}`}>
                  {stat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Sub-filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, name, email or college..."
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500 font-semibold">
                Showing {filteredVerifications.length} of {totalApps} Applications
              </span>
              {verificationFilter !== 'ALL' && (
                <button
                  onClick={() => setVerificationFilter('ALL')}
                  className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Table / List of Applications */}
          {filteredVerifications.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                No Applications Match this Filter
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                All student registrations in this criteria have been resolved or do not exist.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-4">App ID</th>
                      <th className="py-3.5 px-4">Applicant</th>
                      <th className="py-3.5 px-4">College & Education</th>
                      <th className="py-3.5 px-4">Submitted</th>
                      <th className="py-3.5 px-4">72h SLA Deadline</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Assigned Admin</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filteredVerifications.map((app) => {
                      const deadlineInfo = getDeadlineStatus(app.review_deadline, app.status);
                      const isPendingState = ['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(app.status);

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* 1. App ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                            {app.application_id || app.id}
                          </td>

                          {/* 2. Applicant */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <AdminAssetImage
                                src={app.photo_1}
                                applicationId={app.id}
                                assetType="photo"
                                assetId={app.photo1_id}
                                alt="Avatar"
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{app.legal_name || app.full_name}</span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                                    ({app.age}y)
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 block">
                                  "{app.display_name}" • {app.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. College & Degree */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={app.college_name}>
                              {app.college_name}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {app.degree_name || app.course} • {app.academic_year || '1st Year'}
                            </span>
                          </td>

                          {/* 4. Submitted */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {app.submitted_at
                              ? new Date(app.submitted_at).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Recent'}
                          </td>

                          {/* 5. 72h SLA Deadline */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {deadlineInfo.isOverdue ? (
                              <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{deadlineInfo.text}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{deadlineInfo.text}</span>
                              </div>
                            )}
                          </td>

                          {/* 6. Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {renderStatusBadge(app.status, deadlineInfo.isOverdue)}
                          </td>

                          {/* 7. Assigned Admin */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                            {app.assigned_admin ? (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                                {app.assigned_admin}
                              </span>
                            ) : isPendingState && canPerformReviews ? (
                              <button
                                onClick={() => handleStartReview(app)}
                                disabled={isSubmittingAction}
                                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Claim Review</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                            )}
                          </td>

                          {/* 8. Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Full Review Details Modal */}
                              <button
                                onClick={() => setSelectedApplication(app)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                                title="Inspect Sections A to F"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Review</span>
                              </button>

                              {isPendingState && canPerformReviews && (
                                <>
                                  <button
                                    onClick={() => handleOpenApproveModal(app)}
                                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-xl transition-colors"
                                    title="Approve & Activate Account"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenCorrectionModal(app)}
                                    className="p-1.5 bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 rounded-xl transition-colors"
                                    title="Request Correction"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenRejectModal(app)}
                                    className="p-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 rounded-xl transition-colors"
                                    title="Reject Application"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* -------------------- 2. OVERVIEW METRICS TAB -------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Non-Super Admin notice */}
          {!isSuperAdmin && (
            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Platform-Wide Metrics Gated (Audit Rule 2)</p>
                <p className="mt-0.5 text-amber-700 dark:text-amber-300 leading-relaxed">
                  Full server statistics, database sizes, and financial metrics are restricted to <strong>SUPER_ADMIN</strong>. You are currently logged in as <strong>{adminUser.roleName}</strong>. Application-level metrics remain visible below.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Pending ID Verifications Spotlight */}
            <div
              onClick={() => {
                setActiveTab('verifications');
                setVerificationFilter('PENDING_REVIEW');
              }}
              className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs cursor-pointer hover:brightness-105 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Pending Applications
                </span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-amber-900 dark:text-amber-100 mt-2">
                {pendingApps + underReviewApps + resubmittedApps}
              </p>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1 inline-block">
                Needs Admin Approval →
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Verified Users</span>
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {(liveMetrics?.totalUsers || adminMetrics.total_users || 0).toLocaleString()}
              </p>
              <span className="text-xs text-emerald-600 font-bold mt-1 inline-block">
                {isBackendConnected ? 'PostgreSQL Active Users' : 'Verified Profiles'}
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Campus Matches</span>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {(liveMetrics?.totalMatches || adminMetrics.total_matches || 0).toLocaleString()}
              </p>
              <span className="text-xs text-purple-600 font-bold mt-1 inline-block">
                Mutual Student Matches
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safety Reports</span>
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
                {liveMetrics?.pendingReports || adminReports.length}
              </p>
              <span className="text-xs text-rose-500 font-bold mt-1 inline-block">
                Active Flags for Review
              </span>
            </div>

          </div>

          {/* SLA Compliance Box */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              72-Hour Verification SLA Compliance
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every applicant to Collage Story is guaranteed a decision within 72 hours. All applications older than 72 hours are automatically flagged as <strong>OVERDUE</strong> for priority resolution. Manual human inspection protects the campus community from non-students, underage individuals, and fake profiles.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Target Decision SLA</span>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">72 Hours (3 Days)</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Approval Mechanism</span>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">100% Human Administrator</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400">Document Privacy</span>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">Private Vault & Bearer Protected</p>
              </div>
            </div>
          </div>

          {/* Privacy Notice regarding Chat inspection */}
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-3xl text-xs text-purple-900 dark:text-purple-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-purple-600 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Admin Trust & Privacy Boundary (PRD Section 6.2):</p>
              <p className="leading-relaxed">
                "Admin must not have unrestricted access to private conversations. Access to message content is strictly restricted to necessary, documented safety investigations with appropriate authorization and tamper-evident audit logging."
              </p>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- 3. SAFETY REPORTS TAB -------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              User Safety & Moderation Reports
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="pb-3">ID / Time</th>
                  <th className="pb-3">Reported User</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adminReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-mono text-[11px] text-slate-500">
                      {report.id}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {report.reported_user}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                        {report.category}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {report.description}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold hover:bg-purple-100"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- 4. AUDIT LOGS TAB -------------------- */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-600" />
                Immutable Administrative Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological log of all administrator decisions, approvals, corrections, and rejections.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl font-mono text-xs font-bold">
              Audit Trail Active
            </span>
          </div>

          <div className="space-y-3">
            {adminAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md font-mono text-slate-700 dark:text-slate-300">
                      {log.admin}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Details: {log.reason}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL APPLICATION REVIEW MODAL (SECTIONS A TO F)                           */}
      {/* ========================================================================= */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-extrabold text-sm text-purple-600 dark:text-purple-400">
                    {selectedApplication.application_id || selectedApplication.id}
                  </span>
                  {renderStatusBadge(
                    selectedApplication.status,
                    getDeadlineStatus(selectedApplication.review_deadline, selectedApplication.status).isOverdue
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted by <strong>{selectedApplication.legal_name || selectedApplication.full_name}</strong> • 100% Human Administrator Review
                </p>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body - SECTIONS A TO F */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              
              {/* SECTION A: APPLICANT OVERVIEW */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 space-y-2">
                <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Section A: Application & 72-Hour Timeline Overview
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Application ID</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedApplication.application_id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Submission Date</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedApplication.submitted_at || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Review SLA Deadline</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {getDeadlineStatus(selectedApplication.review_deadline, selectedApplication.status).text}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Reviewer</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedApplication.assigned_admin || 'Unassigned'}
                    </p>
                  </div>
                </div>

                {selectedApplication.rejection_reason && (
                  <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200">
                    <span className="font-bold">Prior Rejection Reason:</span> "{selectedApplication.rejection_reason}"
                  </div>
                )}
                {selectedApplication.correction_message && (
                  <div className="mt-2 p-2.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900 rounded-xl text-orange-800 dark:text-orange-200">
                    <span className="font-bold">Pending Correction Request:</span> "{selectedApplication.correction_message}"
                  </div>
                )}
              </div>

              {/* SECTION B: PERSONAL INFORMATION */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-rose-500" />
                  Section B: Personal Information & Age Verification
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Full Legal Name</span>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedApplication.legal_name || selectedApplication.full_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Preferred Display Name</span>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedApplication.display_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Date of Birth & Age</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold">{selectedApplication.date_of_birth}</span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold rounded-md text-[10px]">
                        {selectedApplication.age} yrs • 18+ OK
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Gender</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedApplication.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Current City & State</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedApplication.city || 'Kolkata'}, {selectedApplication.state || 'West Bengal'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Languages Spoken</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {Array.isArray(selectedApplication.languages_spoken)
                        ? selectedApplication.languages_spoken.join(', ')
                        : 'English, Bengali, Hindi'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedApplication.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Mobile Phone</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      +91 {selectedApplication.mobile}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Looking For</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedApplication.looking_for || 'Friendship'}</p>
                  </div>
                </div>
              </div>

              {/* SECTION C: COLLEGE & EDUCATION INFORMATION */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  Section C: College and Education Verification
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Institution Name</span>
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {selectedApplication.college_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Affiliated University</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedApplication.university_name || 'Autonomous / Deemed'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Degree / Program</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedApplication.degree_name || selectedApplication.course}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Stream / Department</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedApplication.department_stream || 'General Stream'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Academic Progress</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedApplication.academic_year || '1st Year'} • {selectedApplication.current_semester || 'Sem 1'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Graduation Year</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedApplication.graduation_year || 2026}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Student Status</span>
                    <p className="font-semibold text-emerald-600 font-bold">
                      {selectedApplication.student_status || 'CURRENTLY_STUDYING'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">College Location</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedApplication.college_location || selectedApplication.city}, {selectedApplication.college_state || selectedApplication.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION D: IDENTITY DOCUMENT REVIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Section D: Identity Verification Document (Private Vault)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Vault Encrypted • Never Exposed to Public
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group shrink-0">
                    <AdminAssetImage
                      src={selectedApplication.verification_id_url}
                      applicationId={selectedApplication.id}
                      assetType="document"
                      assetId={selectedApplication.identityDocumentId}
                      alt="Student ID Document"
                      className="w-48 h-32 object-cover rounded-xl border-2 border-purple-500 shadow-md cursor-pointer hover:opacity-90"
                      onClick={() =>
                        setPreviewImageModal({
                          src: selectedApplication.verification_id_url,
                          applicationId: selectedApplication.id,
                          assetType: 'document',
                          assetId: selectedApplication.identityDocumentId,
                          title: `${selectedApplication.legal_name || selectedApplication.full_name} - ${selectedApplication.verification_id_type}`
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        setPreviewImageModal({
                          src: selectedApplication.verification_id_url,
                          applicationId: selectedApplication.id,
                          assetType: 'document',
                          assetId: selectedApplication.identityDocumentId,
                          title: `${selectedApplication.legal_name || selectedApplication.full_name} - ${selectedApplication.verification_id_type}`
                        })
                      }
                      className="absolute inset-0 bg-black/40 text-white rounded-xl flex items-center justify-center gap-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ZoomIn className="w-5 h-5" />
                      <span>Inspect High-Res</span>
                    </button>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Submitted Document Type</span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {selectedApplication.verification_id_type || 'College Student ID Card'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Applicant Verification Status</span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {selectedApplication.status === 'APPROVED' ? 'Verified & Authenticated by Admin' : 'Pending verification by authorized officer.'}
                      </p>
                    </div>
                    <div className="pt-1 flex items-center gap-2 text-emerald-600 font-semibold text-[11px]">
                      <Check className="w-4 h-4" />
                      <span>Applicant explicitly consented to identity verification & 72-hour review</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION E: THREE-PHOTO VERIFICATION REVIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    Section E: Three-Photo Face Verification (Exactly 3 Mandatory Photos)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Verify facial consistency across all 3 photos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  
                  {/* Photo 1: Avatar */}
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1">
                      <span>Photo 1 (Profile Avatar)</span>
                      <span className="text-purple-600">Primary</span>
                    </div>
                    <div className="relative group">
                      <AdminAssetImage
                        src={selectedApplication.photo_1}
                        applicationId={selectedApplication.id}
                        assetType="photo"
                        assetId={selectedApplication.photo1_id}
                        alt="Photo 1"
                        className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90"
                        onClick={() =>
                          setPreviewImageModal({
                            src: selectedApplication.photo_1,
                            applicationId: selectedApplication.id,
                            assetType: 'photo',
                            assetId: selectedApplication.photo1_id,
                            title: `${selectedApplication.legal_name || selectedApplication.full_name} - Photo 1 (Avatar)`
                          })
                        }
                      />
                      <button
                        onClick={() =>
                          setPreviewImageModal({
                            src: selectedApplication.photo_1,
                            applicationId: selectedApplication.id,
                            assetType: 'photo',
                            assetId: selectedApplication.photo1_id,
                            title: `${selectedApplication.legal_name || selectedApplication.full_name} - Photo 1 (Avatar)`
                          })
                        }
                        className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="w-3 h-3" /> Zoom
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Clear frontal face portrait</p>
                  </div>

                  {/* Photo 2: Personal 1 */}
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1">
                      <span>Photo 2 (Campus/Casual)</span>
                      <span className="text-slate-400">Secondary</span>
                    </div>
                    <div className="relative group">
                      <AdminAssetImage
                        src={selectedApplication.photo_2}
                        applicationId={selectedApplication.id}
                        assetType="photo"
                        assetId={selectedApplication.photo2_id}
                        alt="Photo 2"
                        className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90"
                        onClick={() =>
                          setPreviewImageModal({
                            src: selectedApplication.photo_2,
                            applicationId: selectedApplication.id,
                            assetType: 'photo',
                            assetId: selectedApplication.photo2_id,
                            title: `${selectedApplication.legal_name || selectedApplication.full_name} - Photo 2 (Campus)`
                          })
                        }
                      />
                      <button
                        onClick={() =>
                          setPreviewImageModal({
                            src: selectedApplication.photo_2,
                            applicationId: selectedApplication.id,
                            assetType: 'photo',
                            assetId: selectedApplication.photo2_id,
                            title: `${selectedApplication.legal_name || selectedApplication.full_name} - Photo 2 (Campus)`
                          })
                        }
                        className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="w-3 h-3" /> Zoom
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Campus life or daily activity</p>
                  </div>

                  {/* Photo 3: Personal 2 */}
                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1">
                      <span>Photo 3 (Social/Hobbies)</span>
                      <span className="text-slate-400">Secondary</span>
                    </div>
                    <div className="relative group">
                      <AdminAssetImage
                        src={selectedApplication.photo_3}
                        applicationId={selectedApplication.id}
                        assetType="photo"
                        assetId={selectedApplication.photo3_id}
                        alt="Photo 3"
                        className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90"
                        onClick={() =>
                          setPreviewImageModal({
                            src: selectedApplication.photo_3,
                            applicationId: selectedApplication.id,
                            assetType: 'photo',
                            assetId: selectedApplication.photo3_id,
                            title: `${selectedApplication.legal_name || selectedApplication.full_name} - Photo 3 (Social)`
                          })
                        }
                      />
                      <button
                        onClick={() =>
                          setPreviewImageModal({
                            src: selectedApplication.photo_3,
                            applicationId: selectedApplication.id,
                            assetType: 'photo',
                            assetId: selectedApplication.photo3_id,
                            title: `${selectedApplication.legal_name || selectedApplication.full_name} - Photo 3 (Social)`
                          })
                        }
                        className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="w-3 h-3" /> Zoom
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Authentic candid or hobby</p>
                  </div>

                </div>
              </div>

              {/* SECTION F: BIO & PREFERENCES */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Section F: Bio, Interests & Profile Verification
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Student Bio</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs mt-0.5 leading-relaxed">
                      "{selectedApplication.bio || 'College student looking to meet peers.'}"
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Interests & Hobbies</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(selectedApplication.interests || ['Music', 'Coding', 'Travelling']).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions Bar */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-semibold">
                Logged in as <strong>{adminUser.fullName}</strong> ({adminUser.roleName})
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Action 4: Claim / Mark Under Review */}
                {selectedApplication.status === 'PENDING_REVIEW' && canPerformReviews && (
                  <button
                    onClick={() => handleStartReview(selectedApplication)}
                    disabled={isSubmittingAction}
                    className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Claim Review</span>
                  </button>
                )}

                {/* Action 3: Request Correction */}
                {['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(selectedApplication.status) && canPerformReviews && (
                  <button
                    onClick={() => handleOpenCorrectionModal(selectedApplication)}
                    disabled={isSubmittingAction}
                    className="px-3.5 py-2 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 text-orange-700 dark:text-orange-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-orange-200 dark:border-orange-900"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Request Correction</span>
                  </button>
                )}

                {/* Action 2: Reject Application */}
                {['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(selectedApplication.status) && canPerformReviews && (
                  <button
                    onClick={() => handleOpenRejectModal(selectedApplication)}
                    disabled={isSubmittingAction}
                    className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                )}

                {/* Action 1: Approve Application */}
                {['PENDING_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(selectedApplication.status) && canPerformReviews && (
                  <button
                    onClick={() => handleOpenApproveModal(selectedApplication)}
                    disabled={isSubmittingAction}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Application</span>
                  </button>
                )}

                {selectedApplication.status === 'APPROVED' && (
                  <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1">
                    <Check className="w-4 h-4" /> Application Approved & Account Active
                  </span>
                )}

                {!canPerformReviews && (
                  <span className="text-xs text-slate-400 italic">
                    Read-Only View (Requires VERIFICATION_ADMIN role)
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTION 1: APPROVAL CONFIRMATION CHECKLIST MODAL                          */}
      {/* ========================================================================= */}
      {approveModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 dark:border-emerald-800 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Approve Application & Activate Account
                </h3>
                <p className="text-xs text-slate-500">
                  {approveModalApp.legal_name || approveModalApp.full_name} ({approveModalApp.application_id})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Before approving, administrator must confirm all 5 verification conditions. Approving immediately creates the user's active database record, activates discovery privileges, and grants access to the campus community.
            </p>

            <form onSubmit={handleConfirmApproval} className="space-y-3 text-xs">
              
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalChecklist.age18}
                  onChange={(e) => setApprovalChecklist({ ...approvalChecklist, age18: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  <strong>1. Age 18+ Verified:</strong> DOB is {approveModalApp.date_of_birth} ({approveModalApp.age} years). Applicant meets India 18+ eligibility.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalChecklist.education}
                  onChange={(e) => setApprovalChecklist({ ...approvalChecklist, education: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  <strong>2. College Verified:</strong> Verified enrollment at {approveModalApp.college_name} ({approveModalApp.degree_name || approveModalApp.course}).
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalChecklist.idLegible}
                  onChange={(e) => setApprovalChecklist({ ...approvalChecklist, idLegible: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  <strong>3. ID Legible & Authentic:</strong> {approveModalApp.verification_id_type || 'ID Card'} document is clear, non-fraudulent, and matches student details.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalChecklist.threePhotos}
                  onChange={(e) => setApprovalChecklist({ ...approvalChecklist, threePhotos: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  <strong>4. All 3 Photographs Compliant:</strong> Exactly 3 photos present, showing consistent facial appearance without impersonation or inappropriate content.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalChecklist.consents}
                  onChange={(e) => setApprovalChecklist({ ...approvalChecklist, consents: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  <strong>5. Consents & DPDP Compliance:</strong> Platform terms, 72-hour review consent, and DPDP 2023 data processing recorded.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setApproveModalApp(null)}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!Object.values(approvalChecklist).every(Boolean) || isSubmittingAction}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isSubmittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm & Create Active Account</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTION 2: REJECT APPLICATION MODAL                                        */}
      {/* ========================================================================= */}
      {rejectModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-300 dark:border-rose-900 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                <X className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Reject Application
                </h3>
                <p className="text-xs text-slate-500">
                  {rejectModalApp.legal_name || rejectModalApp.full_name} ({rejectModalApp.application_id})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              A clear reason is mandatory. The applicant will be informed why their registration cannot be approved.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Category
                </label>
                <select
                  value={rejectCategory}
                  onChange={(e) => setRejectCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="Ineligible / Under 18">Ineligible / Under 18 Years Old</option>
                  <option value="Fraudulent / Forged ID Document">Fraudulent / Forged Identity Document</option>
                  <option value="Unreadable / Blurry Document">Unreadable / Blurry Verification Document</option>
                  <option value="Inappropriate Photographs">Inappropriate or Non-Compliant Photographs</option>
                  <option value="Impersonation / Stolen Identity">Impersonation / Fake Profile Suspicion</option>
                  <option value="Unrecognized College Institution">Unrecognized / Non-Eligible College</option>
                  <option value="Duplicate Account Attempt">Duplicate Registration Attempt</option>
                  <option value="Other Safety Reasons">Other Safety / Moderation Violation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Explanation Note (Mandatory)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  placeholder="e.g. Uploaded identity card does not match legal name, or photos violate safety guidelines..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalApp(null)}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isSubmittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTION 3: REQUEST CORRECTION MODAL                                       */}
      {/* ========================================================================= */}
      {correctionModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-orange-300 dark:border-orange-800 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Request Information Correction
                </h3>
                <p className="text-xs text-slate-500">
                  {correctionModalApp.legal_name || correctionModalApp.full_name} ({correctionModalApp.application_id})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Select specific fields that need correction. The applicant can log into their Status Dashboard to update these items and resubmit for verification.
            </p>

            <form onSubmit={handleConfirmCorrection} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Fields Needing Correction (Check all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'verification_id_url', label: 'Identity Document (ID)' },
                    { key: 'college_name', label: 'College / University' },
                    { key: 'degree_name', label: 'Course / Degree' },
                    { key: 'photo_1', label: 'Photo 1 (Avatar)' },
                    { key: 'photo_2', label: 'Photo 2 (Campus)' },
                    { key: 'photo_3', label: 'Photo 3 (Social)' },
                    { key: 'legal_name', label: 'Legal Name' },
                    { key: 'bio', label: 'Bio / About Text' }
                  ].map((field) => (
                    <label
                      key={field.key}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                        selectedCorrectionFields.includes(field.key)
                          ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-400 text-orange-900 dark:text-orange-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCorrectionFields.includes(field.key)}
                        onChange={() => toggleCorrectionField(field.key)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="truncate">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instructions for Applicant (Mandatory)
                </label>
                <textarea
                  rows={3}
                  required
                  value={correctionNoteText}
                  onChange={(e) => setCorrectionNoteText(e.target.value)}
                  placeholder="e.g. Your student ID photo had lighting glare making your roll number unreadable. Please upload a clear photo of your student ID card."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectionModalApp(null)}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isSubmittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Correction Request</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIGH-RES IMAGE PREVIEW MODAL                                              */}
      {/* ========================================================================= */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div className="max-w-3xl w-full bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-3 text-center">
            <div className="flex items-center justify-between text-white text-xs font-semibold px-2">
              <span>{previewImageModal.title}</span>
              <X className="w-5 h-5 cursor-pointer text-slate-400 hover:text-white" />
            </div>
            <AdminAssetImage
              src={previewImageModal.src}
              applicationId={previewImageModal.applicationId}
              assetType={previewImageModal.assetType}
              assetId={previewImageModal.assetId}
              alt="High-Res Inspection"
              className="max-h-[78vh] w-auto mx-auto object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
