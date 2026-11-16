import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from './audio/soundEffects';
import { ConfigMenu } from './components/ConfigMenu';
import { GameArena } from './components/GameArena';
import { GameOverModal } from './components/GameOverModal';
import type { GameConfig, GamePhase, GameStats } from './game/types';

const BEST_SCORE_KEY = 'pluie_de_mots_ce1_best_score';

function loadBestScore(): number {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number): void {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // Ignore storage errors in private browsing
  }
}

export default function App() {
  const [config, setConfig] = useState<GameConfig>({
    level: 1,
    allowUppercase: false,
    allowSpecialChars: false,
    soundEnabled: true,
  });

  const [phase, setPhase] = useState<GamePhase>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  const [bestScore, setBestScore] = useState<number>(loadBestScore);
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [sessionId, setSessionId] = useState<number>(1);

  // Sync game phase to document.body.dataset.state for predictable state inspection
  useEffect(() => {
    document.body.dataset.state = phase;
  }, [phase]);

  // Sync audio mute state
  useEffect(() => {
    soundEngine.setEnabled(config.soundEnabled);
  }, [config.soundEnabled]);

  const handleStartGame = useCallback(() => {
    soundEngine.playUiClick();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setLastStats(null);
    setSessionId((id) => id + 1);
    setPhase('playing');
  }, []);

  // Allow Enter or Space on title screen to start gameplay
  useEffect(() => {
    if (phase !== 'title') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        // Only auto-start on Enter, or Space if not focused on a config toggle button
        const activeTag = document.activeElement?.tagName;
        if (e.key === ' ' && activeTag === 'BUTTON') return;
        e.preventDefault();
        handleStartGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, handleStartGame]);

  const handleGameOver = useCallback((finalStats: GameStats) => {
    const updatedBest = Math.max(bestScore, finalStats.score);
    setBestScore(updatedBest);
    saveBestScore(updatedBest);
    setLastStats({ ...finalStats, bestScore: updatedBest });
    setPhase('gameover');
  }, [bestScore]);

  const handleReturnToMenu = useCallback(() => {
    soundEngine.playUiClick();
    setPhase('title');
  }, []);

  const handleToggleSound = useCallback(() => {
    setConfig((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const handleChangeConfig = useCallback((next: GameConfig) => {
    soundEngine.setEnabled(next.soundEnabled);
    soundEngine.playUiClick();
    setConfig(next);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100">
      {/* Cheerful Sun & Ambient Sky Clouds */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
        <div
          className={`absolute right-8 sm:right-14 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-amber-300/75 border-4 border-amber-200/80 shadow-md transition-all duration-300 ${
            phase === 'title' ? '-top-8' : 'top-20 opacity-65'
          }`}
        />

        <svg
          viewBox="0 0 180 90"
          className="absolute top-12 left-[6%] w-40 opacity-70 animate-cloud-drift"
        >
          <path
            d="M35 72H145C160 72 172 60 172 46C172 33 162 22 149 20C143 8 130 2 115 2C97 2 82 14 78 30C74 28 69 27 64 27C47 27 33 40 32 56C21 57 12 64 12 72H35Z"
            fill="#FFFFFF"
          />
        </svg>

        <svg
          viewBox="0 0 180 90"
          className="hidden md:block absolute top-28 right-[14%] w-48 opacity-60 animate-cloud-drift"
          style={{ animationDelay: '-3.5s' }}
        >
          <path
            d="M35 72H145C160 72 172 60 172 46C172 33 162 22 149 20C143 8 130 2 115 2C97 2 82 14 78 30C74 28 69 27 64 27C47 27 33 40 32 56C21 57 12 64 12 72H35Z"
            fill="#FFFFFF"
          />
        </svg>

        {/* Bottom meadow backdrop visible on title screen */}
        {phase === 'title' && (
          <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-b from-emerald-400 to-emerald-500 border-t-4 border-emerald-600/50" />
        )}
      </div>

      {phase === 'title' ? (
        <ConfigMenu
          config={config}
          bestScore={bestScore}
          onChangeConfig={handleChangeConfig}
          onStart={handleStartGame}
        />
      ) : (
        <>
          <GameArena
            key={sessionId}
            config={config}
            phase={phase}
            bestScore={bestScore}
            onToggleSound={handleToggleSound}
            onPause={() => setPhase('paused')}
            onResume={() => setPhase('playing')}
            onQuitToMenu={handleReturnToMenu}
            onGameOver={handleGameOver}
          />
          {phase === 'gameover' && lastStats && (
            <GameOverModal stats={lastStats} onReplayToMenu={handleReturnToMenu} />
          )}
        </>
      )}
    </div>
  );
}
