// Importação dos módulos e componentes necessários
import React from 'react';
import { Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Componente para garantir que a área segura seja respeitada em dispositivos com notch
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { AlunoDrawerParamList } from '../types/navigation'; // Tipos de navegação específicos da área do aluno

// Definição do tipo de navegação específico para esta tela
type AlunoHomeScreenNavigationProp = DrawerNavigationProp<AlunoDrawerParamList, 'AlunoHome'>;

// Componente principal da tela inicial do aluno
export default function AlunoHomeScreen() {
  // Hook de navegação para facilitar a navegação entre telas
  const navigation = useNavigation<AlunoHomeScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Área do Aluno" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Botão para acessar a lista de exercícios disponíveis */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ExerciseList')}
          accessibilityLabel="Exercícios Disponíveis"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Exercícios Disponíveis</Text>
        </TouchableOpacity>
        {/* Botão para acessar a seção de jogos */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Games')}
          accessibilityLabel="Jogos"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Jogos</Text>
        </TouchableOpacity>
        {/* Botão para acessar a seção de vídeos educativos */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Videos')}
          accessibilityLabel="Vídeos"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Vídeos</Text>
        </TouchableOpacity>
        {/* Botão para acessar a seção de materiais de leitura */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ReadingMaterials')}
          accessibilityLabel="Materiais de Leitura"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Materiais de Leitura</Text>
        </TouchableOpacity>
        {/* Outros botões para funcionalidades adicionais podem ser adicionados aqui */}
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos aplicados ao componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Fundo branco para a área segura
  },
  content: {
    padding: 20, // Padding interno para o conteúdo
    alignItems: 'center', // Centraliza os elementos no eixo horizontal
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4caf50', // Cor verde para o fundo do botão
    borderRadius: 8, // Arredondamento das bordas
    justifyContent: 'center', // Centraliza o conteúdo do botão verticalmente
    alignItems: 'center', // Centraliza o conteúdo do botão horizontalmente
    marginVertical: 10, // Margem vertical entre os botões
    // Adicione activeOpacity para feedback visual
  },
  buttonText: {
    color: '#fff', // Texto branco no botão
    fontSize: 18, // Tamanho da fonte do texto do botão
  },
});
