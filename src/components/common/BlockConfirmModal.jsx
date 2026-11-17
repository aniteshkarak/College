import React from 'react';
import { useApp } from '../../context/AppContext';
import { Ban, X, AlertOctagon } from 'lucide-react';

export const BlockConfirmModal = () => {
  const { blockTarget, setBlockTarget, handleBlockUser } = useApp();

  if (!blockTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 dark:border-rose-950/40 animate-slide-up text-center">
        
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Ban className="w-6 h-6" />
        </div>

        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
          Block {blockTarget.display_name}?
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          They will no longer be able to message you, view your profile, or appear in your Discover feed. Neither of you will ever be matched again.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setBlockTarget(null)}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleBlockUser(blockTarget.id, blockTarget.display_name)}
            className="flex-1 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
          >
            Confirm Block
          </button>
        </div>

      </div>
    </div>
  );
};

export default BlockConfirmModal;
