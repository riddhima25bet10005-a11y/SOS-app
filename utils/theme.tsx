import React, { createContext, useContext, useState, useEffect } from 'react';
import { userProfileData } from './userStore';

export type Theme = 'dark' | 'light';

export const Colors = {
  dark: {
    background: '#000000',
    card: '#121212',
    border: '#282828',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#E50000',
    primaryLight: '#E5000020',
    success: '#22C55E',
    warning: '#F59E0B',
    shadow: '#000000',
  },
  light: {
    background: '#F8F9FA',
    card: '#FFFFFF',
    border: '#E9ECEF',
    text: '#1A1D1F',
    textSecondary: '#6F767E',
    primary: '#E50000',
    primaryLight: '#FFE5E5',
    success: '#22C55E',
    warning: '#F59E0B',
    shadow: '#00000015',
  }
};

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  }
};

type ThemeContextType = {
  theme: Theme;
  colors: typeof Colors.dark;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: Colors.dark,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(userProfileData.theme || 'dark');

  useEffect(() => {
    if (userProfileData.theme && userProfileData.theme !== theme) {
      setThemeState(userProfileData.theme);
    }
  }, [userProfileData.theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Ideally we should sync back to userStore, but the UI component will handle that
  };

  const currentColors = theme === 'light' ? Colors.light : Colors.dark;

  return (
    <ThemeContext.Provider value={{ theme, colors: currentColors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
