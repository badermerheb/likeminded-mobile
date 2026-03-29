import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {darkColors, lightColors, type ThemeColors, _setActiveColors} from './colors';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';

  // Update the module-level proxy so StyleSheet and non-hook consumers
  // always resolve to the correct palette on every property access.
  _setActiveColors(isDark ? darkColors : lightColors);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
    }),
    [isDark],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
