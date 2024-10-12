// contexts/ThemeContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import { Alert, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextProps {
  darkModeEnabled: boolean;
  toggleDarkMode: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextProps>({
  darkModeEnabled: false,
  toggleDarkMode: async () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [darkModeEnabled, setDarkModeEnabled] = useState<boolean>(false);
  const systemTheme = useColorScheme();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedDarkMode = await AsyncStorage.getItem('darkModeEnabled');
        if (storedDarkMode !== null) {
          setDarkModeEnabled(JSON.parse(storedDarkMode));
        } else {
          // Se não houver configuração salva, use o tema do sistema
          setDarkModeEnabled(systemTheme === 'dark');
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de modo escuro:', error);
      }
    };
    loadSettings();
  }, [systemTheme]);

  const toggleDarkMode = async () => {
    const newValue = !darkModeEnabled;
    setDarkModeEnabled(newValue);
    try {
      // Salvar a preferência de modo escuro no AsyncStorage
      await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(newValue));
    } catch (error) {
      console.error('Erro ao salvar preferências de modo escuro:', error);
      Alert.alert('Erro', 'Não foi possível salvar a preferência de modo escuro. Tente novamente.');
    }
  };

  return (
    <ThemeContext.Provider value={{ darkModeEnabled, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};