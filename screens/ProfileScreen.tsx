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
} from 'react-native';
import Header from '../components/Header';
import { auth, firestore } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateEmail } from 'firebase/auth';
import { ProgressBar } from 'react-native-paper';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
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
            setEmail(user.email || '');
            setOriginalEmail(user.email || '');
          } else {
            console.error('Dados do usuário não encontrados');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (name === '' || email === '') {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        // Atualizar nome no Firestore
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          name: name,
        });

        // Atualizar email no Firebase Auth e Firestore se foi alterado
        if (email !== originalEmail) {
          await updateEmail(user, email);
          await updateDoc(userRef, {
            email: email,
          });
          setOriginalEmail(email);
        }

        Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      if (error.code === 'auth/requires-recent-login') {
        setError(
          'Por motivos de segurança, faça login novamente para atualizar seu email.'
        );
      } else {
        setError('Ocorreu um erro ao atualizar o perfil. Tente novamente.');
      }
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
        <Text style={styles.label}>Nome:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(text) => setName(text)}
        />

        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(text) => setEmail(text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Nível: {userData.level || 1}</Text>
        <ProgressBar
          progress={getXpProgress()}
          color="#4caf50"
          style={styles.progressBar}
        />
        <Text style={styles.xpText}>
          XP: {userData.xp || 0} / {getNextLevelXp(userData.level || 1)}
        </Text>

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... estilos existentes
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
});
