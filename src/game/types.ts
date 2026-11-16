export type DifficultyLevel = 1 | 2 | 3;

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export interface GameConfig {
  level: DifficultyLevel;
  allowUppercase: boolean;
  allowSpecialChars: boolean;
  soundEnabled: boolean;
}

export interface FallingWord {
  id: number;
  text: string;
  typedCount: number;
  /** Horizontal position as percentage of arena width (10 to 90) */
  xPercent: number;
  /** Vertical position in pixels from top of arena */
  y: number;
  /** Fall speed in pixels per second */
  speed: number;
  /** Visual variant for cloud/balloon tint */
  variant: 0 | 1 | 2 | 3;
  /** Timestamp until which the word shows a gentle error shake */
  shakeUntil: number;
}

export interface ScorePopup {
  id: number;
  xPercent: number;
  y: number;
  points: number;
  label?: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface GameStats {
  score: number;
  bestScore: number;
  wordsCompleted: number;
  correctKeys: number;
  mistakes: number;
  combo: number;
  maxCombo: number;
}
