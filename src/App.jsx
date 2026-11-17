import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import Footer from './components/layout/Footer';
import Toast from './components/common/Toast';
import PremiumModal from './components/common/PremiumModal';
import ReportModal from './components/common/ReportModal';
import BlockConfirmModal from './components/common/BlockConfirmModal';
import MoodPickerModal from './components/daily/MoodPickerModal';
import AuthModal from './components/auth/AuthModal';

// Views
import LandingPage from './components/public/LandingPage';
import AboutPage from './components/public/AboutPage';
import HowItWorksPage from './components/public/HowItWorksPage';
import SafetyGuidelinesPage from './components/public/SafetyGuidelinesPage';
import PrivacyPolicyPage from './components/public/PrivacyPolicyPage';
import TermsPage from './components/public/TermsPage';
import ContactPage from './components/public/ContactPage';

import CardDeck from './components/discover/CardDeck';
import ChatList from './components/chat/ChatList';
import ChatRoom from './components/chat/ChatRoom';
import MessengerView from './components/chat/MessengerView';
import CampusBoard from './components/campus/CampusBoard';
import GamesHub from './components/games/GamesHub';
import RelationshipHub from './components/relationship/RelationshipHub';
import ProfileView from './components/profile/ProfileView';
import EditProfile from './components/profile/EditProfile';
import SettingsView from './components/profile/SettingsView';
import AdminDashboard from './components/admin/AdminDashboard';

const MainLayout = () => {
  const { currentView, activeChatMatch, setActiveChatMatch, isAuthenticated, navigateTo } = useApp();
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Header Navbar: Hidden on mobile when inside an active personal chat */}
      <div className={currentView === 'chats' && activeChatMatch ? 'hidden md:block' : 'block'}>
        <Navbar onOpenMoodModal={() => setIsMoodModalOpen(true)} />
      </div>

      {/* Main View Area */}
      <main className={`flex-1 ${currentView === 'chats' ? 'p-0' : 'pb-20 md:pb-8'}`}>
        
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

      </main>

      {/* Footer: Hidden in Chats section per user requirement */}
      {currentView !== 'chats' && <Footer />}

      {/* Bottom Navigation for Mobile: Hidden when inside an active mobile personal chat */}
      {isAuthenticated && !(currentView === 'chats' && activeChatMatch) && <BottomNav />}

      {/* Global Modals & Overlays */}
      <Toast />
      <PremiumModal />
      <ReportModal />
      <BlockConfirmModal />
      <MoodPickerModal isOpen={isMoodModalOpen} onClose={() => setIsMoodModalOpen(false)} />
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
