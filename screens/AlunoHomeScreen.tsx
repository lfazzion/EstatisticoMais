// screens/AlunoHomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { AlunoDrawerParamList } from '../types/navigation';

export default function AlunoHomeScreen() {
  const navigation = useNavigation<DrawerNavigationProp<AlunoDrawerParamList>>();

  return (
    <View style={styles.container}>
      <Header title="Área do Aluno" />
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('ExerciseList')} // Navega para a tela de lista de exercícios
        >
          <Text style={styles.buttonText}>Exercícios Disponíveis</Text>
        </TouchableOpacity>
        {/* Adicione outras funcionalidades, como visualização de progresso */}
      </View>
    </View>
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
    alignItems: 'center',
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
