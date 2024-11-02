// screens/HintScreen.tsx

import React, { useContext } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Text } from 'react-native';
import Header from '../components/Header'; // Componente de cabeçalho personalizado
import { RouteProp, useRoute } from '@react-navigation/native'; // Hooks e tipos de navegação
import { RootStackParamList } from '../types/navigation'; // Tipos definidos para as rotas de navegação
import MixedText from '../components/MixedText'; // Componente que renderiza texto com suporte a LaTeX
import { ThemeContext } from '../contexts/ThemeContext'; // Importação do ThemeContext

// Define o tipo para a rota "Hint" que é usada para acessar esta tela
type HintRouteProp = RouteProp<RootStackParamList, 'Hint'>;

// Função principal do componente de tela HintScreen
export default function HintScreen() {
  // Usa o hook useRoute para acessar os parâmetros passados para a rota atual
  const route = useRoute<HintRouteProp>();

  // Obter o estado do modo escuro do contexto
  const { darkModeEnabled } = useContext(ThemeContext);

  // Verifica se os parâmetros da rota são válidos. Caso contrário, exibe uma mensagem de erro.
  if (!route.params || !route.params.hint) {
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
        <Header title="Dica" showBackButton />
        <View style={styles.content}>
          {/* Texto de erro exibido caso não haja uma dica disponível */}
          <Text
            style={[
              styles.errorText,
              darkModeEnabled ? styles.darkErrorText : styles.lightErrorText,
            ]}
          >
            Nenhuma dica disponível.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Extrai o parâmetro "hint" da rota, contendo o conteúdo da dica
  const { hint } = route.params;

  // Caso haja uma dica disponível, exibe-a usando o componente MixedText
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
      <Header title="Dica" showBackButton />
      <View style={styles.content}>
        {/* MixedText renderiza a dica e suporta LaTeX no texto */}
        <MixedText
          content={hint}
          style={[
            styles.hintText,
            darkModeEnabled ? styles.darkText : styles.lightText,
          ]}
        />
      </View>
    </SafeAreaView>
  );
}

// Estilos aplicados aos elementos da tela
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#fff', // Fundo branco para a tela
  },
  darkContainer: {
    backgroundColor: '#333', // Fundo escuro para o modo escuro
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center', // Centraliza verticalmente o conteúdo
    alignItems: 'center', // Centraliza horizontalmente o conteúdo
  },
  hintText: {
    fontSize: 18, // Tamanho da fonte para o texto da dica
    textAlign: 'center', // Centraliza o texto da dica
  },
  lightText: {
    color: '#333', // Cor do texto em cinza escuro
  },
  darkText: {
    color: '#fff', // Cor do texto em branco para o modo escuro
  },
  errorText: {
    fontSize: 18, // Tamanho da fonte para o texto de erro
    textAlign: 'center', // Centraliza o texto de erro
  },
  lightErrorText: {
    color: 'red', // Cor vermelha para o texto de erro
  },
  darkErrorText: {
    color: '#ff6666', // Vermelho claro para o modo escuro
  },
});
