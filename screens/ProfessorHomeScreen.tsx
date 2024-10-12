// screens/ProfessorHomeScreen.tsx
// Importações necessárias
import React, { useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, ScrollView } from 'react-native';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ProfessorDrawerParamList } from '../types/navigation';
import { ThemeContext } from '../contexts/ThemeContext';

export default function ProfessorHomeScreen() {
  // Obter a navegação e o contexto do tema (claro/escuro)
  const navigation = useNavigation<DrawerNavigationProp<ProfessorDrawerParamList>>();
  const { darkModeEnabled } = useContext(ThemeContext);

  // useCallback para evitar recriação das funções de navegação a cada renderização
  const handleViewExercises = useCallback(() => {
    navigation.navigate('ProfessorExercises'); // Navegar para a tela de exercícios do professor
  }, [navigation]);

  const handleViewVideos = useCallback(() => {
    navigation.navigate('ProfessorVideos'); // Navegar para a tela de vídeos do professor
  }, [navigation]);

  const handleViewMaterials = useCallback(() => {
    navigation.navigate('ProfessorMaterials'); // Navegar para a tela de materiais de leitura do professor
  }, [navigation]);

  const handleViewStudentStats = useCallback(() => {
    navigation.navigate('StudentStatistics'); // Navegar para a tela de estatísticas dos alunos
  }, [navigation]);

  // Função para obter estilo condicional com base no modo escuro/claro
  const getConditionalStyle = (lightStyle: any, darkStyle: any) => {
    return darkModeEnabled ? darkStyle : lightStyle; // Retorna o estilo apropriado com base no tema
  };

  return (
    <SafeAreaView style={[styles.container, getConditionalStyle(styles.lightContainer, styles.darkContainer)]}>
      {/* Configura a barra de status com estilo condicional */}
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
      />
      {/* Cabeçalho da área do professor */}
      <Header title="Área do Professor" />
      {/* Conteúdo da tela em um ScrollView */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Botão para acessar os exercícios do professor */}
        <TouchableOpacity 
          style={[styles.button, getConditionalStyle(styles.lightButton, styles.darkButton)]}
          onPress={handleViewExercises}
        >
          <Text style={styles.buttonText}>Meus Exercícios</Text>
        </TouchableOpacity>
        {/* Botão para acessar os vídeos do professor */}
        <TouchableOpacity 
          style={[styles.button, getConditionalStyle(styles.lightButton, styles.darkButton)]}
          onPress={handleViewVideos}
        >
          <Text style={styles.buttonText}>Meus Vídeos</Text>
        </TouchableOpacity>
        {/* Botão para acessar os materiais de leitura do professor */}
        <TouchableOpacity 
          style={[styles.button, getConditionalStyle(styles.lightButton, styles.darkButton)]}
          onPress={handleViewMaterials}
        >
          <Text style={styles.buttonText}>Meus Materiais de Leitura</Text>
        </TouchableOpacity>
        {/* Botão para acessar as estatísticas dos alunos */}
        <TouchableOpacity 
          style={[styles.button, getConditionalStyle(styles.lightButton, styles.darkButton)]}
          onPress={handleViewStudentStats}
        >
          <Text style={styles.buttonText}>Estatísticas dos Alunos</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#fff', // Cor de fundo para o tema claro
  },
  darkContainer: {
    backgroundColor: '#333', // Cor de fundo para o tema escuro
  },
  content: {
    padding: 20,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight, // Adiciona paddingTop para evitar sobreposição no Android
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  lightButton: {
    backgroundColor: '#4caf50', // Cor do botão no tema claro
  },
  darkButton: {
    backgroundColor: '#555', // Cor do botão no tema escuro
  },
  buttonText: {
    color: '#fff', // Cor do texto dos botões
    fontSize: 18,
  },
});