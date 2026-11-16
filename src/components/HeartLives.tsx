import React from 'react';

interface HeartLivesProps {
  lives: number;
  maxLives?: number;
}

export const HeartLives: React.FC<HeartLivesProps> = ({ lives, maxLives = 5 }) => {
  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-label={`${lives} vies restantes sur ${maxLives}`}
      data-testid="hud-lives"
      data-lives={lives}
    >
      {Array.from({ length: maxLives }).map((_, idx) => {
        const active = idx < lives;
        return (
          <svg
            key={idx}
            viewBox="0 0 28 26"
            className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 ${
              active ? 'scale-100' : 'scale-90 opacity-60'
            }`}
            aria-hidden="true"
          >
            <path
              d="M14 24.2C13.6 24.2 13.2 24.05 12.9 23.8C6.6 18.4 2 14.1 2 8.7C2 4.7 5.1 1.6 9 1.6C11.2 1.6 13.1 2.7 14 4.2C14.9 2.7 16.8 1.6 19 1.6C22.9 1.6 26 4.7 26 8.7C26 14.1 21.4 18.4 15.1 23.8C14.8 24.05 14.4 24.2 14 24.2Z"
              fill={active ? '#F43F5E' : '#E2E8F0'}
              stroke={active ? '#9F1239' : '#94A3B8'}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {active && (
              <path
                d="M6.4 7.5C6.4 5.9 7.6 4.7 9.1 4.7"
                stroke="#FFE4E6"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </svg>
        );
      })}
    </div>
  );
};
