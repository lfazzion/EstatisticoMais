import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import Header from '../components/Header';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import MixedText from '../components/MixedText';

type HintRouteProp = RouteProp<RootStackParamList, 'Hint'>;

export default function HintScreen() {
  const route = useRoute<HintRouteProp>();
  const { hint } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Dica" showBackButton />
      <View style={styles.content}>
        {/* Centralizar o texto */}
        <View style={styles.textContainer}>
          <MixedText content={hint} style={styles.hintText} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center', // Centraliza horizontalmente
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center', // Garante a centralização horizontal do conteúdo
  },
  hintText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
});
