import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const storageKey = 'ccd-theme';

const themeOptions = [
  {
    id: 'light',
    name: 'Light',
    description: 'Airy whites with warm cafe hues',
    accent: '#f97316'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Moody blues with luminous highlights',
    accent: '#f97316'
  },
  {
    id: 'ambient',
    name: 'Ambient',
    description: 'Dreamy purples with mint undertones',
    accent: '#6366f1'
  }
];

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    if (typeof window === 'undefined') {
      return themeOptions[0].id;
    }
    return localStorage.getItem(storageKey) || themeOptions[0].id;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    localStorage.setItem(storageKey, themeId);
  }, [themeId]);

  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      themes: themeOptions,
      activeTheme: themeOptions.find((option) => option.id === themeId) || themeOptions[0]
    }),
    [themeId]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const themes = themeOptions;
