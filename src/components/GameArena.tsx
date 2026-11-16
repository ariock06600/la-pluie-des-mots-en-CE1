import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX, Home } from 'lucide-react';
import { soundEngine } from '../audio/soundEffects';
import {
  INITIAL_LIVES,
  calculateWordScore,
  getDifficultyParameters,
  pickNextWord,
  resolveKeyPress,
} from '../game/rules';
import type {
  FallingWord,
  GameConfig,
  GamePhase,
  GameStats,
  Particle,
  ScorePopup,
} from '../game/types';
import { HeartLives } from './HeartLives';

interface GameArenaProps {
  config: GameConfig;
  phase: GamePhase;
  bestScore: number;
  onToggleSound: () => void;
  onPause: () => void;
  onResume: () => void;
  onQuitToMenu: () => void;
  onGameOver: (finalStats: GameStats) => void;
}

const CLOUD_STYLES = [
  { bg: 'bg-white', border: 'border-sky-300', locked: 'border-sky-600 ring-4 ring-sky-300' },
  { bg: 'bg-amber-50', border: 'border-amber-300', locked: 'border-amber-500 ring-4 ring-amber-300' },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', locked: 'border-emerald-600 ring-4 ring-emerald-300' },
  { bg: 'bg-rose-50', border: 'border-rose-300', locked: 'border-rose-500 ring-4 ring-rose-300' },
] as const;

const PARTICLE_COLORS = ['#FACC15', '#38BDF8', '#34D399', '#FB7185', '#A78BFA'];

export const GameArena: React.FC<GameArenaProps> = ({
  config,
  phase,
  bestScore,
  onToggleSound,
  onPause,
  onResume,
  onQuitToMenu,
  onGameOver,
}) => {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const arenaHeightRef = useRef<number>(600);
  const arenaWidthRef = useRef<number>(1000);
  const lastHandledRef = useRef<{ char: string; at: number } | null>(null);

  // Simulation refs (single source of truth inside rAF and keyboard handler)
  const wordsRef = useRef<FallingWord[]>([]);
  const lockedWordIdRef = useRef<number | null>(null);
  const livesRef = useRef<number>(INITIAL_LIVES);
  const statsRef = useRef<GameStats>({
    score: 0,
    bestScore,
    wordsCompleted: 0,
    correctKeys: 0,
    mistakes: 0,
    combo: 0,
    maxCombo: 0,
  });
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const nextIdRef = useRef<number>(1);
  const lastSpawnAtRef = useRef<number>(0);
  const gameEndedRef = useRef<boolean>(false);

  // React render state synced from refs
  const [words, setWords] = useState<FallingWord[]>([]);
  const [lockedWordId, setLockedWordId] = useState<number | null>(null);
  const [lives, setLives] = useState<number>(INITIAL_LIVES);
  const [stats, setStats] = useState<GameStats>(statsRef.current);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  const [mistakeHint, setMistakeHint] = useState<{ expected: string; key: number } | null>(null);
  const [dangerFlash, setDangerFlash] = useState<boolean>(false);

  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;

  const configRef = useRef<GameConfig>(config);
  configRef.current = config;

  // Keep hidden composition input focused while playing so dead keys and IME/insertText always work
  useEffect(() => {
    if (phase === 'playing') {
      hiddenInputRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  // Auto-clear mistake hint after 2.5s
  useEffect(() => {
    if (!mistakeHint) return;
    const timer = window.setTimeout(() => setMistakeHint(null), 2500);
    return () => window.clearTimeout(timer);
  }, [mistakeHint]);

  // Track arena dimensions cleanly via ResizeObserver
  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) arenaHeightRef.current = rect.height;
      if (rect.width > 0) arenaWidthRef.current = rect.width;
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const spawnBurst = (xPercent: number, y: number) => {
    const xPx = (xPercent / 100) * arenaWidthRef.current;
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const speed = 75 + Math.random() * 110;
      newParticles.push({
        id: nextIdRef.current++,
        x: xPx,
        y: y + 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        size: 6 + Math.random() * 5,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        alpha: 1,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.2,
      });
    }
    particlesRef.current = [...particlesRef.current.slice(-48), ...newParticles];
  };

  const triggerEndOfGame = () => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;
    soundEngine.playGameOver();
    const finalSnapshot: GameStats = {
      ...statsRef.current,
      bestScore: Math.max(statsRef.current.bestScore, statsRef.current.score),
    };
    onGameOver(finalSnapshot);
  };

  const spawnWord = (nowMs: number) => {
    const currentConfig = configRef.current;
    const { fallSpeed } = getDifficultyParameters(currentConfig.level, statsRef.current.score);
    const activeTexts = wordsRef.current.map((w) => w.text);
    const text = pickNextWord(currentConfig, activeTexts);

    // Choose xPercent avoiding horizontal overlap with recently spawned words near top
    const topWords = wordsRef.current.filter((w) => w.y < 140);
    let xPercent = 16 + Math.random() * 68;
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = 16 + Math.random() * 68;
      const tooClose = topWords.some((w) => Math.abs(w.xPercent - candidate) < 20);
      if (!tooClose) {
        xPercent = candidate;
        break;
      }
    }

    const newWord: FallingWord = {
      id: nextIdRef.current++,
      text,
      typedCount: 0,
      xPercent,
      y: -36,
      speed: fallSpeed * (0.94 + Math.random() * 0.14),
      variant: (nextIdRef.current % 4) as 0 | 1 | 2 | 3,
      shakeUntil: 0,
    };

    wordsRef.current = [...wordsRef.current, newWord];
    lastSpawnAtRef.current = nowMs;
  };

  // Spawn an initial friendly word immediately on mount
  useEffect(() => {
    const now = performance.now();
    spawnWord(now);
    setWords(wordsRef.current);
  }, []);

  // Main requestAnimationFrame simulation loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (phaseRef.current === 'playing' && !gameEndedRef.current) {
        const currentConfig = configRef.current;
        const { spawnIntervalMs, maxConcurrent } = getDifficultyParameters(
          currentConfig.level,
          statsRef.current.score
        );

        // Spawn new word when interval elapsed or screen is empty
        if (
          wordsRef.current.length === 0 ||
          (wordsRef.current.length < maxConcurrent &&
            now - lastSpawnAtRef.current >= spawnIntervalMs)
        ) {
          spawnWord(now);
        }

        // Advance falling words
        const groundY = Math.max(220, arenaHeightRef.current - 58);
        let missedCount = 0;
        const surviving: FallingWord[] = [];

        for (const w of wordsRef.current) {
          const nextY = w.y + w.speed * dt;
          if (nextY >= groundY) {
            missedCount += 1;
            if (lockedWordIdRef.current === w.id) {
              lockedWordIdRef.current = null;
              setLockedWordId(null);
            }
          } else {
            surviving.push({ ...w, y: nextY });
          }
        }

        wordsRef.current = surviving;
        setWords(surviving);

        if (missedCount > 0) {
          const nextLives = Math.max(0, livesRef.current - missedCount);
          livesRef.current = nextLives;
          setLives(nextLives);
          statsRef.current = { ...statsRef.current, combo: 0 };
          setStats(statsRef.current);
          setDangerFlash(true);
          window.setTimeout(() => setDangerFlash(false), 320);

          if (nextLives <= 0) {
            triggerEndOfGame();
          } else {
            soundEngine.playLifeLost();
          }
        }

        // Update particles
        if (particlesRef.current.length > 0) {
          const nextParticles: Particle[] = [];
          for (const p of particlesRef.current) {
            const nextLife = p.life + dt;
            if (nextLife < p.maxLife) {
              nextParticles.push({
                ...p,
                x: p.x + p.vx * dt,
                y: p.y + p.vy * dt,
                vy: p.vy + 220 * dt,
                life: nextLife,
                alpha: 1 - nextLife / p.maxLife,
              });
            }
          }
          particlesRef.current = nextParticles;
          setParticles(nextParticles);
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const processTypedChar = (char: string) => {
    if (phaseRef.current !== 'playing' || gameEndedRef.current) return;
    const now = performance.now();

    // Deduplicate if both keydown and input/composition fire for the same character in < 40ms
    if (
      lastHandledRef.current &&
      lastHandledRef.current.char === char &&
      now - lastHandledRef.current.at < 40
    ) {
      return;
    }
    lastHandledRef.current = { char, at: now };

    const result = resolveKeyPress(char, wordsRef.current, lockedWordIdRef.current, now);
    if (result.outcome === 'ignored') return;

    wordsRef.current = result.updatedWords;
    lockedWordIdRef.current = result.newLockedWordId;
    setWords(result.updatedWords);
    setLockedWordId(result.newLockedWordId);

    if (result.outcome === 'hit') {
      const target = result.updatedWords.find((w) => w.id === result.targetWordId);
      soundEngine.playKeyHit((target?.typedCount ?? 1) - 1);
      statsRef.current = {
        ...statsRef.current,
        correctKeys: statsRef.current.correctKeys + 1,
      };
      setStats(statsRef.current);
      setMistakeHint(null);
    } else if (result.outcome === 'completed' && result.completedWord) {
      const nextCombo = statsRef.current.combo + 1;
      const { total } = calculateWordScore(
        result.completedWord.text.length,
        result.completedWord.y,
        arenaHeightRef.current,
        nextCombo
      );
      const nextScore = statsRef.current.score + total;
      statsRef.current = {
        ...statsRef.current,
        score: nextScore,
        bestScore: Math.max(statsRef.current.bestScore, nextScore),
        wordsCompleted: statsRef.current.wordsCompleted + 1,
        correctKeys: statsRef.current.correctKeys + 1,
        combo: nextCombo,
        maxCombo: Math.max(statsRef.current.maxCombo, nextCombo),
      };
      setStats(statsRef.current);
      setMistakeHint(null);

      soundEngine.playWordComplete();
      spawnBurst(result.completedWord.xPercent, result.completedWord.y);

      const popupId = nextIdRef.current++;
      const newPopup: ScorePopup = {
        id: popupId,
        xPercent: result.completedWord.xPercent,
        y: Math.max(36, result.completedWord.y),
        points: total,
      };
      popupsRef.current = [...popupsRef.current, newPopup];
      setPopups(popupsRef.current);
      window.setTimeout(() => {
        popupsRef.current = popupsRef.current.filter((p) => p.id !== popupId);
        setPopups(popupsRef.current);
      }, 850);
    } else if (result.outcome === 'miss') {
      const nextLives = Math.max(0, livesRef.current - 1);
      livesRef.current = nextLives;
      setLives(nextLives);
      statsRef.current = {
        ...statsRef.current,
        mistakes: statsRef.current.mistakes + 1,
        combo: 0,
      };
      setStats(statsRef.current);
      setDangerFlash(true);
      window.setTimeout(() => setDangerFlash(false), 260);

      if (result.expectedChar) {
        setMistakeHint({ expected: result.expectedChar, key: Date.now() });
      }

      if (nextLives <= 0) {
        triggerEndOfGame();
      } else {
        soundEngine.playMistake();
      }
    }
  };

  const processTypedCharRef = useRef(processTypedChar);
  processTypedCharRef.current = processTypedChar;

  // Keyboard listener for AZERTY typing + Escape pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (phaseRef.current === 'playing') {
          onPause();
        } else if (phaseRef.current === 'paused') {
          onResume();
        }
        return;
      }

      if (phaseRef.current !== 'playing' || gameEndedRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Let Dead / Process keys pass through to hidden input composition without penalty
      if (e.key === 'Dead' || e.key === 'Process' || e.key === 'Unidentified') {
        return;
      }

      // Prevent browser scrolling or quick-find on printable keys
      if (e.key.length === 1) {
        e.preventDefault();
        processTypedCharRef.current(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPause, onResume]);

  // Identify the currently targeted or lowest word to show a gentle next-key clue
  const activeTargetWord =
    words.find((w) => w.id === lockedWordId) ??
    [...words].sort((a, b) => b.y - a.y)[0] ??
    null;
  const nextExpectedChar = activeTargetWord
    ? activeTargetWord.text.charAt(activeTargetWord.typedCount)
    : null;

  const { fallSpeed } = getDifficultyParameters(config.level, stats.score);
  const speedMultiplier = (fallSpeed / (config.level === 1 ? 42 : config.level === 2 ? 36 : 32)).toFixed(1);

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col select-none">
      {/* Compact Top HUD */}
      <header className="relative z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white/90 border-b-2 border-sky-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <HeartLives lives={lives} maxLives={INITIAL_LIVES} />
          {mistakeHint && (
            <span
              key={mistakeHint.key}
              className="hidden sm:inline-block text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1"
              role="status"
            >
              Oups ! Tape « {mistakeHint.expected} »
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Score
            </div>
            <div
              className="font-display text-2xl sm:text-3xl font-bold text-sky-700 tabular-nums leading-none"
              data-testid="hud-score"
            >
              {stats.score}
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Mots
            </div>
            <div className="font-display text-xl font-bold text-emerald-700 tabular-nums leading-none">
              {stats.wordsCompleted}
            </div>
          </div>

          <div className="hidden md:block text-right">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Vitesse
            </div>
            <div className="font-display text-xl font-bold text-amber-700 tabular-nums leading-none">
              ×{speedMultiplier}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleSound();
              }}
              aria-label={config.soundEnabled ? 'Couper le son' : 'Activer le son'}
              className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-sky-100 border-2 border-slate-200 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
            >
              {config.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-sky-700" aria-hidden="true" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                if (phase === 'paused') onResume();
                else onPause();
              }}
              aria-label={phase === 'paused' ? 'Reprendre la partie' : 'Mettre en pause'}
              className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-sky-100 border-2 border-slate-200 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
            >
              {phase === 'paused' ? (
                <Play className="w-5 h-5 text-emerald-700 fill-current" aria-hidden="true" />
              ) : (
                <Pause className="w-5 h-5 text-slate-700" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Playfield */}
      <main
        ref={arenaRef}
        onClick={() => hiddenInputRef.current?.focus({ preventScroll: true })}
        className={`relative flex-1 w-full overflow-hidden transition-colors duration-200 ${
          dangerFlash ? 'bg-rose-200/35' : ''
        }`}
        aria-label="Zone de jeu"
      >
        {/* Hidden input for OS dead keys, IME composition, and mobile/insertText input */}
        <input
          ref={hiddenInputRef}
          type="text"
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onCompositionEnd={(e) => {
            const val = e.data;
            if (val) {
              for (const ch of val) {
                processTypedChar(ch);
              }
            }
            e.currentTarget.value = '';
          }}
          onChange={(e) => {
            // Skip mid-composition partial dead keys
            if ((e.nativeEvent as InputEvent).isComposing) return;
            const val = e.currentTarget.value;
            if (val) {
              for (const ch of val) {
                processTypedChar(ch);
              }
              e.currentTarget.value = '';
            }
          }}
          className="sr-only"
        />

        {/* Falling Word Clouds */}
        {words.map((word) => {
          const isLocked = word.id === lockedWordId;
          const style = CLOUD_STYLES[word.variant];
          const isShaking = word.shakeUntil > performance.now();

          return (
            <div
              key={word.id}
              data-testid="falling-word"
              data-word={word.text}
              data-typed={word.typedCount}
              data-locked={isLocked ? 'true' : 'false'}
              style={{
                left: `${word.xPercent}%`,
                transform: `translate3d(-50%, ${Math.round(word.y)}px, 0)`,
              }}
              className="absolute top-0 will-change-transform pointer-events-none"
            >
              <div
                className={`relative px-6 py-3 rounded-full border-3 shadow-md transition-shadow ${
                  style.bg
                } ${isLocked ? style.locked : style.border} ${
                  isShaking ? 'animate-gentle-shake border-rose-500' : ''
                }`}
              >
                {/* Cloud top puffs */}
                <span
                  aria-hidden="true"
                  className={`absolute -top-2.5 left-1/4 w-6 h-4 rounded-t-full border-t-3 border-l-3 border-r-3 ${style.bg} ${
                    isLocked ? 'border-sky-600' : style.border
                  }`}
                />
                <span
                  aria-hidden="true"
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-5 rounded-t-full border-t-3 border-l-3 border-r-3 ${style.bg} ${
                    isLocked ? 'border-sky-600' : style.border
                  }`}
                />
                <div className="relative z-10 font-word text-2xl sm:text-3xl font-bold tracking-wider whitespace-nowrap leading-none">
                  {word.text.split('').map((char, idx) => {
                    const isTyped = idx < word.typedCount;
                    const isNext = idx === word.typedCount;

                    return (
                      <span
                        key={idx}
                        className={
                          isTyped
                            ? 'text-emerald-600'
                            : isNext && isLocked
                              ? 'text-slate-950 border-b-4 border-sky-500 pb-0.5'
                              : 'text-slate-900'
                        }
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Celebratory Burst Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.alpha,
              transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
            }}
            className="absolute top-0 left-0 rounded-full pointer-events-none"
            aria-hidden="true"
          />
        ))}

        {/* Floating Score Popups */}
        {popups.map((pop) => (
          <div
            key={pop.id}
            style={{ left: `${pop.xPercent}%`, top: `${pop.y}px` }}
            className="absolute font-display text-xl sm:text-2xl font-bold text-emerald-700 animate-float-up-fade pointer-events-none tabular-nums drop-shadow-sm"
            aria-hidden="true"
          >
            +{pop.points}
          </div>
        ))}
      </main>

      {/* Meadow Ground Line & Next-Key Helper */}
      <footer className="relative z-20 h-[68px] w-full bg-gradient-to-b from-emerald-500 to-emerald-600 border-t-4 border-emerald-700 px-4 sm:px-8 flex items-center justify-between shrink-0 text-white">
        <div className="flex items-center gap-3">
          {nextExpectedChar !== null ? (
            <div className="flex items-center gap-2.5">
              <span className="text-sm sm:text-base font-bold text-emerald-50">
                Prochaine touche :
              </span>
              <kbd className="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-xl bg-white text-slate-900 font-word text-xl font-bold border-b-4 border-slate-300 shadow-sm">
                {nextExpectedChar}
              </kbd>
              {nextExpectedChar !== nextExpectedChar.toLocaleLowerCase('fr-FR') && (
                <span className="text-xs sm:text-sm font-bold text-amber-100">
                  (Maj + {nextExpectedChar.toLocaleLowerCase('fr-FR')})
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm sm:text-base font-bold text-emerald-50">
              Prépare tes doigts sur le clavier AZERTY !
            </span>
          )}
        </div>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onQuitToMenu();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-800 text-white font-bold text-sm cursor-pointer transition-colors whitespace-nowrap"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span>Menu</span>
        </button>
      </footer>

      {/* Pause Modal */}
      {phase === 'paused' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center px-4 bg-sky-950/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white border-4 border-sky-300 shadow-2xl p-6 sm:p-7 text-center flex flex-col items-center gap-5">
            <h2 id="pause-title" className="font-display text-3xl font-bold text-slate-900">
              Jeu en pause
            </h2>
            <p className="text-sm font-semibold text-slate-600">
              Reprends quand tu es prêt, ou retourne au menu pour changer tes options.
            </p>
            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={onResume}
                className="w-full py-3.5 px-6 min-h-[50px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xl font-bold border-b-4 border-emerald-800 cursor-pointer transition-colors"
              >
                Reprendre
              </button>
              <button
                type="button"
                onClick={onQuitToMenu}
                className="w-full py-3 px-6 min-h-[46px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base border-2 border-slate-300 cursor-pointer transition-colors"
              >
                Retour au menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
