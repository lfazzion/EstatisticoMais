// screens/PasswordResetScreen.tsx
// Importações necessárias para a tela de redefinição de senha
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth } from '../firebaseConfig'; // Importa a instância de autenticação configurada do Firebase
import { sendPasswordResetEmail } from 'firebase/auth'; // Função para enviar o email de redefinição de senha
import { useNavigation } from '@react-navigation/native'; // Hook para navegação
import { StackNavigationProp } from '@react-navigation/stack'; // Tipagem para navegação
import { RootStackParamList } from '../types/navigation'; // Tipos de navegação da aplicação
import { FirebaseError } from 'firebase/app'; // Tipagem para erro do Firebase

// Componente funcional da tela de redefinição de senha
export default function PasswordResetScreen(): JSX.Element {
  // Cria o objeto de navegação para poder navegar entre telas
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Define estados para email, erro e carregamento
  const [email, setEmail] = useState<string>(''); // Estado para armazenar o email digitado pelo usuário
  const [error, setError] = useState<string>(''); // Estado para armazenar mensagens de erro
  const [loading, setLoading] = useState<boolean>(false); // Estado para indicar carregamento ao enviar o email

  // Função para validar o formato do email usando uma expressão regular
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email); // Retorna verdadeiro se o email for válido
  };

  // Função assíncrona para enviar o email de redefinição de senha
  const resetPassword = async () => {
    const trimmedEmail = email.trim(); // Remove espaços em branco do email
    if (trimmedEmail === '') { // Verifica se o campo de email está vazio
      setError('Por favor, insira seu email.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) { // Verifica se o email é válido
      setError('Email inválido. Verifique o email digitado.');
      return;
    }

    setLoading(true); // Ativa o indicador de carregamento
    try {
      // Envia o email de redefinição de senha
      await sendPasswordResetEmail(auth, trimmedEmail);
      setLoading(false); // Desativa o carregamento ao finalizar
      // Exibe um alerta de sucesso e navega para a tela de Login
      Alert.alert(
        'Email Enviado',
        'Um email de redefinição de senha foi enviado para o seu email.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'), // Volta para a tela de login ao confirmar
          },
        ],
        { cancelable: false }
      );
    } catch (error: FirebaseError | any) { // Trata erros possíveis
      setLoading(false); // Desativa o carregamento ao ocorrer um erro
      const errorCode = error.code;
      if (errorCode === 'auth/user-not-found') {
        setError('Usuário não encontrado. Verifique o email digitado.');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Email inválido. Verifique o email digitado.');
      } else if (errorCode === 'auth/network-request-failed') {
        Alert.alert('Erro', 'Falha na rede. Verifique sua conexão e tente novamente.');
      } else {
        setError('Ocorreu um erro. Tente novamente mais tarde.');
      }
    }
  };

  // Renderização da interface da tela
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail} // Atualiza o estado do email conforme o usuário digita
        value={email}
        accessibilityLabel="Campo de email"
        accessibilityHint="Digite seu email para recuperação de senha"
      />
      {error !== '' && (
        <Text style={styles.errorText}>{error}</Text> // Exibe mensagem de erro, se existir
      )}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              email.trim() === '' || !isValidEmail(email) || loading ? '#ccc' : '#4caf50', // Desativa o botão caso o email seja inválido ou o carregamento esteja ativo
          },
        ]}
        onPress={resetPassword} // Chama a função de redefinição de senha ao pressionar o botão
        disabled={email.trim() === '' || !isValidEmail(email) || loading}
        accessibilityLabel="Enviar email de recuperação de senha"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" /> // Exibe o indicador de carregamento se estiver processando
        ) : (
          <Text style={styles.buttonText}>Enviar Email</Text> // Texto do botão
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')} // Navega para a tela de login
        accessibilityLabel="Voltar ao Login"
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>Voltar ao Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos da tela
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
  button: {
    width: '100%',
    height: 50,
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
