// screens/AlunoHomeScreen.tsx

import React, { useContext } from 'react';
import { Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Componente para garantir que a área segura seja respeitada em dispositivos com notch
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { AlunoDrawerParamList } from '../types/navigation'; // Tipos de navegação específicos da área do aluno
import { ThemeContext } from '../contexts/ThemeContext'; // Importando ThemeContext para suporte ao modo escuro

// Definição do tipo de navegação específico para esta tela
type AlunoHomeScreenNavigationProp = DrawerNavigationProp<AlunoDrawerParamList, 'AlunoHome'>;

// Componente principal da tela inicial do aluno
export default function AlunoHomeScreen() {
  // Hook de navegação para facilitar a navegação entre telas
  const navigation = useNavigation<AlunoHomeScreenNavigationProp>();
  
  // Obter o estado do tema (claro ou escuro) do ThemeContext
  const { darkModeEnabled } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.container, darkModeEnabled ? styles.darkContainer : styles.lightContainer]}>
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#333' : '#4caf50'}
      />
      <Header title="Área do Aluno" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Botão para acessar a lista de exercícios disponíveis */}
        <TouchableOpacity
          style={[styles.button, darkModeEnabled ? styles.darkButton : styles.lightButton]}
          onPress={() => navigation.navigate('ExerciseList')}
          accessibilityLabel="Exercícios Disponíveis"
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, darkModeEnabled ? styles.darkButtonText : styles.lightButtonText]}>
            Exercícios Disponíveis
          </Text>
        </TouchableOpacity>
        {/* Botão para acessar a seção de jogos */}
        <TouchableOpacity
          style={[styles.button, darkModeEnabled ? styles.darkButton : styles.lightButton]}
          onPress={() => navigation.navigate('Games')}
          accessibilityLabel="Jogos"
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, darkModeEnabled ? styles.darkButtonText : styles.lightButtonText]}>
            Jogos
          </Text>
        </TouchableOpacity>
        {/* Botão para acessar a seção de vídeos educativos */}
        <TouchableOpacity
          style={[styles.button, darkModeEnabled ? styles.darkButton : styles.lightButton]}
          onPress={() => navigation.navigate('AlunoVideos')} // Atualizado para 'AlunoVideos'
          accessibilityLabel="Vídeos"
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, darkModeEnabled ? styles.darkButtonText : styles.lightButtonText]}>
            Vídeos
          </Text>
        </TouchableOpacity>
        {/* Botão para acessar a seção de materiais de leitura */}
        <TouchableOpacity
          style={[styles.button, darkModeEnabled ? styles.darkButton : styles.lightButton]}
          onPress={() => navigation.navigate('ReadingMaterials')}
          accessibilityLabel="Materiais de Leitura"
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, darkModeEnabled ? styles.darkButtonText : styles.lightButtonText]}>
            Materiais de Leitura
          </Text>
        </TouchableOpacity>
        {/* Outros botões para funcionalidades adicionais podem ser adicionados aqui */}
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos aplicados ao componente com suporte ao modo escuro
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#fff', // Fundo claro
  },
  darkContainer: {
    backgroundColor: '#121212', // Fundo escuro
  },
  content: {
    padding: 20, // Padding interno para o conteúdo
    alignItems: 'center', // Centraliza os elementos no eixo horizontal
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8, // Arredondamento das bordas
    justifyContent: 'center', // Centraliza o conteúdo do botão verticalmente
    alignItems: 'center', // Centraliza o conteúdo do botão horizontalmente
    marginVertical: 10, // Margem vertical entre os botões
  },
  lightButton: {
    backgroundColor: '#4caf50', // Cor verde para o fundo do botão no modo claro
  },
  darkButton: {
    backgroundColor: '#388e3c', // Cor verde mais escura para o fundo do botão no modo escuro
  },
  buttonText: {
    fontSize: 18, // Tamanho da fonte do texto do botão
  },
  lightButtonText: {
    color: '#fff', // Texto branco no botão no modo claro
  },
  darkButtonText: {
    color: '#fff', // Texto branco no botão no modo escuro
  },
});
