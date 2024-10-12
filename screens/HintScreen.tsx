// screens/HintScreen.tsx
// Importações necessárias para os módulos e componentes
import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Text } from 'react-native';
import Header from '../components/Header'; // Componente de cabeçalho personalizado
import { RouteProp, useRoute } from '@react-navigation/native'; // Hooks e tipos de navegação
import { RootStackParamList } from '../types/navigation'; // Tipos definidos para as rotas de navegação
import MixedText from '../components/MixedText'; // Componente que renderiza texto com suporte a LaTeX

// Define o tipo para a rota "Hint" que é usada para acessar esta tela
type HintRouteProp = RouteProp<RootStackParamList, 'Hint'>;

// Função principal do componente de tela HintScreen
export default function HintScreen() {
  // Usa o hook useRoute para acessar os parâmetros passados para a rota atual
  const route = useRoute<HintRouteProp>();
  
  // Verifica se os parâmetros da rota são válidos. Caso contrário, exibe uma mensagem de erro.
  if (!route.params || !route.params.hint) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle='light-content' backgroundColor='#4caf50' />
        <Header title='Dica' showBackButton />
        <View style={styles.content}>
          {/* Texto de erro exibido caso não haja uma dica disponível */}
          <Text style={styles.errorText}>Nenhuma dica disponível.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Extrai o parâmetro "hint" da rota, contendo o conteúdo da dica
  const { hint } = route.params;

  // Caso haja uma dica disponível, exibe-a usando o componente MixedText
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='light-content' backgroundColor='#4caf50' />
      <Header title='Dica' showBackButton />
      <View style={styles.content}>
        {/* MixedText renderiza a dica e suporta LaTeX no texto */}
        <MixedText
          content={hint}
          style={styles.hintText}
        />
      </View>
    </SafeAreaView>
  );
}

// Estilos aplicados aos elementos da tela
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Fundo branco para a tela
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
    color: '#333', // Cor do texto em cinza escuro
  },
  errorText: {
    fontSize: 18, // Tamanho da fonte para o texto de erro
    textAlign: 'center', // Centraliza o texto de erro
    color: 'red', // Cor vermelha para o texto de erro
  },
});
