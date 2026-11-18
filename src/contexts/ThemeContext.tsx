import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

export const STORAGE_KEY = 'lord-reader-theme';
const LEGACY_STORAGE_KEY = 'zando-theme';
export const CYCLE: ThemeMode[] = ['light', 'dark'];

export function getSystemPreference(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) return 'dark';
  return 'light';
}

export function readStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const legacy = stored ? null : localStorage.getItem(LEGACY_STORAGE_KEY);
    const savedTheme = stored ?? legacy;
    if (savedTheme && CYCLE.includes(savedTheme as ThemeMode)) {
      if (!stored) {
        try {
          localStorage.setItem(STORAGE_KEY, savedTheme);
        } catch (error) {
          console.error('Impossible de migrer le thème enregistré.', error);
        }
      }
      return savedTheme as ThemeMode;
    }
  } catch (error) {
    console.error('Impossible de lire le thème enregistré.', error);
  }
  return null;
}

export function applyTheme(mode: ThemeMode): void {
  const body = document.body;
  body.classList.remove('ion-palette-dark', 'ion-palette-high-contrast-dark');

  if (mode === 'dark') {
    body.classList.add('ion-palette-dark', 'ion-palette-high-contrast-dark');
  }
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
