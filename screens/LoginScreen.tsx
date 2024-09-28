// screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  const loginUser = () => {
    if (email === '' || password === '') {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        if (user.emailVerified) {
          // Obter dados do usuário no Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.userType === 'Professor' && userData.approvalStatus === 'pendente') {
              setError('Sua conta de professor está aguardando aprovação.');
              setLoading(false);
              return;
            }

            // Redirecionar com base no tipo de usuário
            if (userData.userType === 'Aluno') {
              navigation.navigate('AlunoHome');
            } else if (userData.userType === 'Professor') {
              navigation.navigate('ProfessorHome');
            } else {
              setError('Tipo de usuário desconhecido.');
            }
          } else {
            setError('Dados do usuário não encontrados.');
          }
        } else {
          setError('Email não verificado. Verifique seu email para ativar a conta.');
          // Reenviar email de verificação (opcional)
          sendEmailVerification(user)
            .then(() => {
              console.log('Email de verificação reenviado.');
            })
            .catch(error => {
              console.error('Erro ao reenviar email de verificação:', error);
            });
        }
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        const errorCode = error.code;
        if (errorCode === 'auth/user-not-found') {
          setError('Usuário não encontrado. Verifique o email digitado.');
        } else if (errorCode === 'auth/wrong-password') {
          setError('Senha incorreta. Tente novamente.');
        } else {
          setError('Ocorreu um erro ao fazer login. Tente novamente mais tarde.');
        }
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estatístico+</Text>
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
      {error !== '' && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {loading ? (
        <ActivityIndicator size="large" color="#4caf50" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={loginUser}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('PasswordReset')}>
        <Text style={styles.linkText}>Esqueceu a senha?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Não tem uma conta? Registre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Seu estilo existente
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    marginBottom: 40,
    fontWeight: 'bold',
    color: '#4caf50',
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
