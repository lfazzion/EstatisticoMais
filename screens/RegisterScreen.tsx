// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, firestore } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FirebaseError } from 'firebase/app';

const RegisterScreen: React.FC = (): JSX.Element => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Estados do componente
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [secureTextEntry, setSecureTextEntry] = useState<boolean>(true);
  const [secureConfirmEntry, setSecureConfirmEntry] = useState<boolean>(true);
  const [userType, setUserType] = useState<'Aluno' | 'Professor'>('Aluno');

  // Funções de validação
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Funções de manipulação
  const registerUser = async (): Promise<void> => {
    if (name === '' || email === '' || password === '' || confirmPassword === '') {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Por favor, insira um email válido.');
      return;
    }

    if (!isStrongPassword(password)) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const approvalStatus = userType === 'Professor' ? 'pendente' : 'aprovado';

      await setDoc(doc(firestore, 'users', user.uid), {
        name: name,
        email: user.email,
        userType: userType,
        approvalStatus: approvalStatus,
        createdAt: serverTimestamp(),
        xp: 0,
        level: 1,
      });

      await sendEmailVerification(user);

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
    } catch (error: FirebaseError | any) {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar-se</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor="#aaa"
        onChangeText={setName}
        value={name}
        accessibilityLabel="Campo de nome"
        accessibilityHint="Digite seu nome completo"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
        accessibilityLabel="Campo de email"
        accessibilityHint="Digite seu email"
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
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          accessibilityLabel="Campo de confirmação de senha"
        />
        <Pressable
          onPress={() => setSecureConfirmEntry(!secureConfirmEntry)}
          accessibilityLabel={secureConfirmEntry ? 'Mostrar senha' : 'Ocultar senha'}
          accessibilityRole="button"
        >
          <Ionicons
            name={secureConfirmEntry ? 'eye-off' : 'eye'}
            size={24}
            color="#aaa"
          />
        </Pressable>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={userType}
          onValueChange={(itemValue) => setUserType(itemValue)}
          style={styles.picker}
          accessibilityLabel="Selecionar tipo de usuário"
        >
          <Picker.Item label="Aluno" value="Aluno" />
          <Picker.Item label="Professor" value="Professor" />
        </Picker>
      </View>
      {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              loading || !name || !email || !password || !confirmPassword ? '#ccc' : '#4caf50',
          },
        ]}
        onPress={registerUser}
        disabled={loading || !name || !email || !password || !confirmPassword}
        accessibilityLabel="Botão Registrar"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrar</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        accessibilityLabel="Já tem uma conta? Faça login"
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#333',
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
