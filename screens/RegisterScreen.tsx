// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

import Ionicons from 'react-native-vector-icons/Ionicons';

export default function RegisterScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmEntry, setSecureConfirmEntry] = useState(true);

  const registerUser = () => {
    if (email === '' || password === '' || confirmPassword === '') {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Registro bem-sucedido
        setError('');
        const user = userCredential.user;
        await setDoc(doc(firestore, 'users', user.uid), {
          email: user.email,
          createdAt: serverTimestamp(),
        });
        // Enviar email de verificação
        await sendEmailVerification(user);
        // Exibir alerta informando que o email de verificação foi enviado
        Alert.alert(
          'Registro bem-sucedido',
          'Um email de verificação foi enviado para o seu email. Verifique sua caixa de entrada para ativar sua conta.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ],
          { cancelable: false }
        );
      })
      .catch(error => {
        const errorCode = error.code;
        if (errorCode === 'auth/email-already-in-use') {
          setError('Este email já está cadastrado. Utilize outro email.');
        } else if (errorCode === 'auth/invalid-email') {
          setError('Email inválido. Verifique o email digitado.');
        } else if (errorCode === 'auth/weak-password') {
          setError('A senha deve ter pelo menos 6 caracteres.');
        } else {
          setError('Ocorreu um erro ao registrar. Tente novamente mais tarde.');
        }
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar-se</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={email => setEmail(email)}
        value={email}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Senha"
          placeholderTextColor="#aaa"
          secureTextEntry={secureTextEntry}
          onChangeText={password => setPassword(password)}
          value={password}
        />
        <Pressable onPress={() => setSecureTextEntry(!secureTextEntry)}>
          <Ionicons
            name={secureTextEntry ? 'eye-off' : 'eye'}
            size={24}
            color="#aaa"
          />
        </Pressable>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirmar Senha"
          placeholderTextColor="#aaa"
          secureTextEntry={secureConfirmEntry}
          onChangeText={confirmPassword => setConfirmPassword(confirmPassword)}
          value={confirmPassword}
        />
        <Pressable onPress={() => setSecureConfirmEntry(!secureConfirmEntry)}>
          <Ionicons
            name={secureConfirmEntry ? 'eye-off' : 'eye'}
            size={24}
            color="#aaa"
          />
        </Pressable>
      </View>
      {error !== '' && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={registerUser}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    marginBottom: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  linkText: {
    color: '#4caf50',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
