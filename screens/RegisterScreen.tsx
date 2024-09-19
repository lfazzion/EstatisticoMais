// RegisterScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { firebase } from '../firebaseConfig';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registerUser = () => {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(() => {
        alert('Usuário registrado com sucesso!');
        navigation.navigate('Login');
      })
      .catch(error => alert(error.message));
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={email => setEmail(email)}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        onChangeText={password => setPassword(password)}
        value={password}
      />
      <Button title="Registrar" onPress={registerUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  // estilos aqui
});
