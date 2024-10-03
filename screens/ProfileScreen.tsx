// screens/ProfileScreen.tsx

import React, { useEffect, useState } from 'react';
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
  Platform,
  ActivityIndicator,
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

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);

  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');

  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [userType, setUserType] = useState(''); // Armazena o tipo de usuário

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            const docRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserData(data);
              setName(data.name || '');
              setOriginalName(data.name || '');
              setEmail(user.email || '');
              setOriginalEmail(user.email || '');
              setUserType(data.userType || '');
            } else {
              console.error('Dados do usuário não encontrados');
            }
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      };
      fetchUserData();
    }, [])
  );

  const handleSave = async () => {
    setError('');
    setLoading(true);

    const user = auth.currentUser;

    if (!user) {
      setError('Usuário não está autenticado. Faça login novamente.');
      setLoading(false);
      return;
    }

    const promises = [];

    try {
      // Atualizar nome se mudou
      if (name !== originalName) {
        const userRef = doc(firestore, 'users', user.uid);
        promises.push(
          updateDoc(userRef, {
            name: name,
          })
        );
      }

      // Se email mudou ou se nova senha foi fornecida, precisamos reautenticar
      if ((email !== originalEmail || newPassword !== '') && currentPassword === '') {
        setError('Por favor, insira sua senha atual para alterar o email ou senha.');
        setLoading(false);
        return;
      }

      // Se nova senha foi fornecida, verificar se a confirmação corresponde
      if (newPassword !== '') {
        if (newPassword !== confirmNewPassword) {
          setError('A nova senha e a confirmação não correspondem.');
          setLoading(false);
          return;
        }
        // Podemos adicionar validações de senha aqui, por exemplo, comprimento mínimo
        if (newPassword.length < 6) {
          setError('A nova senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
      }

      if (email !== originalEmail || newPassword !== '') {
        // Reautenticar o usuário
        const credential = EmailAuthProvider.credential(originalEmail, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      // Atualizar email se mudou
      if (email !== originalEmail) {
        await verifyBeforeUpdateEmail(user, email);

        // Atualizar email no Firestore
        const userRef = doc(firestore, 'users', user.uid);
        promises.push(
          updateDoc(userRef, {
            email: email,
          })
        );

        Alert.alert(
          'Verifique seu email',
          'Um email de verificação foi enviado para o novo endereço. Por favor, verifique para confirmar a alteração.'
        );
      }

      // Atualizar senha se nova senha foi fornecida
      if (newPassword !== '') {
        await updatePassword(user, newPassword);
        Alert.alert('Sucesso', 'Senha atualizada com sucesso.');
      }

      // Aguardar todas as promessas (atualização de nome e email no Firestore)
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
    } finally {
      setLoading(false);
    }
  };

  const getXpProgress = () => {
    const xp = userData?.xp || 0;
    const level = userData?.level || 1;
    const nextLevelXp = getNextLevelXp(level);
    const progress = xp / nextLevelXp;
    return progress > 1 ? 1 : progress;
  };

  const getNextLevelXp = (level: number) => {
    // Defina os XP necessários para cada nível
    const levels = [
      { level: 1, xpNeeded: 100 },
      { level: 2, xpNeeded: 250 },
      { level: 3, xpNeeded: 500 },
      { level: 4, xpNeeded: 1000 },
      // Adicione mais níveis conforme necessário
    ];

    const levelData = levels.find((l) => l.level === level);
    return levelData ? levelData.xpNeeded : 1000; // Valor padrão
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <Header title="Perfil" showBackButton={true} />
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text>Carregando informações do usuário...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Perfil" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Parte Superior: Nome e XP */}
        <Text style={styles.label}>Nome:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(text) => setName(text)}
        />

        {userType === 'Aluno' && (
          <>
            <Text style={styles.label}>Nível: {userData.level || 1}</Text>
            <ProgressBar
              progress={getXpProgress()}
              color="#4caf50"
              style={styles.progressBar}
            />
            <Text style={styles.xpText}>
              XP: {userData.xp || 0} / {getNextLevelXp(userData.level || 1)}
            </Text>
          </>
        )}

        {/* Divisão entre as seções */}
        <View style={styles.divider} />

        {/* Parte Inferior: Email e Senhas */}
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(text) => setEmail(text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha Atual:</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={(text) => setCurrentPassword(text)}
          secureTextEntry
          placeholder="Digite sua senha atual"
        />

        <Text style={styles.label}>Nova Senha:</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={(text) => setNewPassword(text)}
          secureTextEntry
          placeholder="Digite a nova senha"
        />

        <Text style={styles.label}>Confirmar Nova Senha:</Text>
        <TextInput
          style={styles.input}
          value={confirmNewPassword}
          onChangeText={(text) => setConfirmNewPassword(text)}
          secureTextEntry
          placeholder="Confirme a nova senha"
        />

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}

        {loading ? (
          <ActivityIndicator size="large" color="#4caf50" style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Salvar Alterações</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Estilos existentes
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Remova qualquer padding ou margin top
  },
  content: {
    padding: 20,
    // Adicione um paddingTop para evitar sobreposição
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  label: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    height: 50,
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
  button: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 20,
  },
});
