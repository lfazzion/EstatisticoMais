// screens/ExerciseDetailScreen.tsx

// Importação dos módulos e componentes necessários
import React, { useEffect, useState, useMemo, useContext } from 'react';
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
  ActivityIndicator,
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
  DocumentData,
} from 'firebase/firestore';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MixedText from '../components/MixedText'; // Componente para exibir texto misturado com LaTeX
import { ThemeContext } from '../contexts/ThemeContext'; // Importa o contexto do tema

// Definição dos tipos de rota e navegação específicos da tela de detalhes do exercício
type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;
type ExerciseDetailNavigationProp = StackNavigationProp<RootStackParamList, 'ExerciseDetail'>;

// Interface para dados de um usuário, incluindo XP e nível
interface UserData {
  xp: number;
  level: number;
}

// Definição dos níveis e da quantidade de XP necessária para cada um
const levels = [
  { level: 1, xpNeeded: 0 },
  { level: 2, xpNeeded: 100 },
  { level: 3, xpNeeded: 250 },
  { level: 4, xpNeeded: 500 },
  { level: 5, xpNeeded: 1000 },
];

// Interface para representar os dados de um exercício
interface Exercise {
  question: string;
  options: string[];
  correctOptions: boolean[];
  hint?: string;
  xpValue: number;
}

// Componente principal da tela de detalhes do exercício
export default function ExerciseDetailScreen() {
  // Obtenção dos parâmetros da rota e inicialização do hook de navegação
  const route = useRoute<ExerciseDetailRouteProp>();
  const { exerciseId } = route.params; // ID do exercício
  const navigation = useNavigation<ExerciseDetailNavigationProp>();

  // Obter o estado do modo escuro do contexto
  const { darkModeEnabled } = useContext(ThemeContext);

  // Definição dos estados da tela
  const [exercise, setExercise] = useState<Exercise | null>(null); // Dados do exercício
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set()); // Opções selecionadas pelo usuário
  const [alreadyAnsweredCorrectly, setAlreadyAnsweredCorrectly] = useState<boolean>(false); // Flag de resposta correta anterior
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // Estado de correção da resposta
  const [incorrectModalVisible, setIncorrectModalVisible] = useState<boolean>(false); // Controle de visibilidade do modal de resposta incorreta
  const [correctModalVisible, setCorrectModalVisible] = useState<boolean>(false); // Controle de visibilidade do modal de resposta correta
  const [submitted, setSubmitted] = useState<boolean>(false); // Indica se o exercício já foi submetido
  const [loading, setLoading] = useState<boolean>(true); // Indicador de carregamento
  const [saving, setSaving] = useState<boolean>(false); // Indicador de salvamento

  // Memoriza o ID do exercício para evitar re-renderizações desnecessárias
  const memoizedExerciseId = useMemo(() => exerciseId, [exerciseId]);
  const [cachedExerciseData, setCachedExerciseData] = useState<{ [key: string]: Exercise }>({}); // Cache de dados do exercício
  const [cachedAnsweredData, setCachedAnsweredData] = useState<{ [key: string]: boolean }>({}); // Cache de resposta correta do exercício

  // Busca os dados do exercício quando o componente é montado ou o ID do exercício muda
  useEffect(() => {
    const fetchExercise = async () => {
      // Verifica se os dados do exercício já estão no cache
      if (cachedExerciseData[memoizedExerciseId]) {
        setExercise(cachedExerciseData[memoizedExerciseId]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Busca o documento do exercício no Firestore
        const docRef = doc(firestore, 'exercises', memoizedExerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const exerciseData = docSnap.data();
          if (exerciseData && exerciseData.options && exerciseData.correctOptions) {
            const formattedExercise: Exercise = {
              question: exerciseData.question || '',
              options: exerciseData.options,
              correctOptions: exerciseData.correctOptions,
              hint: exerciseData.hint,
              xpValue: exerciseData.xpValue || 0,
            };
            setExercise(formattedExercise);
            setCachedExerciseData((prev) => ({ ...prev, [memoizedExerciseId]: formattedExercise }));
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
  }, [memoizedExerciseId]);

  // Verifica se o usuário já respondeu corretamente ao exercício
  useEffect(() => {
    const checkIfAnsweredCorrectly = async () => {
      if (cachedAnsweredData[memoizedExerciseId] !== undefined) {
        setAlreadyAnsweredCorrectly(cachedAnsweredData[memoizedExerciseId]);
        return;
      }
      try {
        const user = auth.currentUser;
        if (user) {
          // Consulta no Firestore se o usuário já respondeu corretamente
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
  }, [memoizedExerciseId]);

  // Alterna a seleção de uma opção
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

  // Função para submeter a resposta do usuário
  const submitAnswer = async () => {
    if (!exercise) return; // Verifica se o exercício foi carregado

    if (selectedOptions.size === 0) {
      Alert.alert('Selecione uma opção', 'Por favor, selecione pelo menos uma opção antes de enviar.');
      return;
    }

    // Determina as opções corretas com base nos dados do exercício
    const correctOptionIndices = exercise.correctOptions
      .map((isCorrect: boolean, index: number) => (isCorrect ? index : null))
      .filter((index): index is number => index !== null);

    // Verifica se as opções selecionadas correspondem às corretas
    const isCorrectAnswer =
      selectedOptions.size === correctOptionIndices.length &&
      Array.from(selectedOptions).every((value) => correctOptionIndices.includes(value));

    setIsCorrect(isCorrectAnswer);
    setSubmitted(true); // Marca como enviado

    // Salva o resultado no Firestore
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;

        while (!success && retryCount < maxRetries) {
          try {
            // Adiciona o resultado no Firestore
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

        // Se a resposta for correta e não houver resposta correta anterior, adiciona XP
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

    // Exibe o modal apropriado com base na correção da resposta
    if (isCorrectAnswer) {
      setCorrectModalVisible(true);
    } else {
      setIncorrectModalVisible(true);
    }
  };

  // Atualiza o XP e o nível do usuário no Firestore
  const updateXp = async (userRef: DocumentReference<DocumentData>, xpToAdd: number) => {
    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('Usuário não existe!');
        }

        const userData = userDoc.data() as Partial<UserData>;

        // Obtém o XP e nível atuais, com valores padrão se não existirem
        const currentXp = userData.xp || 0;
        const currentLevel = userData.level || 1;

        // Calcula o novo XP e nível
        const newXp = currentXp + xpToAdd;
        const newLevel = calculateLevel(newXp);

        // Atualiza o Firestore apenas se houver mudança
        if (newXp !== currentXp || newLevel !== currentLevel) {
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

  // Calcula o nível do usuário com base no XP
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

  // Exibe o modal de dica
  const showHint = () => {
    setIncorrectModalVisible(false);
    resetSelections(); // Limpa as seleções ao exibir a dica
    navigation.navigate('Hint', { hint: exercise?.hint || 'Nenhuma dica disponível.' });
  };

  // Fecha o modal de resposta incorreta
  const closeModal = () => {
    setIncorrectModalVisible(false);
    resetSelections(); // Limpa as seleções ao fechar o modal
  };

  // Fecha o modal de resposta correta
  const closeCorrectModal = () => {
    setCorrectModalVisible(false);
    resetSelections(); // Limpa as seleções ao fechar o modal de resposta correta
    navigation.goBack(); // Volta para a tela anterior
  };

  // Limpa as seleções e os estados relacionados à resposta
  const resetSelections = () => {
    setSelectedOptions(new Set());
    setSubmitted(false); // Permite que o usuário tente novamente
    setIsCorrect(null); // Reseta o estado de resposta
  };

  // Exibe um indicador de carregamento enquanto busca os dados do exercício
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, darkModeEnabled ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar
          barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
          backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
        />
        <Header title="Carregando..." showBackButton />
        <View style={styles.content}>
          <ActivityIndicator size="large" color={darkModeEnabled ? '#fff' : '#4caf50'} />
        </View>
      </SafeAreaView>
    );
  }

  // Exibe uma mensagem caso o exercício não seja encontrado
  if (!exercise) {
    return (
      <SafeAreaView style={[styles.container, darkModeEnabled ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar
          barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
          backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
        />
        <Header title="Exercício não encontrado" showBackButton />
        <View style={styles.content}>
          <Text style={darkModeEnabled ? styles.darkText : styles.lightText}>Exercício não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determina o estilo de cada opção com base no seu estado
  const optionStyle = (index: number) => {
    const isSelected = selectedOptions.has(index);

    // Destaca opções incorretas em vermelho se a resposta estiver incorreta
    if (submitted && isCorrect === false && isSelected) {
      return [styles.optionButton, styles.incorrectOption];
    }

    // Destaca opções corretas em verde se a resposta estiver correta
    if (submitted && isCorrect === true && isSelected) {
      return [styles.optionButton, styles.correctOption];
    }

    // Estilo padrão para opções
    return [styles.optionButton, isSelected && styles.selectedOption];
  };

  // Interface da tela principal do exercício
  return (
    <SafeAreaView style={[styles.container, darkModeEnabled ? styles.darkContainer : styles.lightContainer]}>
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
      />
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
        {/* Utilização do MixedText para renderizar a pergunta com texto e LaTeX */}
        <MixedText
          content={exercise.question}
          style={[styles.question, darkModeEnabled ? styles.darkText : styles.lightText]}
        />

        {exercise.options.map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={optionStyle(index)}
            onPress={() => toggleOption(index)}
          >
            <MixedText
              content={option}
              style={[styles.optionText, darkModeEnabled ? styles.darkText : styles.lightText]}
            />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.button, darkModeEnabled ? styles.darkButton : styles.lightButton]}
          onPress={submitAnswer}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar Resposta</Text>
          )}
        </TouchableOpacity>

        {alreadyAnsweredCorrectly && (
          <Text style={[styles.infoText, darkModeEnabled ? styles.darkText : styles.lightText]}>
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
            <View style={[styles.modalContainer, darkModeEnabled ? styles.darkModal : styles.lightModal]}>
              <Text style={[styles.modalTitle, darkModeEnabled ? styles.darkText : styles.lightText]}>
                Resposta Correta!
              </Text>
              <Text style={[styles.modalMessage, darkModeEnabled ? styles.darkText : styles.lightText]}>
                Parabéns, você acertou!
              </Text>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, darkModeEnabled ? styles.darkButton : styles.lightButton]}
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
            <View style={[styles.modalContainer, darkModeEnabled ? styles.darkModal : styles.lightModal]}>
              <Text style={[styles.modalTitle, darkModeEnabled ? styles.darkText : styles.lightText]}>
                Resposta Incorreta
              </Text>
              <Text style={[styles.modalMessage, darkModeEnabled ? styles.darkText : styles.lightText]}>
                Não foi dessa vez. Gostaria de ver a dica?
              </Text>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, darkModeEnabled ? styles.darkButton : styles.lightButton]}
                  onPress={closeModal}
                >
                  <Text style={styles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, darkModeEnabled ? styles.darkButton : styles.lightButton]}
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

// Estilos da tela
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
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
  },
  question: {
    marginBottom: 20,
    fontSize: 18,
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  optionButton: {
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
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  lightModal: {
    backgroundColor: '#fff',
  },
  darkModal: {
    backgroundColor: '#555',
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