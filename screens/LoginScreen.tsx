// screens/LoginScreen.tsx
// Importações necessárias
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth, firestore } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FirebaseError } from 'firebase/app';

export default function LoginScreen(): JSX.Element {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const validateInputs = (): boolean => {
    if (email === '' || password === '') {
      setError('Por favor, preencha todos os campos.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido.');
      return false;
    }

    return true;
  };

  const authenticateUser = async () => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Erro ao autenticar o usuário:', error);
      throw error;
    }
  };

  const handleAuthError = (error: FirebaseError | any) => {
    if (error.code) {
      const errorCode = error.code;
      if (errorCode === 'auth/invalid-login-credentials') {
        setError('Email ou senha incorretos. Verifique seus dados e tente novamente.');
      } else if (errorCode === 'auth/user-not-found') {
        setError('Usuário não encontrado. Verifique o email digitado.');
      } else if (errorCode === 'auth/wrong-password') {
        setError('Senha incorreta. Tente novamente.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Muitas tentativas de login. Tente novamente mais tarde.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Falha na conexão de rede. Verifique sua internet e tente novamente.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Email inválido. Verifique o email digitado.');
      } else if (errorCode === 'auth/user-disabled') {
        setError('Esta conta foi desativada.');
      } else {
        setError(`Ocorreu um erro ao fazer login: ${error.message}`);
      }
    } else {
      setError('Ocorreu um erro ao fazer login. Tente novamente mais tarde.');
    }
  };

  const handleUserVerification = async (user: any) => {
    try {
      if (user.emailVerified) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.userType === 'Professor' && userData.approvalStatus === 'pendente') {
            setError('Sua conta de professor está aguardando aprovação.');
            return;
          }

          navigateToDashboard(userData.userType);
        } else {
          setError('Dados do usuário não encontrados.');
        }
      } else {
        setError('Email não verificado. Verifique seu email para ativar a conta.');
        await resendEmailVerification(user);
      }
    } catch (error) {
      console.error('Erro ao verificar o usuário:', error);
      setError('Ocorreu um erro ao verificar o usuário. Tente novamente mais tarde.');
    }
  };

  const navigateToDashboard = (userType: string) => {
    if (userType === 'Aluno') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AlunoDrawer' }],
      });
    } else if (userType === 'Professor') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfessorDrawer' }],
      });
    }
  };

  const resendEmailVerification = async (user: any) => {
    try {
      await sendEmailVerification(user);
      console.log('Email de verificação reenviado.');
      Alert.alert('Verificação de Email', 'Email de verificação reenviado. Verifique sua caixa de entrada.');
    } catch (error) {
      console.error('Erro ao reenviar email de verificação:', error);
    }
  };

  const loginUser = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      // Autenticação do usuário
      const userCredential = await authenticateUser();
      const user = userCredential.user;

      // Verificação do usuário
      await handleUserVerification(user);
    } catch (error: FirebaseError | any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
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
        onChangeText={setEmail}
        value={email}
        accessibilityLabel="Campo de email"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Senha"
          placeholderTextColor="#aaa"
          secureTextEntry={secureTextEntry}
          onChangeText={setPassword}
          value={password}
          accessibilityLabel="Campo de senha"
        />
        <Pressable
          onPress={() => setSecureTextEntry(!secureTextEntry)}
          accessibilityLabel={secureTextEntry ? 'Mostrar senha' : 'Ocultar senha'}
          accessibilityRole="button"
        >
          <Ionicons name={secureTextEntry ? 'eye-off' : 'eye'} size={24} color="#aaa" />
        </Pressable>
      </View>
      {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4caf50"
          accessibilityLabel="Carregando, por favor aguarde"
        />
      ) : (
        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: '#a5d6a7' }]}
          onPress={loginUser}
          accessibilityLabel="Botão Entrar"
          accessibilityRole="button"
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => navigation.navigate('PasswordReset')}
        accessibilityLabel="Esqueceu a senha?"
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>Esqueceu a senha?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        accessibilityLabel="Não tem uma conta? Registre-se"
        accessibilityRole="button"
      >
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