import React from 'react';
import { RotateCcw } from 'lucide-react';
import { getEncouragingFeedback } from '../game/rules';
import type { GameStats } from '../game/types';

interface GameOverModalProps {
  stats: GameStats;
  onReplayToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onReplayToMenu }) => {
  const feedback = getEncouragingFeedback(stats.score, stats.wordsCompleted);
  const totalAttempts = stats.correctKeys + stats.mistakes;
  const accuracy = totalAttempts > 0 ? Math.round((stats.correctKeys / totalAttempts) * 100) : 100;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center px-4 py-6 bg-sky-950/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white border-4 border-amber-300 shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center gap-5">
        {/* Encouraging Stars */}
        <div className="flex items-center justify-center gap-2" aria-label={`${feedback.stars} étoiles sur 3`}>
          {[1, 2, 3].map((starIndex) => {
            const earned = starIndex <= feedback.stars;
            return (
              <svg
                key={starIndex}
                viewBox="0 0 36 36"
                className={`w-12 h-12 ${starIndex === 2 ? '-translate-y-2 w-14 h-14' : ''}`}
                aria-hidden="true"
              >
                <path
                  d="M18 3L22.6 12.3L32.9 13.8L25.4 21L27.2 31.3L18 26.4L8.8 31.3L10.6 21L3.1 13.8L13.4 12.3L18 3Z"
                  fill={earned ? '#FACC15' : '#E2E8F0'}
                  stroke={earned ? '#CA8A04' : '#94A3B8'}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
              </svg>
            );
          })}
        </div>

        <div>
          <h2 id="gameover-title" className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
            {feedback.title}
          </h2>
          <p className="text-base font-semibold text-slate-700 mt-2 leading-relaxed">
            {feedback.message}
          </p>
        </div>

        {/* Score & Mastery Stats */}
        <div className="w-full grid grid-cols-3 gap-3 pt-1">
          <div className="rounded-2xl bg-sky-50 border-2 border-sky-200 p-3">
            <div className="text-xs font-bold text-sky-900">Score final</div>
            <div
              className="font-display text-2xl sm:text-3xl font-bold text-sky-700 tabular-nums mt-0.5"
              data-testid="final-score"
            >
              {stats.score}
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-3">
            <div className="text-xs font-bold text-emerald-900">Mots réussis</div>
            <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums mt-0.5">
              {stats.wordsCompleted}
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-3">
            <div className="text-xs font-bold text-amber-900">Précision</div>
            <div className="font-display text-2xl sm:text-3xl font-bold text-amber-700 tabular-nums mt-0.5">
              {accuracy}%
            </div>
          </div>
        </div>

        {stats.bestScore > 0 && (
          <p className="text-sm font-bold text-slate-600 tabular-nums">
            Meilleur score : {stats.bestScore} points
          </p>
        )}

        <button
          type="button"
          data-start="true"
          onClick={onReplayToMenu}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 min-h-[56px] rounded-2xl bg-sky-600 hover:bg-sky-500 active:translate-y-0.5 text-white font-display text-2xl font-bold shadow-md border-b-4 border-sky-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 whitespace-nowrap"
        >
          <RotateCcw className="w-6 h-6" aria-hidden="true" />
          <span>Rejouer</span>
        </button>
      </div>
    </div>
  );
};
