// screens/ProfileScreen.tsx

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Header from '../components/Header';
import { auth, firestore } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import { ProgressBar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../contexts/ThemeContext';

// Interface que define os dados do usuário
interface UserData {
  name: string;
  email: string;
  userType: 'Aluno' | 'Professor';
  level?: number;
  xp?: number;
}

const ProfileScreen: React.FC = () => {
  // Estados para armazenar os dados do usuário
  const [userData, setUserData] = useState<UserData | null>(null);

  // Estados para o nome do usuário
  const [name, setName] = useState<string>('');
  const [originalName, setOriginalName] = useState<string>('');

  // Estados para o email do usuário
  const [email, setEmail] = useState<string>('');
  const [originalEmail, setOriginalEmail] = useState<string>('');

  // Estados para as senhas
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  // Estado para armazenar erros
  const [error, setError] = useState<string>('');
  // Estado para controlar o carregamento
  const [loading, setLoading] = useState<boolean>(false);
  // Estado para controlar o carregamento dos dados
  const [fetchingData, setFetchingData] = useState<boolean>(true);

  // Estado para o tipo de usuário
  const [userType, setUserType] = useState<'Aluno' | 'Professor' | ''>('');
  // Estados para controlar a visibilidade das senhas
  const [secureTextEntryCurrent, setSecureTextEntryCurrent] = useState<boolean>(true);
  const [secureTextEntryNew, setSecureTextEntryNew] = useState<boolean>(true);
  const [secureTextEntryConfirm, setSecureTextEntryConfirm] = useState<boolean>(true);

  // Estado para armazenar a data de cadastro
  const [registrationDate, setRegistrationDate] = useState<string>('');

  // Obter o estado do modo escuro do contexto
  const { darkModeEnabled } = useContext(ThemeContext);

  // useFocusEffect para carregar os dados do usuário quando a tela é focada
  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        setFetchingData(true);
        try {
          const user = auth.currentUser;
          if (user) {
            // Obter dados do usuário do Firestore
            const docRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data() as UserData;
              setUserData(data);
              setName(data.name || '');
              setOriginalName(data.name || '');
              setEmail(user.email || '');
              setOriginalEmail(user.email || '');
              setUserType(data.userType || '');

              // Obter data de cadastro do Firebase Auth
              const creationTime = user.metadata.creationTime;
              if (creationTime) {
                setRegistrationDate(creationTime);
              }
            } else {
              console.error('Dados do usuário não encontrados');
              setError('Dados do usuário não encontrados.');
            }
          } else {
            setError('Usuário não autenticado. Faça login novamente.');
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          setError('Erro ao buscar dados do usuário.');
        } finally {
          setFetchingData(false);
        }
      };
      fetchUserData();
    }, [])
  );

  // Função para validar os inputs antes de salvar
  const validateInputs = (): boolean => {
    if (name !== originalName && name.trim() === '') {
      setError('O nome não pode estar vazio.');
      return false;
    }

    if ((email !== originalEmail || newPassword !== '') && currentPassword === '') {
      setError('Por favor, insira sua senha atual para alterar o email ou senha.');
      return false;
    }

    if (newPassword !== '') {
      if (newPassword !== confirmNewPassword) {
        setError('A nova senha e a confirmação não correspondem.');
        return false;
      }
      if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres.');
        return false;
      }
    }

    return true;
  };

  // Função para tratar erros de autenticação
  const handleAuthErrors = (error: any) => {
    if (error.code === 'auth/wrong-password') {
      setError('Senha atual incorreta. Por favor, tente novamente.');
    } else if (error.code === 'auth/too-many-requests') {
      setError('Muitas tentativas. Por favor, tente novamente mais tarde.');
    } else if (error.code === 'auth/user-mismatch') {
      setError('Usuário não corresponde. Faça login novamente.');
    } else if (error.code === 'auth/user-not-found') {
      setError('Usuário não encontrado. Faça login novamente.');
    } else if (error.code === 'auth/requires-recent-login') {
      setError('Por motivos de segurança, faça login novamente para atualizar seu email ou senha.');
    } else {
      setError('Ocorreu um erro ao atualizar o perfil. Tente novamente.');
    }
  };

  // Função para salvar as alterações do perfil
  const handleSave = async () => {
    setError('');
    setLoading(true);

    const user = auth.currentUser;

    if (!user) {
      setError('Usuário não está autenticado. Faça login novamente.');
      setLoading(false);
      return;
    }

    if (!validateInputs()) {
      setLoading(false);
      return;
    }

    try {
      const promises = [];

      // Atualizar nome se mudou
      if (name !== originalName) {
        const userRef = doc(firestore, 'users', user.uid);
        promises.push(updateDoc(userRef, { name }));
      }

      // Reautenticar se email ou senha estão sendo alterados
      if (email !== originalEmail || newPassword !== '') {
        const credential = EmailAuthProvider.credential(originalEmail, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Atualizar email se mudou
      if (email !== originalEmail) {
        await verifyBeforeUpdateEmail(user, email);

        // Atualizar email no Firestore
        const userRef = doc(firestore, 'users', user.uid);
        promises.push(updateDoc(userRef, { email }));

        Alert.alert(
          'Verifique seu email',
          'Um email de verificação foi enviado para o novo endereço. Por favor, verifique para confirmar a alteração.'
        );
      }

      // Atualizar senha se fornecida
      if (newPassword !== '') {
        await updatePassword(user, newPassword);
        Alert.alert('Sucesso', 'Senha atualizada com sucesso.');
      }

      await Promise.all(promises);

      // Limpar campos de senha
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      if (name !== originalName && email === originalEmail && newPassword === '') {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
      }

    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      handleAuthErrors(error);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular o progresso de XP
  const getXpProgress = (): number => {
    const xp = userData?.xp || 0;
    const level = userData?.level || 1;
    const nextLevelXp = getNextLevelXp(level);
    const progress = xp / nextLevelXp;
    return progress > 1 ? 1 : progress;
  };

  // Função para obter o XP necessário para o próximo nível
  const getNextLevelXp = (level: number): number => {
    const levels: { level: number; xpNeeded: number }[] = [
      { level: 1, xpNeeded: 100 },
      { level: 2, xpNeeded: 250 },
      { level: 3, xpNeeded: 500 },
      { level: 4, xpNeeded: 1000 },
      // Adicione mais níveis conforme necessário
    ];

    const levelData = levels.find((l) => l.level === level);
    return levelData ? levelData.xpNeeded : 1000; // Valor padrão
  };

  // Se os dados estão sendo carregados, mostrar indicador de carregamento
  if (fetchingData) {
    return (
      <SafeAreaView style={[styles.container, darkModeEnabled ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar
          barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
          backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
        />
        <Header title="Perfil" showBackButton={true} />
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={[styles.loadingText, darkModeEnabled ? styles.darkText : styles.lightText]}>
            Carregando informações do usuário...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Retorno principal do componente
  return (
    <SafeAreaView style={[styles.container, darkModeEnabled ? styles.darkContainer : styles.lightContainer]}>
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
      />
      <Header title="Perfil" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Nome */}
        <Text style={[styles.label, darkModeEnabled ? styles.darkText : styles.lightText]}>Nome:</Text>
        <TextInput
          style={[styles.input, darkModeEnabled ? styles.darkInput : styles.lightInput]}
          value={name}
          onChangeText={setName}
          accessibilityLabel="Nome"
          accessible={true}
          placeholder="Digite seu nome"
          placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
        />

        {/* Data de Cadastro */}
        <Text style={[styles.label, darkModeEnabled ? styles.darkText : styles.lightText]}>
          Data de Cadastro:
        </Text>
        <Text style={[styles.registrationDate, darkModeEnabled ? styles.darkText : styles.lightText]}>
          {registrationDate ? new Date(registrationDate).toLocaleDateString('pt-BR') : 'N/A'}
        </Text>

        {/* Se o usuário for Aluno, mostrar nível e XP */}
        {userType === 'Aluno' && (
          <>
            <Text style={[styles.label, darkModeEnabled ? styles.darkText : styles.lightText]}>
              Nível: {userData?.level || 1}
            </Text>
            <ProgressBar
              progress={getXpProgress()}
              color="#4caf50"
              style={styles.progressBar}
            />
            <Text style={[styles.xpText, darkModeEnabled ? styles.darkText : styles.lightText]}>
              XP: {userData?.xp || 0} / {getNextLevelXp(userData?.level || 1)}
            </Text>
          </>
        )}

        {/* Divisão entre as seções */}
        <View style={styles.divider} />

        {/* Email */}
        <Text style={[styles.label, darkModeEnabled ? styles.darkText : styles.lightText]}>Email:</Text>
        <TextInput
          style={[styles.input, darkModeEnabled ? styles.darkInput : styles.lightInput]}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email"
          accessible={true}
          placeholder="Digite seu email"
          placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
        />

        {/* Senha Atual */}
        <Text style={[styles.label, darkModeEnabled ? styles.darkText : styles.lightText]}>Senha Atual:</Text>
        <View style={[styles.passwordContainer, darkModeEnabled ? styles.darkInput : styles.lightInput]}>
          <TextInput
            style={[styles.passwordInput, darkModeEnabled ? styles.darkText : styles.lightText]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={secureTextEntryCurrent}
            placeholder="Digite sua senha atual"
            accessibilityLabel="Senha Atual"
            accessible={true}
            placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
          />
          <Pressable
            onPress={() => setSecureTextEntryCurrent(!secureTextEntryCurrent)}
            accessibilityLabel={secureTextEntryCurrent ? 'Mostrar senha' : 'Ocultar senha'}
            accessibilityRole="button"
          >
            <Ionicons
              name={secureTextEntryCurrent ? 'eye-off' : 'eye'}
              size={24}
              color={darkModeEnabled ? '#fff' : '#aaa'}
            />
          </Pressable>
        </View>

        {/* Nova Senha */}
        <Text style={[styles.label, darkModeEnabled ? styles.darkText : styles.lightText]}>Nova Senha:</Text>
        <View style={[styles.passwordContainer, darkModeEnabled ? styles.darkInput : styles.lightInput]}>
          <TextInput
            style={[styles.passwordInput, darkModeEnabled ? styles.darkText : styles.lightText]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={secureTextEntryNew}
            placeholder="Digite a nova senha"
            accessibilityLabel="Nova Senha"
            accessible={true}
            placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
          />
          <Pressable
            onPress={() => setSecureTextEntryNew(!secureTextEntryNew)}
            accessibilityLabel={secureTextEntryNew ? 'Mostrar senha' : 'Ocultar senha'}
            accessibilityRole="button"
          >
            <Ionicons
              name={secureTextEntryNew ? 'eye-off' : 'eye'}
              size={24}
              color={darkModeEnabled ? '#fff' : '#aaa'}
            />
          </Pressable>
        </View>

        {/* Confirmar Nova Senha */}
        <Text style={[styles.label, darkModeEnabled ? styles.darkText : styles.lightText]}>
          Confirmar Nova Senha:
        </Text>
        <View style={[styles.passwordContainer, darkModeEnabled ? styles.darkInput : styles.lightInput]}>
          <TextInput
            style={[styles.passwordInput, darkModeEnabled ? styles.darkText : styles.lightText]}
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry={secureTextEntryConfirm}
            placeholder="Confirme a nova senha"
            accessibilityLabel="Confirmar Nova Senha"
            accessible={true}
            placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
          />
          <Pressable
            onPress={() => setSecureTextEntryConfirm(!secureTextEntryConfirm)}
            accessibilityLabel={secureTextEntryConfirm ? 'Mostrar senha' : 'Ocultar senha'}
            accessibilityRole="button"
          >
            <Ionicons
              name={secureTextEntryConfirm ? 'eye-off' : 'eye'}
              size={24}
              color={darkModeEnabled ? '#fff' : '#aaa'}
            />
          </Pressable>
        </View>

        {/* Exibição de erros */}
        {error !== '' && (
          <Text style={[styles.errorText, darkModeEnabled ? styles.darkErrorText : styles.lightErrorText]}>
            {error}
          </Text>
        )}

        {/* Botão Salvar Alterações */}
        {loading ? (
          <ActivityIndicator size="large" color="#4caf50" style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity
            style={[styles.button, darkModeEnabled ? styles.darkButton : styles.lightButton]}
            onPress={handleSave}
            accessibilityLabel="Salvar Alterações"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Salvar Alterações</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

// Estilos do componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#333',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    height: 50,
  },
  lightInput: {
    backgroundColor: '#eee',
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#555',
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  xpText: {
    fontSize: 16,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  lightButton: {
    backgroundColor: '#4caf50',
  },
  darkButton: {
    backgroundColor: '#006400',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
  },
  lightErrorText: {
    color: 'red',
  },
  darkErrorText: {
    color: '#ff6666',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  registrationDate: {
    fontSize: 16,
    marginBottom: 10,
  },
});
