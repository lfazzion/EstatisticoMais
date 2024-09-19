// HomeScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Estatístico+</Text>
      {/* Implemente os elementos de gamificação aqui */}
      <Button title="Perfil" onPress={() => navigation.navigate('Profile')} />
      <Button title="Exercícios" onPress={() => navigation.navigate('Exercise')} />
      {/* Se o usuário for professor, mostrar opção para adicionar exercícios */}
      <Button title="Adicionar Exercício" onPress={() => navigation.navigate('Teacher')} />
    </View>
  );
}

const styles = StyleSheet.create({
  // estilos aqui
});
