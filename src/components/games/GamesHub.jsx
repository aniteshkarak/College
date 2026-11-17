import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CONVERSATION_GAMES } from '../../services/mockData';
import {
  Gamepad2,
  HelpCircle,
  Sparkles,
  RotateCcw,
  CheckCircle,
  Heart,
  Shuffle,
  ShieldCheck,
  ChevronRight,
  Flame
} from 'lucide-react';

export const GamesHub = () => {
  const { matches, addToast, navigateTo } = useApp();
  const [selectedGameKey, setSelectedGameKey] = useState('truth_or_dare');
  const [selectedMatch, setSelectedMatch] = useState(matches[0] || null);

  // Game 1: Truth or Dare state
  const [todType, setTodType] = useState('truth'); // 'truth' | 'dare'
  const [todIndex, setTodIndex] = useState(0);

  // Game 2: Would You Rather state
  const [wyrIndex, setWyrIndex] = useState(0);
  const [wyrVoted, setWyrVoted] = useState(null); // 'A' | 'B'

  // Game 3: This or That state
  const [totIndex, setTotIndex] = useState(0);
  const [totPick, setTotPick] = useState(null);

  // Game 4: 20 Questions state
  const [twentyQuestionsCount, setTwentyQuestionsCount] = useState(1);
  const [twentyQInput, setTwentyQInput] = useState('');
  const [twentyQHistory, setTwentyQHistory] = useState([
    { question: 'Is it something you can find on the campus library floor?', answer: 'Yes, definitely!' }
  ]);

  // Game 5: Compatibility Quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);

  // Game 6: Never Have I Ever state
  const [nhieIndex, setNhieIndex] = useState(0);
  const [nhieChoice, setNhieChoice] = useState(null); // 'have' | 'never'

  const games = [
    { key: 'truth_or_dare', title: 'Truth or Dare', tag: 'Most Popular', icon: '🎭', color: 'from-rose-500 to-pink-500' },
    { key: 'would_you_rather', title: 'Would You Rather?', tag: 'Fun Banter', icon: '⚖️', color: 'from-amber-500 to-orange-500' },
    { key: 'this_or_that', title: 'This or That', tag: 'Fast-Paced', icon: '⚡', color: 'from-purple-500 to-indigo-500' },
    { key: 'twenty_questions', title: '20 Questions', tag: 'Mystery & Logic', icon: '❓', color: 'from-blue-500 to-cyan-500' },
    { key: 'compatibility_quiz', title: 'Compatibility Quiz', tag: 'Match Score', icon: '💖', color: 'from-emerald-500 to-teal-500' },
    { key: 'never_have_i_ever', title: 'Never Have I Ever', tag: 'Icebreaker', icon: '🤫', color: 'from-violet-500 to-fuchsia-500' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full text-xs font-semibold mb-2">
            <Gamepad2 className="w-3.5 h-3.5" /> Signature Feature
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">
            Conversation Games
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive, pressure-free games designed to spark natural chemistry and great stories.
          </p>
        </div>

        {/* Match Partner Selector */}
        {matches.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-500 ml-1">Playing with:</span>
            <select
              value={selectedMatch?.id || ''}
              onChange={(e) => {
                const match = matches.find((m) => m.id === e.target.value);
                setSelectedMatch(match);
              }}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                  {m.user.display_name} ({m.user.city})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Safety Banner */}
      <div className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
        <span>
          Game Safety: All questions are campus-safe and non-NSFW. Any player can skip any question at any time without penalty.
        </span>
      </div>

      {/* Game Selection Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-8">
        {games.map((g) => {
          const isSelected = selectedGameKey === g.key;
          return (
            <button
              key={g.key}
              onClick={() => {
                setSelectedGameKey(g.key);
                setWyrVoted(null);
                setTotPick(null);
                setNhieChoice(null);
              }}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{g.icon}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {g.tag}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {g.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Game Stage Arena */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl min-h-[380px] flex flex-col justify-between">
        
        {/* GAME 1: Truth or Dare */}
        {selectedGameKey === 'truth_or_dare' && (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎭</span> Truth or Dare
                </h3>
                <p className="text-xs text-slate-500">Pick Truth or Dare to reveal a prompt for you and {selectedMatch?.user?.display_name || 'your match'}.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setTodType('truth');
                    setTodIndex(0);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    todType === 'truth'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Truth
                </button>
                <button
                  onClick={() => {
                    setTodType('dare');
                    setTodIndex(0);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    todType === 'dare'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Dare
                </button>
              </div>
            </div>

            <div className="my-8 text-center max-w-lg mx-auto">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-4 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                {todType.toUpperCase()} PROMPT #{todIndex + 1}
              </span>
              <p className="text-xl sm:text-2xl font-display font-semibold text-slate-900 dark:text-white leading-relaxed">
                "{todType === 'truth'
                  ? CONVERSATION_GAMES.truth_or_dare.truths[todIndex % CONVERSATION_GAMES.truth_or_dare.truths.length]
                  : CONVERSATION_GAMES.truth_or_dare.dares[todIndex % CONVERSATION_GAMES.truth_or_dare.dares.length]}"
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setTodIndex((prev) => prev + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Shuffle className="w-3.5 h-3.5" /> Skip / Next Question
              </button>
              <button
                onClick={() => {
                  addToast(`Shared prompt with ${selectedMatch?.user?.display_name || 'match'} in chat! 💬`, 'success');
                  navigateTo('chats');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand-bg text-white text-xs font-semibold shadow hover:brightness-105"
              >
                Answer in Chat
              </button>
            </div>
          </div>
        )}

        {/* GAME 2: Would You Rather */}
        {selectedGameKey === 'would_you_rather' && (
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>⚖️</span> Would You Rather?
              </h3>
              <p className="text-xs text-slate-500">Pick your preference to see how your campus match responds!</p>
            </div>

            {(() => {
              const currentQ = CONVERSATION_GAMES.would_you_rather.questions[wyrIndex % CONVERSATION_GAMES.would_you_rather.questions.length];
              return (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                    <button
                      onClick={() => setWyrVoted('A')}
                      className={`p-6 rounded-3xl border-2 text-center transition-all ${
                        wyrVoted === 'A'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-md scale-102'
                          : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-400 mb-2 block">OPTION A</span>
                      <p className="text-base sm:text-lg font-semibold">{currentQ.optionA}</p>
                      {wyrVoted && (
                        <div className="mt-3 text-xs font-bold text-amber-600">
                          {wyrVoted === 'A' ? '64% of college students agree!' : '64% picked this'}
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => setWyrVoted('B')}
                      className={`p-6 rounded-3xl border-2 text-center transition-all ${
                        wyrVoted === 'B'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-md scale-102'
                          : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-400 mb-2 block">OPTION B</span>
                      <p className="text-base sm:text-lg font-semibold">{currentQ.optionB}</p>
                      {wyrVoted && (
                        <div className="mt-3 text-xs font-bold text-amber-600">
                          {wyrVoted === 'B' ? '36% of college students agree!' : '36% picked this'}
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setWyrIndex((prev) => prev + 1);
                        setWyrVoted(null);
                      }}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      Next Dilemma
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* GAME 3: This or That */}
        {selectedGameKey === 'this_or_that' && (
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>⚡</span> This or That
              </h3>
              <p className="text-xs text-slate-500">Rapid lightning round picks</p>
            </div>

            {(() => {
              const pair = CONVERSATION_GAMES.this_or_that.pairs[totIndex % CONVERSATION_GAMES.this_or_that.pairs.length];
              return (
                <div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-8">
                    <button
                      onClick={() => setTotPick('A')}
                      className={`flex-1 w-full p-8 rounded-3xl border-2 text-center transition-all ${
                        totPick === 'A'
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-bold shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-purple-300'
                      }`}
                    >
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{pair.itemA}</p>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                      OR
                    </div>

                    <button
                      onClick={() => setTotPick('B')}
                      className={`flex-1 w-full p-8 rounded-3xl border-2 text-center transition-all ${
                        totPick === 'B'
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-bold shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-purple-300'
                      }`}
                    >
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{pair.itemB}</p>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setTotIndex((prev) => prev + 1);
                        setTotPick(null);
                      }}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      Next Flash Pick
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* GAME 4: 20 Questions */}
        {selectedGameKey === 'twenty_questions' && (
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span>❓</span> 20 Questions
                </h3>
                <p className="text-xs text-slate-500">Ask yes/no questions to deduce what your match is thinking of!</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                Question {twentyQuestionsCount} / 20
              </span>
            </div>

            <div className="my-4 space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              {twentyQHistory.map((item, i) => (
                <div key={i} className="text-xs p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-slate-900 dark:text-white">Q{i + 1}: {item.question}</p>
                  <p className="text-rose-600 dark:text-rose-400 mt-0.5">Answer: {item.answer}</p>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!twentyQInput.trim()) return;
                setTwentyQHistory((prev) => [...prev, { question: twentyQInput, answer: 'Yes! (Simulated response)' }]);
                setTwentyQuestionsCount((prev) => prev + 1);
                setTwentyQInput('');
              }}
              className="flex gap-2 mt-4"
            >
              <input
                type="text"
                value={twentyQInput}
                onChange={(e) => setTwentyQInput(e.target.value)}
                placeholder="Ask your next question (e.g. Is it edible?)..."
                className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Ask
              </button>
            </form>
          </div>
        )}

        {/* GAME 5: Compatibility Quiz */}
        {selectedGameKey === 'compatibility_quiz' && (
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>💖</span> Compatibility Quiz
              </h3>
              <p className="text-xs text-slate-500">Answer 5 lifestyle questions to calculate entertainment compatibility.</p>
            </div>

            {!quizFinished ? (
              (() => {
                const question = CONVERSATION_GAMES.compatibility_quiz.questions[quizStep];
                return (
                  <div>
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-2">
                      QUESTION {quizStep + 1} OF {CONVERSATION_GAMES.compatibility_quiz.questions.length}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-6">
                      {question.prompt}
                    </h4>

                    <div className="space-y-2.5 mb-6">
                      {question.choices.map((choice, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setUserAnswers({ ...userAnswers, [question.id]: choice });
                            if (quizStep < CONVERSATION_GAMES.compatibility_quiz.questions.length - 1) {
                              setQuizStep((prev) => prev + 1);
                            } else {
                              setQuizFinished(true);
                            }
                          }}
                          className="w-full text-left p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all flex items-center justify-between"
                        >
                          <span>{choice}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full gradient-brand-bg text-white flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-lg">
                  92%
                </div>
                <h4 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-1">
                  High Chemistry Score!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  You and {selectedMatch?.user?.display_name || 'your match'} share similar perspectives on communication, banter, and respect!
                </p>
                <button
                  onClick={() => {
                    setQuizFinished(false);
                    setQuizStep(0);
                    setUserAnswers({});
                  }}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* GAME 6: Never Have I Ever */}
        {selectedGameKey === 'never_have_i_ever' && (
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>🤫</span> Never Have I Ever
              </h3>
              <p className="text-xs text-slate-500">Lighthearted college memories and habits</p>
            </div>

            <div className="my-8 text-center max-w-md mx-auto">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block mb-3">
                PROMPT #{nhieIndex + 1}
              </span>
              <p className="text-xl sm:text-2xl font-display font-semibold text-slate-900 dark:text-white leading-relaxed">
                "{CONVERSATION_GAMES.never_have_i_ever.prompts[nhieIndex % CONVERSATION_GAMES.never_have_i_ever.prompts.length]}"
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 my-6">
              <button
                onClick={() => setNhieChoice('have')}
                className={`flex-1 max-w-[140px] py-3 rounded-2xl font-bold text-xs border-2 transition-all ${
                  nhieChoice === 'have'
                    ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                    : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                I Have 🙋
              </button>
              <button
                onClick={() => setNhieChoice('never')}
                className={`flex-1 max-w-[140px] py-3 rounded-2xl font-bold text-xs border-2 transition-all ${
                  nhieChoice === 'never'
                    ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                    : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                Never 🙅
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setNhieIndex((prev) => prev + 1);
                  setNhieChoice(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Next Statement
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default GamesHub;
