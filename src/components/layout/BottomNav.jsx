import React from 'react';
import { useApp } from '../../context/AppContext';
import { Flame, Heart, MessageCircle, Gamepad2, User } from 'lucide-react';

export const BottomNav = () => {
  const { currentView, navigateTo, matches } = useApp();

  const unreadMessagesCount = matches.reduce((sum, m) => sum + (m.unread_count || 0), 0);

  const tabs = [
    { id: 'discover', label: 'Discover', icon: <Flame className="w-5 h-5" /> },
    {
      id: 'matches',
      label: 'Matches',
      icon: <Heart className="w-5 h-5" />,
      badge: matches.length > 0 ? matches.length : null
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: <MessageCircle className="w-5 h-5" />,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
    },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-rose-600 dark:text-rose-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[16px] text-center text-[9px] font-extrabold bg-rose-500 text-white rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
