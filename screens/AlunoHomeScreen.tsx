// screens/AlunoHomeScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, ScrollView } from 'react-native';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { AlunoDrawerParamList } from '../types/navigation';

export default function AlunoHomeScreen() {
  const navigation = useNavigation<DrawerNavigationProp<AlunoDrawerParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Área do Aluno" />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('ExerciseList')}
        >
          <Text style={styles.buttonText}>Exercícios Disponíveis</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Games')}
        >
          <Text style={styles.buttonText}>Jogos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Videos')}
        >
          <Text style={styles.buttonText}>Vídeos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('ReadingMaterials')}
        >
          <Text style={styles.buttonText}>Materiais de Leitura</Text>
        </TouchableOpacity>
        {/* Adicione outras funcionalidades conforme necessário */}
      </ScrollView>
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
    padding: 20,
    alignItems: 'center',
    // Adicione um paddingTop para evitar sobreposição
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});