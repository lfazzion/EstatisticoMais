// screens/GamesScreen.tsx

import React, { useContext } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

// Defina o tipo de navegação para esta tela
type GamesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Games'>;

export default function GamesScreen() {
  // Use o hook de navegação tipado
  const navigation = useNavigation<GamesScreenNavigationProp>();
  const { darkModeEnabled } = useContext(ThemeContext);

  return (
    <SafeAreaView
      style={[
        styles.container,
        darkModeEnabled ? styles.darkContainer : styles.lightContainer,
      ]}
    >
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
      />
      <Header title="Jogos" showBackButton />
      <View style={styles.content}>
        <TouchableOpacity
          style={[
            styles.button,
            darkModeEnabled ? styles.darkButton : styles.lightButton,
          ]}
          onPress={() => navigation.navigate('FormulaGame')}
        >
          <Text style={styles.buttonText}>Jogo de Fórmulas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            darkModeEnabled ? styles.darkButton : styles.lightButton,
          ]}
          onPress={() => navigation.navigate('QuizGame')}
        >
          <Text style={styles.buttonText}>Quiz de Estatística</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginVertical: 10,
  },
  lightButton: {
    backgroundColor: '#4caf50',
  },
  darkButton: {
    backgroundColor: '#006400',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});
