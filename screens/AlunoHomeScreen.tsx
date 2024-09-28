// screens/AlunoHomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../firebaseConfig';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

export default function AlunoHomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const logoutUser = () => {
    signOut(auth)
      .then(() => {
        navigation.replace('Login');
      })
      .catch(error => {
        console.error('Erro ao sair:', error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá Aluno! Seja bem-vindo ao Estatístico+</Text>
      <TouchableOpacity style={styles.button} onPress={logoutUser}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
      {/* Adicione outros componentes ou botões para navegar para outras telas */}
    </View>
  );
}

const styles = StyleSheet.create({
  // Estilos básicos para o frontend
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 40,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  button: {
    width: '60%',
    height: 50,
    backgroundColor: '#f44336',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});
