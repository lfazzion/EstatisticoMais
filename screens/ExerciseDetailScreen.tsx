import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
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
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MixedText from '../components/MixedText';

type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;
type ExerciseDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ExerciseDetail'>;

interface UserData {
  xp: number;
  level: number;
}

const levels = [
  { level: 1, xpNeeded: 0 },
  { level: 2, xpNeeded: 100 },
  { level: 3, xpNeeded: 250 },
  { level: 4, xpNeeded: 500 },
  { level: 5, xpNeeded: 1000 },
];

export default function ExerciseDetailScreen() {
  const route = useRoute<ExerciseDetailRouteProp>();
  const { exerciseId } = route.params;
  const navigation = useNavigation<ExerciseDetailNavigationProp>();

  const [exercise, setExercise] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [alreadyAnsweredCorrectly, setAlreadyAnsweredCorrectly] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [incorrectModalVisible, setIncorrectModalVisible] = useState(false);
  const [correctModalVisible, setCorrectModalVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercise = async () => {
      setLoading(true);
      try {
        const docRef = doc(firestore, 'exercises', exerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const exerciseData = docSnap.data();
          setExercise(exerciseData);
        } else {
          console.error('Exercício não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar exercício:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercise();
  }, [exerciseId]);

  useEffect(() => {
    const checkIfAnsweredCorrectly = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const q = query(
            collection(firestore, 'results'),
            where('exerciseId', '==', exerciseId),
            where('userId', '==', user.uid),
            where('isCorrect', '==', true)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setAlreadyAnsweredCorrectly(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar se o exercício já foi respondido corretamente:', error);
      }
    };
    checkIfAnsweredCorrectly();
  }, [exerciseId]);

  const toggleOption = (index: number) => {
    setSelectedOptions((prevSelected) => {
      if (prevSelected.includes(index)) {
        return prevSelected.filter((i) => i !== index);
      } else {
        return [...prevSelected, index];
      }
    });
  };

  const submitAnswer = async () => {
    if (selectedOptions.length === 0) {
      Alert.alert('Selecione uma opção', 'Por favor, selecione pelo menos uma opção antes de enviar.');
      return;
    }

    const correctOptionIndices = exercise.correctOptions
      .map((isCorrect: boolean, index: number) => (isCorrect ? index : null))
      .filter((index: number | null) => index !== null);

    const isCorrectAnswer =
      selectedOptions.length === correctOptionIndices.length &&
      selectedOptions.every((value) => correctOptionIndices.includes(value));

    setIsCorrect(isCorrectAnswer);
    setSubmitted(true); // Marcar como enviado

    // Salvar resultado
    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(firestore, 'results'), {
          exerciseId: exerciseId,
          isCorrect: isCorrectAnswer,
          answeredAt: serverTimestamp(),
          userId: user.uid,
        });

        // Se for a primeira vez que o aluno responde corretamente este exercício, adicionar XP
        if (isCorrectAnswer && !alreadyAnsweredCorrectly) {
          const userRef = doc(firestore, 'users', user.uid);
          await updateXp(userRef, exercise.xpValue);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }

    if (isCorrectAnswer) {
      setCorrectModalVisible(true);
    } else {
      setIncorrectModalVisible(true);
    }
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
    let currentLevel = levels[levels.length - 1].level;
    for (let i = 0; i < levels.length; i++) {
      if (xp < levels[i].xpNeeded) {
        currentLevel = levels[i - 1].level;
        break;
      }
    }
    return currentLevel;
  };

  const showHint = () => {
    setIncorrectModalVisible(false);
    resetSelections(); // Limpar as seleções ao mostrar a dica
    navigation.navigate('Hint', { hint: exercise.hint || 'Nenhuma dica disponível.' });
  };

  const closeModal = () => {
    setIncorrectModalVisible(false);
    resetSelections(); // Limpar as seleções ao fechar o modal
  };

  const closeCorrectModal = () => {
    setCorrectModalVisible(false);
    resetSelections(); // Redefinir as seleções ao fechar o modal de resposta correta
    navigation.goBack(); // Retornar para a tela anterior
  };

  const resetSelections = () => {
    setSelectedOptions([]);
    setSubmitted(false); // Permitir que o aluno tente novamente
    setIsCorrect(null); // Redefinir estado da resposta
  };

  if (loading) {
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

  const optionStyle = (index: number) => {
    const isSelected = selectedOptions.includes(index);

    // Se o exercício foi submetido e a resposta está incorreta, todas as opções selecionadas devem ser destacadas em vermelho
    if (submitted && isCorrect === false && isSelected) {
      return [
        styles.optionButton,
        styles.incorrectOption,
      ];
    }

    // Se o exercício foi submetido e a resposta está correta, apenas as opções corretas devem ser destacadas
    if (submitted && isCorrect === true && isSelected) {
      return [
        styles.optionButton,
        styles.correctOption,
      ];
    }

    // Estilo padrão para opções selecionadas e não selecionadas
    return [
      styles.optionButton,
      isSelected && styles.selectedOption,
    ];
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

        <TouchableOpacity style={styles.button} onPress={submitAnswer}>
          <Text style={styles.buttonText}>Enviar Resposta</Text>
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
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={closeCorrectModal}
                >
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
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={closeModal}
                >
                  <Text style={styles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={showHint}
                >
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
  selectedIncorrectOptionBorder: {
    borderColor: '#f5c6cb', // Vermelho mais suave
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
