// screens/GamesScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import Header from '../components/Header';

export default function GamesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Jogos" showBackButton />
      <View style={styles.content}>
        <Text style={styles.text}>Aqui você pode adicionar jogos educacionais.</Text>
        {/* Implemente os jogos ou links para jogos aqui */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Remova qualquer padding ou margin top
  },
  content: {
    flex: 1,
    padding: 20,
    // Adicione um paddingTop para evitar sobreposição
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});