import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Header from '../components/Header';
import { ThemeContext } from '../contexts/ThemeContext';
import { firestore, auth } from '../firebaseConfig';
import { doc, runTransaction } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { useNavigation } from '@react-navigation/native';

type QuizGameNavigationProp = StackNavigationProp<RootStackParamList, 'QuizGame'>;

interface Question {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  xp: number;
}

// Perguntas atualizadas com foco em teoria e opções misturadas
const questions: Question[] = [
  {
    id: 1,
    question: 'Qual é a maneira correta de calcular a média aritmética?',
    options: [
      'Somar todos os valores e dividir pelo número de valores',
      'Multiplicar todos os valores',
      'Encontrar o valor central após ordenar os dados',
      'Escolher o valor que mais se repete',
    ],
    correctOptionIndex: 0,
    xp: 10,
  },
  {
    id: 2,
    question: 'O que é a mediana em um conjunto de dados?',
    options: [
      'A diferença entre o maior e o menor valor',
      'O valor que aparece com mais frequência',
      'O valor central quando os dados estão ordenados',
      'A média dos valores extremos',
    ],
    correctOptionIndex: 2,
    xp: 10,
  },
  {
    id: 3,
    question: 'A moda de um conjunto de dados é:',
    options: [
      'O valor mais frequente no conjunto',
      'A média dos valores',
      'O valor central do conjunto',
      'A soma de todos os valores',
    ],
    correctOptionIndex: 0,
    xp: 10,
  },
  {
    id: 4,
    question: 'O que representa a variância em estatística?',
    options: [
      'A medida da dispersão dos dados em relação à média',
      'A raiz quadrada da média',
      'O valor central de um conjunto',
      'O número mais frequente',
    ],
    correctOptionIndex: 0,
    xp: 20,
  },
  {
    id: 5,
    question: 'O desvio padrão é:',
    options: [
      'A raiz quadrada da variância',
      'O quadrado da média',
      'A soma dos valores',
      'A diferença entre o máximo e o mínimo',
    ],
    correctOptionIndex: 0,
    xp: 20,
  },
];

export default function QuizGameScreen() {
  const { darkModeEnabled } = useContext(ThemeContext);
  const navigation = useNavigation<QuizGameNavigationProp>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);
  const [totalXp, setTotalXp] = useState<number>(0); // Contador de XP total
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showFinalModal, setShowFinalModal] = useState<boolean>(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Embaralhar as opções uma vez por pergunta
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [correctOptionIndexShuffled, setCorrectOptionIndexShuffled] = useState<number>(0);

  React.useEffect(() => {
    // Embaralhar as opções e atualizar o índice da opção correta
    const options = [...currentQuestion.options];
    const originalCorrectIndex = currentQuestion.correctOptionIndex;
    const correctOption = options[originalCorrectIndex];

    // Embaralhar as opções
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Encontrar o novo índice da opção correta
    const newCorrectIndex = options.indexOf(correctOption);

    // Atualizar o estado
    setShuffledOptions(options);
    setCorrectOptionIndexShuffled(newCorrectIndex);
  }, [currentQuestion]);

  const handleSubmit = () => {
    if (selectedOptionIndex === null) {
      Alert.alert('Selecione uma opção', 'Por favor, selecione uma opção.');
      return;
    }

    const isCorrect = selectedOptionIndex === correctOptionIndexShuffled;

    setIsAnswerCorrect(isCorrect);
    setShowFeedbackModal(true);

    if (isCorrect) {
      updateXP(currentQuestion.xp);
      setTotalXp((prevXp) => prevXp + currentQuestion.xp);
    }
  };

  const handleNextQuestion = () => {
    setShowFeedbackModal(false);
    setSelectedOptionIndex(null);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Exibir o modal final
      setShowFinalModal(true);
    }
  };

  const updateXP = async (xpToAdd: number) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        await runTransaction(firestore, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw 'Usuário não existe!';
          }
          const newXP = (userDoc.data().xp || 0) + xpToAdd;
          transaction.update(userRef, { xp: newXP });
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar XP:', error);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        darkModeEnabled ? styles.darkContainer : styles.lightContainer,
      ]}
    >
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
      />
      <Header title="Jogo de Quiz" showBackButton />
      <View style={styles.content}>
        <Text
          style={[
            styles.totalXpText,
            darkModeEnabled ? styles.darkText : styles.lightText,
          ]}
        >
          XP Total: {totalXp}
        </Text>
        <Text
          style={[
            styles.questionText,
            darkModeEnabled ? styles.darkText : styles.lightText,
          ]}
        >
          {currentQuestion.question}
        </Text>
        {shuffledOptions.map((option, index) => {
          // Determinar o estilo da opção com base no feedback
          let optionStyle: StyleProp<ViewStyle> = [styles.optionButton];
          let optionTextStyle: StyleProp<TextStyle> = [styles.optionText];

          if (showFeedbackModal) {
            if (index === correctOptionIndexShuffled) {
              optionStyle = [...optionStyle, styles.correctOption];
            } else if (selectedOptionIndex === index) {
              if (index === correctOptionIndexShuffled) {
                optionStyle = [...optionStyle, styles.correctOption];
              } else {
                optionStyle = [...optionStyle, styles.incorrectOption];
              }
            } else {
              // Aplicar estilos padrão para as demais opções
              optionStyle = [
                ...optionStyle,
                darkModeEnabled ? styles.darkOption : styles.lightOption,
              ];
            }
          } else {
            // Estilos normais e seleção
            optionStyle = [
              ...optionStyle,
              darkModeEnabled ? styles.darkOption : styles.lightOption,
              selectedOptionIndex === index && styles.selectedOption,
            ];
          }

          // Determinar a cor do texto
          if (darkModeEnabled) {
            if (showFeedbackModal) {
              if (index === correctOptionIndexShuffled) {
                // Opção correta: texto preto
                optionTextStyle = [...optionTextStyle, styles.blackText];
              } else if (selectedOptionIndex === index) {
                if (index === correctOptionIndexShuffled) {
                  // Opção correta selecionada: texto preto
                  optionTextStyle = [...optionTextStyle, styles.blackText];
                } else {
                  // Opção incorreta selecionada: texto vermelho
                  optionTextStyle = [...optionTextStyle, styles.redText];
                }
              } else {
                // Texto padrão para as demais opções no modo escuro
                optionTextStyle = [...optionTextStyle, styles.darkText];
              }
            } else {
              if (selectedOptionIndex === index) {
                // Opção selecionada no modo escuro: texto preto
                optionTextStyle = [...optionTextStyle, styles.blackText];
              } else {
                // Texto padrão no modo escuro
                optionTextStyle = [...optionTextStyle, styles.darkText];
              }
            }
          } else {
            // Modo claro: manter estilos existentes
            optionTextStyle = [...optionTextStyle, styles.lightText];
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => {
                if (!showFeedbackModal) {
                  setSelectedOptionIndex(index);
                }
              }}
              disabled={showFeedbackModal}
            >
              <Text style={optionTextStyle}>{option}</Text>
            </TouchableOpacity>
          );
        })}
        {/* Botão Enviar apenas quando o feedback não está sendo mostrado */}
        {!showFeedbackModal && (
          <TouchableOpacity
            style={[
              styles.button,
              darkModeEnabled ? styles.darkButton : styles.lightButton,
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Enviar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de Feedback */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.feedbackModalContainer,
              darkModeEnabled ? styles.darkModal : styles.lightModal,
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                darkModeEnabled ? styles.darkText : styles.lightText,
              ]}
            >
              {isAnswerCorrect ? 'Correto!' : 'Incorreto'}
            </Text>
            <Text
              style={[
                styles.modalMessage,
                darkModeEnabled ? styles.darkText : styles.lightText,
              ]}
            >
              {isAnswerCorrect
                ? `Você ganhou ${currentQuestion.xp} XP!`
                : `A resposta correta era: ${
                    shuffledOptions[correctOptionIndexShuffled]
                  }`}
            </Text>
            <TouchableOpacity
              style={[
                styles.modalButton,
                darkModeEnabled ? styles.darkButton : styles.lightButton,
              ]}
              onPress={handleNextQuestion}
            >
              <Text style={styles.modalButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Final */}
      <Modal
        visible={showFinalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFinalModal(false)}
      >
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContainer,
              darkModeEnabled ? styles.darkModal : styles.lightModal,
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                darkModeEnabled ? styles.darkText : styles.lightText,
              ]}
            >
              Parabéns!
            </Text>
            <Text
              style={[
                styles.modalMessage,
                darkModeEnabled ? styles.darkText : styles.lightText,
              ]}
            >
              Você completou o quiz e ganhou um total de {totalXp} XP!
            </Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  darkModeEnabled ? styles.darkButton : styles.lightButton,
                ]}
                onPress={() => {
                  setShowFinalModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  totalXpText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-end',
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
  },
  optionButton: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
  },
  lightOption: {
    backgroundColor: '#eee',
    borderColor: 'transparent',
  },
  darkOption: {
    backgroundColor: '#1e1e1e',
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#4caf50',
    backgroundColor: '#dcedc8',
  },
  correctOption: {
    backgroundColor: '#c8e6c9', // Verde claro
    borderColor: '#388e3c', // Verde escuro
  },
  incorrectOption: {
    backgroundColor: '#f8d7da', // Vermelho claro
    borderColor: '#f5c6cb', // Vermelho escuro
  },
  optionText: {
    fontSize: 16,
  },
  darkText: {
    color: '#fff',
  },
  lightText: {
    color: '#333',
  },
  blackText: {
    color: '#000', // Preto
  },
  redText: {
    color: '#ff0000', // Vermelho
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
  // Estilos do Modal de Feedback
  feedbackModalContainer: {
    width: '80%',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  // Estilos do Modal Final
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
    backgroundColor: '#1e1e1e',
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
    justifyContent: 'center',
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