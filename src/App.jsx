import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import Footer from './components/layout/Footer';
import Toast from './components/common/Toast';
import AuthModal from './components/auth/AuthModal';

// Core Critical Views loaded immediately
import LandingPage from './components/public/LandingPage';
import CardDeck from './components/discover/CardDeck';
import ChatList from './components/chat/ChatList';
import MessengerView from './components/chat/MessengerView';
import ProfileView from './components/profile/ProfileView';

// Code-split Lazy-Loaded Secondary Views & Modals (Reduces initial JS bundle size by >50%)
const AboutPage = lazy(() => import('./components/public/AboutPage'));
const HowItWorksPage = lazy(() => import('./components/public/HowItWorksPage'));
const SafetyGuidelinesPage = lazy(() => import('./components/public/SafetyGuidelinesPage'));
const PrivacyPolicyPage = lazy(() => import('./components/public/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./components/public/TermsPage'));
const ContactPage = lazy(() => import('./components/public/ContactPage'));

const CampusBoard = lazy(() => import('./components/campus/CampusBoard'));
const GamesHub = lazy(() => import('./components/games/GamesHub'));
const RelationshipHub = lazy(() => import('./components/relationship/RelationshipHub'));
const EditProfile = lazy(() => import('./components/profile/EditProfile'));
const SettingsView = lazy(() => import('./components/profile/SettingsView'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

const PremiumModal = lazy(() => import('./components/common/PremiumModal'));
const ReportModal = lazy(() => import('./components/common/ReportModal'));
const BlockConfirmModal = lazy(() => import('./components/common/BlockConfirmModal'));
const MoodPickerModal = lazy(() => import('./components/daily/MoodPickerModal'));

const ViewLoadingFallback = () => (
  <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading section...</span>
  </div>
);

const MainLayout = () => {
  const {
    currentView,
    activeChatMatch,
    setActiveChatMatch,
    isAuthenticated,
    isAuthChecking,
    navigateTo,
    isAuthModalOpen,
    setIsAuthModalOpen,
    setAuthModalMode
  } = useApp();
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading Collage Story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Header Navbar: Hidden on mobile when inside an active personal chat, and hidden in Admin Panel */}
      <div className={(currentView === 'chats' && activeChatMatch) || currentView === 'admin' ? 'hidden' : 'block'}>
        <Navbar onOpenMoodModal={() => setIsMoodModalOpen(true)} />
      </div>

      {/* Main View Area */}
      <main className={`flex-1 w-full max-w-full overflow-x-hidden ${currentView === 'chats' ? 'p-0' : currentView === 'admin' ? 'p-0' : 'pb-20 md:pb-8'}`}>
        <Suspense fallback={<ViewLoadingFallback />}>
          {/* PUBLIC PAGES */}
          {currentView === 'landing' && <LandingPage onOpenAuth={() => setIsAuthModalOpen(true)} />}
          {currentView === 'about' && <AboutPage />}
          {currentView === 'how-it-works' && <HowItWorksPage />}
          {(currentView === 'safety' || currentView === 'community') && <SafetyGuidelinesPage />}
          {currentView === 'privacy' && <PrivacyPolicyPage />}
          {currentView === 'terms' && <TermsPage />}
          {currentView === 'contact' && <ContactPage />}

          {/* AUTHENTICATED APP VIEWS */}
          {currentView === 'discover' && (
            <div className="py-2 sm:py-4">
              <CardDeck />
            </div>
          )}

          {/* MATCHES (Who Liked You with Accept/Reject & Mutual Friends) */}
          {currentView === 'matches' && (
            <div className="py-2 sm:py-4">
              <ChatList
                onSelectMatch={(m) => {
                  setActiveChatMatch(m);
                  navigateTo('chats');
                }}
              />
            </div>
          )}

          {/* CAMPUS BOARD (Exclusive to user's college) */}
          {currentView === 'campus-board' && <CampusBoard />}

          {/* CHATS (Dedicated personal chat of everyone one by one with GO section - No footer in chat section) */}
          {currentView === 'chats' && <MessengerView />}

          {currentView === 'games' && <GamesHub />}
          {currentView === 'relationship' && <RelationshipHub />}
          {currentView === 'profile' && <ProfileView />}
          {currentView === 'edit-profile' && <EditProfile />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'admin' && <AdminDashboard />}
        </Suspense>
      </main>

      {/* Footer: Hidden in Chats section and Admin Panel per user requirement */}
      {currentView !== 'chats' && currentView !== 'admin' && <Footer />}

      {/* Bottom Navigation for Mobile: Hidden when inside an active mobile personal chat or Admin Panel */}
      {isAuthenticated && currentView !== 'admin' && !(currentView === 'chats' && activeChatMatch) && <BottomNav />}

      {/* Global Modals & Overlays */}
      <Toast />
      <Suspense fallback={null}>
        <PremiumModal />
        <ReportModal />
        <BlockConfirmModal />
        <MoodPickerModal isOpen={isMoodModalOpen} onClose={() => setIsMoodModalOpen(false)} />
      </Suspense>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

    </div>
  );
};

export const App = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
