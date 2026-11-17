import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  Users2,
  Calendar,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

export const RelationshipHub = () => {
  const {
    matches,
    activeRelationship,
    relationshipRequests,
    sendRelationshipRequest,
    confirmMutualRelationship,
    endMutualRelationship,
    addToast,
    navigateTo
  } = useApp();

  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [hideStatusOnProfile, setHideStatusOnProfile] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  const activeRequest = relationshipRequests.find(
    (r) => r.matchId === selectedMatchId && (r.status === 'pending' || r.status === 'mutual_accepted')
  );

  const stages = [
    { num: 1, title: 'Matched', desc: 'Mutual like on Discover' },
    { num: 2, title: 'Talking', desc: 'Exchanging messages & voice notes' },
    { num: 3, title: 'Dating', desc: 'Regular communication & shared games' },
    { num: 4, title: 'Relationship', desc: 'Mutually confirmed commitment' }
  ];

  const currentStageNumber = activeRelationship ? 4 : (selectedMatch?.relationship_stage === 'Dating' ? 3 : (selectedMatch?.relationship_stage === 'Talking' ? 2 : 1));

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full text-xs font-semibold mb-2">
          <Heart className="w-3.5 h-3.5 fill-rose-500" /> Core Differentiating Feature
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">
          Relationship Mode & Centre
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
          On Collégé, relationship status is never automatic. A digital match is not a commitment—an official status happens only when both people mutually, independently, and deliberately confirm it.
        </p>
      </div>

      {/* ACTIVE RELATIONSHIP BANNER (IF IN ACTIVE RELATIONSHIP) */}
      {activeRelationship ? (
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/20">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={activeRelationship.partner.avatar_url}
                    alt={activeRelationship.partner.display_name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white/40"
                  />
                  <span className="absolute bottom-0 right-0 p-1 bg-white text-rose-600 rounded-full shadow">
                    <Heart className="w-3.5 h-3.5 fill-rose-600" />
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-rose-100">
                    Active Mutual Relationship
                  </span>
                  <h3 className="font-display font-bold text-2xl">
                    With {activeRelationship.partner.display_name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-rose-100 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Since {new Date(activeRelationship.started_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setHideStatusOnProfile(!hideStatusOnProfile);
                    addToast(`Relationship badge ${hideStatusOnProfile ? 'now visible' : 'hidden'} on public profile`, 'info');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5"
                >
                  {hideStatusOnProfile ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{hideStatusOnProfile ? 'Unhide on Profile' : 'Hide on Profile'}</span>
                </button>

                <button
                  onClick={() => setShowEndModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-md transition-colors"
                >
                  End Relationship
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-[11px] text-rose-100">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Mutual Safety Notice: Either partner has full independence to end this status at any time.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* STAGES TRACKER (IF NOT IN RELATIONSHIP YET) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
          
          {/* Partner Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Check Status With a Campus Match
              </h3>
              <p className="text-xs text-slate-500">Select which conversation to view your connection milestones.</p>
            </div>

            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user.display_name} ({m.user.college_name || m.user.city})
                </option>
              ))}
            </select>
          </div>

          {/* 4 Stages Progress Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            {stages.map((stage) => {
              const isPastOrCurrent = currentStageNumber >= stage.num;
              const isCurrent = currentStageNumber === stage.num;

              return (
                <div
                  key={stage.num}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 shadow-xs'
                      : isPastOrCurrent
                      ? 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isCurrent
                          ? 'bg-rose-600 text-white'
                          : isPastOrCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {stage.num}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                    {stage.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Trigger Box */}
          {selectedMatch && (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Mutual Relationship Request
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send a private invitation to {selectedMatch.user.display_name}. They can Accept, Decline, or Decide Later.
                </p>
              </div>

              {activeRequest ? (
                activeRequest.status === 'mutual_accepted' ? (
                  <button
                    onClick={() => confirmMutualRelationship(selectedMatch.id)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md animate-pulse"
                  >
                    Confirm Double-Choice ❤️
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" /> Request Pending Private Response
                  </span>
                )
              ) : (
                <button
                  onClick={() => sendRelationshipRequest(selectedMatch.id)}
                  className="px-5 py-2.5 gradient-brand-bg text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition-all flex items-center gap-2 shrink-0"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>I want to be in a relationship</span>
                </button>
              )}
            </div>
          )}

        </div>
      )}

      {/* End Relationship Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-rose-100 dark:border-rose-950">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              End Relationship on Collégé?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Either person can independently end the platform relationship. Your profile status will revert to single/open.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  endMutualRelationship();
                  setShowEndModal(false);
                }}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl"
              >
                End Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRD Legal Clarification Box */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Collégé Product Principle (PRD 4.9 & 16):
        </p>
        <p>
          "A match is not a commitment. A conversation is not a promise. A relationship happens only when both people freely choose it. The platform must never imply that a digital status represents a legally binding or real-world commitment."
        </p>
      </div>

    </div>
  );
};

export default RelationshipHub;
