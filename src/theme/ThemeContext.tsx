import React, {createContext, useContext, useMemo, useState, useCallback} from 'react';
import {useColorScheme} from 'react-native';
import {createMMKV} from 'react-native-mmkv';
import {darkColors, lightColors, type ThemeColors, _setActiveColors} from './colors';

const storage = createMMKV({id: 'theme-storage'});
const THEME_KEY = 'theme_preference'; // 'dark' | 'light' | 'system'

type ThemePreference = 'dark' | 'light' | 'system';

function getStoredPreference(): ThemePreference {
  const val = storage.getString(THEME_KEY);
  if (val === 'dark' || val === 'light' || val === 'system') return val;
  return 'system';
}

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  preference: 'system',
  setPreference: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference);

  const isDark =
    preference === 'system' ? systemScheme !== 'light' : preference === 'dark';

  // Update the module-level proxy so StyleSheet and non-hook consumers
  // always resolve to the correct palette on every property access.
  _setActiveColors(isDark ? darkColors : lightColors);

  const setPreference = useCallback((pref: ThemePreference) => {
    storage.set(THEME_KEY, pref);
    setPreferenceState(pref);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    storage.set(THEME_KEY, next);
    setPreferenceState(next);
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      preference,
      setPreference,
      toggleTheme,
    }),
    [isDark, preference, setPreference, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
