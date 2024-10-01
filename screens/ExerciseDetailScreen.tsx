// screens/ExerciseDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Header from '../components/Header';
import { firestore, auth } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  runTransaction,
} from 'firebase/firestore';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;

// Definir a interface para os dados do usuário
interface UserData {
  xp: number;
  level: number;
  // Outros campos, se houver
}

export default function ExerciseDetailScreen() {
  const route = useRoute<ExerciseDetailRouteProp>();
  const { exerciseId } = route.params;

  const [exercise, setExercise] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(firestore, 'exercises', exerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExercise(docSnap.data());
        } else {
          console.error('Exercício não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar exercício:', error);
      }
    };
    fetchExercise();
  }, [exerciseId]);

  useEffect(() => {
    const checkIfAnswered = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(
            collection(firestore, 'results'),
            where('exerciseId', '==', exerciseId),
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setAlreadyAnswered(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar se o exercício já foi respondido:', error);
      }
    };
    checkIfAnswered();
  }, [exerciseId]);

  const submitAnswer = async () => {
    if (selectedOption === null) {
      Alert.alert('Selecione uma opção', 'Por favor, selecione uma opção antes de enviar.');
      return;
    }

    const isCorrect = selectedOption === exercise.correctOption;

    // Salvar resultado
    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(firestore, 'results'), {
          exerciseId: exerciseId,
          isCorrect: isCorrect,
          answeredAt: serverTimestamp(),
          userId: user.uid,
        });

        // Se for a primeira vez que o aluno responde este exercício, adicionar XP
        if (!alreadyAnswered) {
          const userRef = doc(firestore, 'users', user.uid);
          await updateXp(userRef, exercise.xpValue);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }

    setSubmitted(true);
    setAlreadyAnswered(true);
    Alert.alert(
      isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta',
      isCorrect ? 'Parabéns, você acertou!' : 'A resposta selecionada está incorreta.',
      [{ text: 'OK' }],
      { cancelable: false }
    );
  };

  const updateXp = async (userRef: any, xpToAdd: number) => {
    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw 'Usuário não existe!';
        }

        const userData = userDoc.data() as UserData;

        const newXp = (userData.xp || 0) + xpToAdd;
        const newLevel = calculateLevel(newXp);

        transaction.update(userRef, {
          xp: newXp,
          level: newLevel,
        });
      });
    } catch (error) {
      console.error('Erro ao atualizar XP:', error);
    }
  };

  const calculateLevel = (xp: number) => {
    // Defina os níveis e os XP necessários
    const levels = [
      { level: 1, xpNeeded: 0 },
      { level: 2, xpNeeded: 100 },
      { level: 3, xpNeeded: 250 },
      { level: 4, xpNeeded: 500 },
      { level: 5, xpNeeded: 1000 },
      // Adicione mais níveis conforme necessário
    ];

    let currentLevel = levels[levels.length - 1].level;
    for (let i = 0; i < levels.length; i++) {
      if (xp < levels[i].xpNeeded) {
        currentLevel = levels[i - 1].level;
        break;
      }
    }
    return currentLevel;
  };

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <Header title="Carregando..." showBackButton />
        <View style={styles.content}>
          <Text>Carregando exercício...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Detalhes do Exercício" showBackButton />
      <View style={styles.content}>
        <Text style={styles.question}>{exercise.question}</Text>
        {exercise.options.map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedOption === index && styles.selectedOption,
              submitted && index === exercise.correctOption && styles.correctOption,
              submitted &&
                selectedOption === index &&
                selectedOption !== exercise.correctOption &&
                styles.incorrectOption,
            ]}
            onPress={() => !submitted && setSelectedOption(index)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
        {!submitted && (
          <TouchableOpacity style={styles.button} onPress={submitAnswer}>
            <Text style={styles.buttonText}>Enviar Resposta</Text>
          </TouchableOpacity>
        )}
        {submitted && (
          <Text style={styles.feedbackText}>
            {selectedOption === exercise.correctOption
              ? 'Você acertou!'
              : `Você errou. A resposta correta é: ${exercise.options[exercise.correctOption]}`}
          </Text>
        )}
        {alreadyAnswered && (
          <Text style={styles.infoText}>
            Você já respondeu este exercício. Não ganhará XP adicional.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Remova qualquer padding ou margin top
  },
  content: {
    flex: 1,
    padding: 20,
    // Adicione um paddingTop para evitar sobreposição
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  question: {
    fontSize: 20,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  selectedOption: {
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  correctOption: {
    backgroundColor: '#c8e6c9',
  },
  incorrectOption: {
    backgroundColor: '#ffcdd2',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
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
  feedbackText: {
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    color: '#777',
  },
});
