import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  Platform
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
  DocumentReference,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MixedText from '../components/MixedText';

// Define the route and navigation prop types
type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;
type ExerciseDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ExerciseDetail'>;

// Interface for user data, including XP and level
interface UserData {
  xp: number;
  level: number;
}

// Define the XP needed for each level
const levels = [
  { level: 1, xpNeeded: 0 },
  { level: 2, xpNeeded: 100 },
  { level: 3, xpNeeded: 250 },
  { level: 4, xpNeeded: 500 },
  { level: 5, xpNeeded: 1000 },
];

// Interface for the Exercise data
interface Exercise {
  question: string;
  options: string[];
  correctOptions: boolean[];
  hint?: string;
  xpValue: number;
}

export default function ExerciseDetailScreen() {
  // Extract route parameters and navigation hook
  const route = useRoute<ExerciseDetailRouteProp>();
  const { exerciseId } = route.params;
  const navigation = useNavigation<ExerciseDetailNavigationProp>();

  // Define state variables
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [alreadyAnsweredCorrectly, setAlreadyAnsweredCorrectly] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [incorrectModalVisible, setIncorrectModalVisible] = useState<boolean>(false);
  const [correctModalVisible, setCorrectModalVisible] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Memoize the exercise ID to prevent unnecessary re-renders
  const memoizedExerciseId = useMemo(() => exerciseId, [exerciseId]);
  const [cachedExerciseData, setCachedExerciseData] = useState<{ [key: string]: Exercise }>({});
  const [cachedAnsweredData, setCachedAnsweredData] = useState<{ [key: string]: boolean }>({});

  // Fetch exercise data when component mounts or exercise ID changes
  useEffect(() => {
    const fetchExercise = async () => {
      // Check if exercise data is already cached
      if (cachedExerciseData[memoizedExerciseId]) {
        setExercise(cachedExerciseData[memoizedExerciseId]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch exercise document from Firestore
        const docRef = doc(firestore, 'exercises', memoizedExerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const exerciseData = docSnap.data() as Exercise;
          if (exerciseData && exerciseData.options && exerciseData.correctOptions) {
            setExercise(exerciseData);
            setCachedExerciseData((prev) => ({ ...prev, [memoizedExerciseId]: exerciseData }));
          } else {
            console.error('Dados do exercício incompletos');
            setExercise(null);
          }
        } else {
          console.error('Exercício não encontrado');
          setExercise(null);
        }
      } catch (error) {
        console.error('Erro ao buscar exercício:', error);
        setExercise(null);
      } finally {
        setLoading(false);
      }
    };
    fetchExercise();
  }, [memoizedExerciseId, cachedExerciseData]);

  // Check if the user has already answered the exercise correctly
  useEffect(() => {
    const checkIfAnsweredCorrectly = async () => {
      if (cachedAnsweredData[memoizedExerciseId] !== undefined) {
        setAlreadyAnsweredCorrectly(cachedAnsweredData[memoizedExerciseId]);
        return;
      }
      try {
        const user = auth.currentUser;
        if (user) {
          // Query Firestore for correct answers by the user
          const q = query(
            collection(firestore, 'results'),
            where('exerciseId', '==', memoizedExerciseId),
            where('userId', '==', user.uid),
            where('isCorrect', '==', true)
          );
          const querySnapshot = await getDocs(q);
          const answeredCorrectly = !querySnapshot.empty;
          setAlreadyAnsweredCorrectly(answeredCorrectly);
          setCachedAnsweredData((prev) => ({ ...prev, [memoizedExerciseId]: answeredCorrectly }));
        }
      } catch (error) {
        console.error('Erro ao verificar se o exercício já foi respondido corretamente:', error);
      }
    };
    checkIfAnsweredCorrectly();
  }, [memoizedExerciseId, cachedAnsweredData]);

  // Toggle selection of an option
  const toggleOption = (index: number) => {
    setSelectedOptions((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      return newSelected;
    });
  };

  // Handle answer submission
  const submitAnswer = async () => {
    if (!exercise) return; // Ensure exercise is loaded

    if (selectedOptions.size === 0) {
      Alert.alert('Selecione uma opção', 'Por favor, selecione pelo menos uma opção antes de enviar.');
      return;
    }

    // Determine the correct options based on the exercise data
    const correctOptionIndices = exercise.correctOptions
      .map((isCorrect: boolean, index: number) => (isCorrect ? index : null))
      .filter((index): index is number => index !== null);

    // Check if the selected options match the correct ones
    const isCorrectAnswer =
      selectedOptions.size === correctOptionIndices.length &&
      Array.from(selectedOptions).every((value) => correctOptionIndices.includes(value));

    setIsCorrect(isCorrectAnswer);
    setSubmitted(true); // Mark as submitted

    // Save the result to Firestore
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        while (!success && retryCount < maxRetries) {
          try {
            // Add result to Firestore
            await addDoc(collection(firestore, 'results'), {
              exerciseId: memoizedExerciseId,
              isCorrect: isCorrectAnswer,
              answeredAt: serverTimestamp(),
              userId: user.uid,
            });
            success = true;
          } catch (error) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));
            if (retryCount >= maxRetries) {
              throw error;
            }
          }
        }

        // If correct answer and not previously answered correctly, add XP
        if (isCorrectAnswer && !alreadyAnsweredCorrectly) {
          const userRef = doc(firestore, 'users', user.uid);
          await updateXp(userRef, exercise.xpValue);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar resultado após múltiplas tentativas:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o resultado. Por favor, tente novamente mais tarde.');
    } finally {
      setSaving(false);
    }

    // Show the appropriate modal based on the answer correctness
    if (isCorrectAnswer) {
      setCorrectModalVisible(true);
    } else {
      setIncorrectModalVisible(true);
    }
  };

  // Update the user's XP and level
  const updateXp = async (userRef: DocumentReference<DocumentData>, xpToAdd: number) => {
    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('Usuário não existe!');
        }

        const userData = userDoc.data() as UserData;

        // Calculate new XP and level
        const currentXp = userData.xp || 0;
        const newXp = currentXp + xpToAdd;
        const newLevel = calculateLevel(newXp);

        // Update Firestore only if values have changed
        if (newXp !== currentXp || newLevel !== userData.level) {
          transaction.update(userRef, {
            xp: newXp,
            level: newLevel,
          });
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar XP:', error);
    }
  };

  // Calculate the user's level based on their XP
  const calculateLevel = (xp: number): number => {
    let currentLevel = levels[levels.length - 1].level;
    for (let i = 0; i < levels.length; i++) {
      if (xp < levels[i].xpNeeded) {
        currentLevel = levels[i - 1]?.level || 1;
        break;
      }
    }
    return currentLevel;
  };

  // Show the hint modal
  const showHint = () => {
    setIncorrectModalVisible(false);
    resetSelections(); // Clear selections when showing the hint
    navigation.navigate('Hint', { hint: exercise?.hint || 'Nenhuma dica disponível.' });
  };

  // Close the incorrect answer modal
  const closeModal = () => {
    setIncorrectModalVisible(false);
    resetSelections(); // Clear selections when closing the modal
  };

  // Close the correct answer modal
  const closeCorrectModal = () => {
    setCorrectModalVisible(false);
    resetSelections(); // Reset selections when closing the correct answer modal
    navigation.goBack(); // Go back to the previous screen
  };

  // Reset selections and states related to the answer
  const resetSelections = () => {
    setSelectedOptions(new Set());
    setSubmitted(false); // Allow the student to try again
    setIsCorrect(null); // Reset answer state
  };

  // Display loading indicator while fetching exercise data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <Header title="Carregando..." showBackButton />
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#4caf50" />
        </View>
      </SafeAreaView>
    );
  }

  // Display a message if the exercise is not found
  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <Header title="Exercício não encontrado" showBackButton />
        <View style={styles.content}>
          <Text>Exercício não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine the style for each option based on its state
  const optionStyle = (index: number) => {
    const isSelected = selectedOptions.has(index);

    // Highlight incorrect options in red if the answer was submitted and incorrect
    if (submitted && isCorrect === false && isSelected) {
      return [styles.optionButton, styles.incorrectOption];
    }

    // Highlight correct options in green if the answer was submitted and correct
    if (submitted && isCorrect === true && isSelected) {
      return [styles.optionButton, styles.correctOption];
    }

    // Default style for options
    return [styles.optionButton, isSelected && styles.selectedOption];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header
        title="Detalhes do Exercício"
        showBackButton
        rightButton={
          <TouchableOpacity onPress={showHint}>
            <Ionicons name="help-circle" size={28} color="#fff" />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Utilizando o MixedText para renderizar a pergunta com texto e LaTeX */}
        <MixedText content={exercise.question} style={styles.question} />

        {exercise.options.map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={optionStyle(index)}
            onPress={() => toggleOption(index)}
          >
            <MixedText content={option} style={styles.optionText} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.button} onPress={submitAnswer} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar Resposta</Text>
          )}
        </TouchableOpacity>

        {alreadyAnsweredCorrectly && (
          <Text style={styles.infoText}>
            Você já acertou este exercício.
            {'\n'}
            Não será ganho XP adicional.
          </Text>
        )}

        {/* Modal para Resposta Correta */}
        <Modal
          visible={correctModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeCorrectModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Resposta Correta!</Text>
              <Text style={styles.modalMessage}>Parabéns, você acertou!</Text>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity style={styles.modalButton} onPress={closeCorrectModal}>
                  <Text style={styles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para Resposta Incorreta */}
        <Modal
          visible={incorrectModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Resposta Incorreta</Text>
              <Text style={styles.modalMessage}>Não foi dessa vez. Gostaria de ver a dica?</Text>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                  <Text style={styles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={showHint}>
                  <Text style={styles.modalButtonText}>Ver Dica</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  question: {
    marginBottom: 20,
    fontSize: 18,
    color: '#333',
  },
  optionButton: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#4caf50', // Verde
  },
  correctOption: {
    backgroundColor: '#c8e6c9',
  },
  incorrectOption: {
    backgroundColor: '#f8d7da', // Vermelho mais suave
    borderColor: '#f5c6cb', // Vermelho mais suave
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
