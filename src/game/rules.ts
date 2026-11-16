import {
  LONG_ACCENTED_WORDS,
  LONG_PLAIN_WORDS,
  SHORT_ACCENTED_WORDS,
  SHORT_PLAIN_WORDS,
  SINGLE_LETTERS_PLAIN,
  SINGLE_SPECIAL_CHARS,
} from '../data/vocabulary';
import type { DifficultyLevel, FallingWord, GameConfig } from './types';

export const INITIAL_LIVES = 5;

/** Keys that should never trigger a typing mistake (dead keys, modifiers, navigation) */
const IGNORED_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'AltGraph',
  'Meta',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'Tab',
  'Enter',
  'Escape',
  'Dead',
  'Process',
  'Unidentified',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Backspace',
  'Delete',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Insert',
  'ContextMenu',
  'Compose',
]);

export function isPrintableGameKey(key: string): boolean {
  if (IGNORED_KEYS.has(key)) return false;
  return key.length === 1;
}

/**
 * Returns the candidate pool of words or letters matching the player's config.
 */
export function getWordPool(config: Pick<GameConfig, 'level' | 'allowSpecialChars'>): string[] {
  if (config.level === 1) {
    if (config.allowSpecialChars) {
      return [...SINGLE_LETTERS_PLAIN, ...SINGLE_SPECIAL_CHARS];
    }
    return [...SINGLE_LETTERS_PLAIN];
  }

  if (config.level === 2) {
    if (config.allowSpecialChars) {
      return [...SHORT_PLAIN_WORDS, ...SHORT_ACCENTED_WORDS];
    }
    return [...SHORT_PLAIN_WORDS];
  }

  // Niveau 3 : mots plus longs (<= 10 lettres), avec un mélange de courts et longs pour la variété
  if (config.allowSpecialChars) {
    return [...LONG_PLAIN_WORDS, ...LONG_ACCENTED_WORDS, ...SHORT_ACCENTED_WORDS];
  }
  return [...LONG_PLAIN_WORDS, ...SHORT_PLAIN_WORDS];
}

/**
 * Applies optional uppercase styling according to CE1 config:
 * - Level 1: ~45% chance a single letter is uppercase (only letters, not ' or -)
 * - Level 2 & 3: ~45% chance the first letter is capitalized
 */
export function applyCapitalization(
  word: string,
  level: DifficultyLevel,
  allowUppercase: boolean,
  rng: () => number = Math.random
): string {
  if (!allowUppercase || word.length === 0) return word;

  if (level === 1) {
    const upper = word.toLocaleUpperCase('fr-FR');
    if (upper === word) return word; // e.g. ' or -
    return rng() < 0.45 ? upper : word;
  }

  if (rng() < 0.45) {
    const first = word.charAt(0).toLocaleUpperCase('fr-FR');
    return first + word.slice(1);
  }
  return word;
}

/**
 * Picks a word from the pool, avoiding repeating words currently on screen when possible.
 */
export function pickNextWord(
  config: Pick<GameConfig, 'level' | 'allowUppercase' | 'allowSpecialChars'>,
  activeTexts: string[],
  rng: () => number = Math.random
): string {
  const pool = getWordPool(config);
  const activeLower = new Set(activeTexts.map((t) => t.toLocaleLowerCase('fr-FR')));

  // Prefer accented/special words at ~40% rate when special chars are enabled so kids actually practice them!
  let selectedPool = pool;
  if (config.allowSpecialChars && rng() < 0.42) {
    if (config.level === 1) {
      selectedPool = [...SINGLE_SPECIAL_CHARS];
    } else if (config.level === 2) {
      selectedPool = [...SHORT_ACCENTED_WORDS];
    } else {
      selectedPool = [...LONG_ACCENTED_WORDS];
    }
  }

  const available = selectedPool.filter(
    (item) => !activeLower.has(item.toLocaleLowerCase('fr-FR'))
  );
  const source = available.length > 0 ? available : pool;
  const raw = source[Math.floor(rng() * source.length)] ?? 'chat';
  return applyCapitalization(raw, config.level, config.allowUppercase, rng);
}

/**
 * Progressive speed (px/s) and spawn interval (ms) based on difficulty level and current score.
 * Designed to start gentle for 7-8 year olds and ramp smoothly.
 */
export function getDifficultyParameters(
  level: DifficultyLevel,
  score: number
): { fallSpeed: number; spawnIntervalMs: number; maxConcurrent: number } {
  const progression = Math.min(1, score / 2500);

  if (level === 1) {
    return {
      fallSpeed: 42 + progression * 44, // 42 -> 86 px/s
      spawnIntervalMs: Math.round(2300 - progression * 950), // 2.3s -> 1.35s
      maxConcurrent: score >= 600 ? 5 : 4,
    };
  }

  if (level === 2) {
    return {
      fallSpeed: 36 + progression * 38, // 36 -> 74 px/s
      spawnIntervalMs: Math.round(2800 - progression * 1100), // 2.8s -> 1.7s
      maxConcurrent: score >= 800 ? 4 : 3,
    };
  }

  // Niveau 3 (Expert)
  return {
    fallSpeed: 32 + progression * 36, // 32 -> 68 px/s (mots longs donc chute un peu plus douce au départ)
    spawnIntervalMs: Math.round(3100 - progression * 1150), // 3.1s -> 1.95s
    maxConcurrent: score >= 1000 ? 4 : 3,
  };
}

/**
 * Computes score awarded when completing a word at vertical position `y` inside `arenaHeight`.
 * Higher destruction (smaller y) grants a larger speed bonus!
 */
export function calculateWordScore(
  wordLength: number,
  y: number,
  arenaHeight: number,
  combo: number
): { total: number; base: number; heightBonus: number } {
  const safeHeight = Math.max(1, arenaHeight);
  const clampedRatio = Math.max(0, Math.min(1, y / safeHeight));
  // 1.0 at top -> 0.0 at bottom
  const heightFactor = 1 - clampedRatio;

  const base = Math.max(10, wordLength * 12);
  const heightBonus = Math.round(heightFactor * (20 + wordLength * 8));
  const comboBonus = Math.min(25, Math.max(0, combo - 1) * 3);

  return {
    base,
    heightBonus,
    total: base + heightBonus + comboBonus,
  };
}

export interface KeyResolution {
  outcome: 'ignored' | 'hit' | 'completed' | 'miss';
  targetWordId: number | null;
  newLockedWordId: number | null;
  updatedWords: FallingWord[];
  completedWord?: FallingWord;
  expectedChar?: string;
}

/**
 * Pure key-press resolution:
 * - If a word is locked, checks the next character of that locked word.
 * - If no word is locked, selects the lowest (most urgent) falling word starting with `key`.
 * - Case-sensitive when uppercase letters appear in the word (or matches exact character).
 */
export function resolveKeyPress(
  key: string,
  words: FallingWord[],
  lockedWordId: number | null,
  nowMs: number
): KeyResolution {
  if (!isPrintableGameKey(key)) {
    return {
      outcome: 'ignored',
      targetWordId: null,
      newLockedWordId: lockedWordId,
      updatedWords: words,
    };
  }

  // If no words on screen yet, ignore accidental keypress rather than punishing empty sky
  if (words.length === 0) {
    return {
      outcome: 'ignored',
      targetWordId: null,
      newLockedWordId: null,
      updatedWords: words,
    };
  }

  let target: FallingWord | undefined;
  if (lockedWordId !== null) {
    target = words.find((w) => w.id === lockedWordId);
  }

  if (!target) {
    // Find all words whose next (first) character matches `key`
    const matchingCandidates = words
      .filter((w) => w.text.charAt(w.typedCount) === key)
      .sort((a, b) => b.y - a.y); // Prioritize lowest word (closest to ground)

    if (matchingCandidates.length === 0) {
      // Find lowest word so UI can gently shake it and show expected hint
      const lowest = [...words].sort((a, b) => b.y - a.y)[0];
      const updated = words.map((w) =>
        w.id === lowest.id ? { ...w, shakeUntil: nowMs + 320 } : w
      );
      return {
        outcome: 'miss',
        targetWordId: lowest.id,
        newLockedWordId: null,
        updatedWords: updated,
        expectedChar: lowest.text.charAt(lowest.typedCount),
      };
    }

    target = matchingCandidates[0];
  }

  const expectedChar = target.text.charAt(target.typedCount);
  if (key !== expectedChar) {
    const updated = words.map((w) =>
      w.id === target!.id ? { ...w, shakeUntil: nowMs + 320 } : w
    );
    return {
      outcome: 'miss',
      targetWordId: target.id,
      newLockedWordId: target.id,
      updatedWords: updated,
      expectedChar,
    };
  }

  // Correct key!
  const nextTypedCount = target.typedCount + 1;
  if (nextTypedCount >= target.text.length) {
    // Word completed!
    const remaining = words.filter((w) => w.id !== target!.id);
    return {
      outcome: 'completed',
      targetWordId: target.id,
      newLockedWordId: null,
      updatedWords: remaining,
      completedWord: { ...target, typedCount: nextTypedCount },
    };
  }

  // Word partially typed and remains locked
  const updated = words.map((w) =>
    w.id === target!.id ? { ...w, typedCount: nextTypedCount } : w
  );
  return {
    outcome: 'hit',
    targetWordId: target.id,
    newLockedWordId: target.id,
    updatedWords: updated,
  };
}

export function getEncouragingFeedback(score: number, wordsCompleted: number): {
  title: string;
  message: string;
  stars: 1 | 2 | 3;
} {
  if (score >= 800 || wordsCompleted >= 20) {
    return {
      title: 'Champion du clavier !',
      message: 'Tes doigts volent sur les touches comme des éclairs. Quelle rapidité !',
      stars: 3,
    };
  }
  if (score >= 300 || wordsCompleted >= 8) {
    return {
      title: 'Très beau travail !',
      message: 'Tu connais de mieux en mieux ton clavier AZERTY. Continue comme ça !',
      stars: 2,
    };
  }
  return {
    title: 'Bravo pour tes efforts !',
    message: 'Chaque partie te rend plus rapide. Essaie encore, tu vas y arriver !',
    stars: 1,
  };
}
