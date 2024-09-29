// screens/VideosScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import Header from '../components/Header'; // Certifique-se de que o componente Header existe neste caminho e aceita as props title e showBackButton

export default function VideosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Videos" showBackButton /> 
      <View style={styles.content}>
        <Text style={styles.text}>Aqui você pode adicionar videos educacionais.</Text>
        {/* Implemente os vídeos ou links para vídeos aqui */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Ajuste a cor de fundo conforme desejado
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16, // Adicione padding para dar espaço ao conteúdo
  },
  text: {
    fontSize: 16,
    color: '#333', // Cor do texto
    textAlign: 'center', // Centraliza o texto dentro do View
  },
});
