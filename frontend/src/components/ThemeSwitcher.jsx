import { useState } from 'react';
import { PaintBrushIcon, CheckIcon } from '@heroicons/react/24/solid';
import { themes as themeOptions, useTheme } from '../context/ThemeContext.jsx';

const gradients = {
  light: 'theme-gradient-light',
  dark: 'theme-gradient-dark',
  ambient: 'theme-gradient-ambient'
};

const ThemeSwitcher = () => {
  const { themeId, setThemeId, activeTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-layer)] px-3 py-1.5 text-xs font-semibold text-secondary shadow-sm transition hover:shadow-md"
      >
        <PaintBrushIcon className="h-4 w-4" />
        {activeTheme.name} mode
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-3 w-72 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-2xl backdrop-blur-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Choose your vibe</p>
          <div className="flex flex-col gap-3">
            {themeOptions.map((option) => {
              const active = option.id === themeId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setThemeId(option.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] ${
                    active
                      ? 'bg-[var(--accent-soft)] text-primary shadow-sm'
                      : 'bg-[var(--surface-layer)] text-secondary hover:bg-[var(--card-bg)]'
                  }`}
                >
                  <div className="theme-option-preview">
                    <span className={gradients[option.id]} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{option.name}</p>
                    <p className="text-xs text-muted">{option.description}</p>
                  </div>
                  {active && <CheckIcon className="h-5 w-5 text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
