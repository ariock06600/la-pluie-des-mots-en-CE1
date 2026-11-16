import React from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import type { DifficultyLevel, GameConfig } from '../game/types';

interface ConfigMenuProps {
  config: GameConfig;
  bestScore: number;
  onChangeConfig: (next: GameConfig) => void;
  onStart: () => void;
}

const LEVELS: Array<{
  id: DifficultyLevel;
  badge: string;
  title: string;
  description: string;
  examplePlain: string;
  exampleSpecial: string;
  accentBg: string;
  accentBorder: string;
}> = [
  {
    id: 1,
    badge: 'Niveau 1',
    title: 'Débutant',
    description: 'Des lettres simples qui tombent une par une.',
    examplePlain: 'a · m · r',
    exampleSpecial: 'é · ç · à',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-500',
  },
  {
    id: 2,
    badge: 'Niveau 2',
    title: 'Intermédiaire',
    description: 'Des mots courts de 5 lettres maximum.',
    examplePlain: 'chat · lune',
    exampleSpecial: 'école · vélo',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-500',
  },
  {
    id: 3,
    badge: 'Niveau 3',
    title: 'Expert',
    description: 'Des mots plus longs jusqu’à 10 lettres.',
    examplePlain: 'cartable · soleil',
    exampleSpecial: 'éléphant · l’école',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-500',
  },
];

export const ConfigMenu: React.FC<ConfigMenuProps> = ({
  config,
  bestScore,
  onChangeConfig,
  onStart,
}) => {
  const setLevel = (level: DifficultyLevel) => {
    onChangeConfig({ ...config, level });
  };

  const toggleUppercase = (allowUppercase: boolean) => {
    onChangeConfig({ ...config, allowUppercase });
  };

  const toggleSpecialChars = (allowSpecialChars: boolean) => {
    onChangeConfig({ ...config, allowSpecialChars });
  };

  const toggleSound = () => {
    onChangeConfig({ ...config, soundEnabled: !config.soundEnabled });
  };

  return (
    <main className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        {/* Title Emblem & Sound Control */}
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Custom SVG Cloud-Keyboard Mascot */}
            <svg
              viewBox="0 0 64 56"
              className="w-14 h-12 sm:w-16 sm:h-14 shrink-0"
              aria-hidden="true"
            >
              <path
                d="M17 44H48C54.6 44 60 38.8 60 32.3C60 26.5 55.7 21.7 50.1 20.8C48.2 12.9 41.1 7 32.5 7C22.8 7 14.9 14.6 14.5 24.2C9.1 25.1 5 29.8 5 35.4C5 40.2 8.9 44 13.8 44H17Z"
                fill="#FFFFFF"
                stroke="#0284C7"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <rect x="20" y="23" width="10" height="10" rx="2.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2" />
              <text
                x="25"
                y="31"
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="700"
                fill="#854D0E"
                fontFamily="Verdana, sans-serif"
              >
                A
              </text>
              <rect x="34" y="23" width="10" height="10" rx="2.5" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" />
              <text
                x="39"
                y="31"
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="700"
                fill="#075985"
                fontFamily="Verdana, sans-serif"
              >
                Z
              </text>
            </svg>
            <div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-none">
                Pluie de Mots
              </h1>
              <p className="text-sm sm:text-base font-semibold text-sky-900/80 mt-1">
                Atelier clavier AZERTY · Programme CE1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {bestScore > 0 && (
              <div className="hidden sm:block text-right pr-2">
                <div className="text-xs font-bold text-slate-600">Meilleur score</div>
                <div className="font-display text-xl font-bold text-amber-700 tabular-nums">
                  {bestScore} pts
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={toggleSound}
              aria-label={config.soundEnabled ? 'Couper le son' : 'Activer le son'}
              aria-pressed={config.soundEnabled}
              className="flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-2xl bg-white border-2 border-sky-200 text-slate-800 font-bold text-sm shadow-sm hover:border-sky-400 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 cursor-pointer whitespace-nowrap"
            >
              {config.soundEnabled ? (
                <>
                  <Volume2 className="w-5 h-5 text-sky-600" aria-hidden="true" />
                  <span>Son activé</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-5 h-5 text-slate-500" aria-hidden="true" />
                  <span>Son coupé</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Configuration Card */}
        <section
          aria-label="Configuration de la partie"
          className="w-full bg-white/95 rounded-3xl border-2 border-sky-200 shadow-lg p-5 sm:p-8 flex flex-col gap-6"
        >
          {/* Step 1: Difficulty Level */}
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              1. Choisis ton niveau
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {LEVELS.map((lvl) => {
                const selected = config.level === lvl.id;
                const example = config.allowSpecialChars ? lvl.exampleSpecial : lvl.examplePlain;
                const displayExample = config.allowUppercase
                  ? example.charAt(0).toLocaleUpperCase('fr-FR') + example.slice(1)
                  : example;

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setLevel(lvl.id)}
                    aria-pressed={selected}
                    className={`text-left rounded-2xl p-4 min-h-[120px] border-3 transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 flex flex-col justify-between gap-2 ${
                      selected
                        ? `${lvl.accentBg} ${lvl.accentBorder} shadow-md scale-[1.01]`
                        : 'bg-slate-50 border-slate-200 hover:border-sky-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-600">{lvl.badge}</div>
                      <div className="font-display text-xl font-bold text-slate-900 mt-0.5">
                        {lvl.title}
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mt-1 leading-snug">
                        {lvl.description}
                      </p>
                    </div>
                    <div className="font-word text-sm font-bold text-slate-600 pt-1">
                      Ex. : {displayExample}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Capitalization & Special Chars Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Uppercase Toggle */}
            <div className="rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 flex flex-col justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  2. Majuscules
                </h2>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">
                  Ajouter des lettres majuscules ? (ex. : Chat, A)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Option majuscules">
                <button
                  type="button"
                  onClick={() => toggleUppercase(false)}
                  aria-pressed={!config.allowUppercase}
                  className={`py-2.5 px-3 min-h-[46px] rounded-xl font-bold text-sm border-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 whitespace-nowrap ${
                    !config.allowUppercase
                      ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400'
                  }`}
                >
                  Sans majuscules
                </button>
                <button
                  type="button"
                  onClick={() => toggleUppercase(true)}
                  aria-pressed={config.allowUppercase}
                  className={`py-2.5 px-3 min-h-[46px] rounded-xl font-bold text-sm border-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 whitespace-nowrap ${
                    config.allowUppercase
                      ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400'
                  }`}
                >
                  Avec majuscules
                </button>
              </div>
            </div>

            {/* Accents & Special Characters Toggle */}
            <div className="rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 flex flex-col justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  3. Accents et signes
                </h2>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">
                  Inclure é, è, ê, à, ç, ô, l’apostrophe (’) et le tiret (-) ?
                </p>
              </div>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Option accents et caractères spéciaux"
              >
                <button
                  type="button"
                  onClick={() => toggleSpecialChars(false)}
                  aria-pressed={!config.allowSpecialChars}
                  className={`py-2.5 px-3 min-h-[46px] rounded-xl font-bold text-sm border-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 whitespace-nowrap ${
                    !config.allowSpecialChars
                      ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400'
                  }`}
                >
                  Sans accents
                </button>
                <button
                  type="button"
                  onClick={() => toggleSpecialChars(true)}
                  aria-pressed={config.allowSpecialChars}
                  className={`py-2.5 px-3 min-h-[46px] rounded-xl font-bold text-sm border-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 whitespace-nowrap ${
                    config.allowSpecialChars
                      ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400'
                  }`}
                >
                  Avec accents
                </button>
              </div>
            </div>
          </div>

          {/* Primary Play Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200">
            <p className="text-sm font-semibold text-slate-600 text-center sm:text-left">
              Tu as <strong>5 cœurs</strong>. Tape vite pour gagner plus de points !
            </p>
            <button
              type="button"
              data-start="true"
              onClick={onStart}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 text-white font-display text-2xl font-bold shadow-md border-b-4 border-emerald-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 whitespace-nowrap shrink-0"
            >
              <Play className="w-6 h-6 fill-current" aria-hidden="true" />
              <span>Jouer !</span>
            </button>
          </div>
        </section>

        {/* Flat control hint */}
        <p className="text-xs sm:text-sm font-bold text-sky-950/70 text-center">
          Astuce : utilise ton clavier AZERTY · Touche Entrée pour démarrer · Échap pour faire une pause
        </p>
      </div>
    </main>
  );
};
