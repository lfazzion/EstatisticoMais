// screens/FormulaGameScreen.tsx

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Header from '../components/Header';
import { ThemeContext } from '../contexts/ThemeContext';
import { firestore, auth } from '../firebaseConfig';
import { doc, runTransaction } from 'firebase/firestore';
import { DraxProvider, DraxView } from 'react-native-drax';

interface Level {
  id: number;
  formula: string;
  formulaDisplay: string;
  numbers: number[]; // Números disponíveis
  numeratorSlots: number;
  denominatorSlots: number;
  result: number;
  xp: number;
}

interface AvailableNumber {
  id: number;
  value: number;
  isAvailable: boolean;
}

const levels: Level[] = [
  {
    id: 1,
    formula: 'Média',
    formulaDisplay: 'Média = (a + b + c + d) / n = 5',
    numbers: [2, 3, 4, 5, 7, 8, 6],
    numeratorSlots: 4,
    denominatorSlots: 1,
    result: 5,
    xp: 10,
  },
  // Outros níveis podem ser adicionados aqui seguindo o mesmo formato
];

export default function FormulaGameScreen() {
  const { darkModeEnabled } = useContext(ThemeContext);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedNumerators, setSelectedNumerators] = useState<(number | null)[]>([]);
  const [selectedDenominators, setSelectedDenominators] = useState<(number | null)[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);

  useEffect(() => {
    setupLevel();
  }, [currentLevel]);

  const setupLevel = () => {
    const level = levels[currentLevel];
    if (!level) {
      Alert.alert('Parabéns!', 'Você completou todos os níveis!');
      return;
    }
    const numbers = level.numbers.map((value, index) => ({
      id: index,
      value,
      isAvailable: true,
    }));
    setAvailableNumbers(numbers);
    setSelectedNumerators(Array(level.numeratorSlots).fill(null));
    setSelectedDenominators(Array(level.denominatorSlots).fill(null));
  };

  const onReceiveDragDrop = (
    event: any,
    index: number,
    type: 'numerator' | 'denominator'
  ) => {
    const { numberId, from, fromIndex } = event.dragged.payload;

    const updatedSelectedNumerators = [...selectedNumerators];
    const updatedSelectedDenominators = [...selectedDenominators];
    const updatedAvailableNumbers = [...availableNumbers];

    const draggedNumber = availableNumbers.find((num) => num.id === numberId);
    if (!draggedNumber) return;

    if (from === 'available') {
      // Marcar o número como indisponível
      draggedNumber.isAvailable = false;
    } else if (from === 'numerator') {
      // Remover número do numerador de origem
      updatedSelectedNumerators[fromIndex] = null;
    } else if (from === 'denominator') {
      // Remover número do denominador de origem
      updatedSelectedDenominators[fromIndex] = null;
    }

    if (type === 'numerator') {
      if (updatedSelectedNumerators[index] !== null) {
        // Retornar o número atual do slot para disponível
        const num = availableNumbers.find((n) => n.value === updatedSelectedNumerators[index]);
        if (num) num.isAvailable = true;
      }
      // Colocar o número arrastado no slot do numerador
      updatedSelectedNumerators[index] = draggedNumber.value;
    } else {
      if (updatedSelectedDenominators[index] !== null) {
        // Retornar o número atual do slot para disponível
        const num = availableNumbers.find((n) => n.value === updatedSelectedDenominators[index]);
        if (num) num.isAvailable = true;
      }
      // Colocar o número arrastado no slot do denominador
      updatedSelectedDenominators[index] = draggedNumber.value;
    }

    setSelectedNumerators(updatedSelectedNumerators);
    setSelectedDenominators(updatedSelectedDenominators);
    setAvailableNumbers(updatedAvailableNumbers);
  };

  const onReceiveDragDropAvailable = (event: any) => {
    const { numberId, from, fromIndex } = event.dragged.payload;

    const updatedSelectedNumerators = [...selectedNumerators];
    const updatedSelectedDenominators = [...selectedDenominators];
    const updatedAvailableNumbers = [...availableNumbers];

    const draggedNumber = availableNumbers.find((num) => num.id === numberId);
    if (!draggedNumber) return;

    if (from === 'numerator') {
      // Remover número do numerador de origem
      updatedSelectedNumerators[fromIndex] = null;
    } else if (from === 'denominator') {
      // Remover número do denominador de origem
      updatedSelectedDenominators[fromIndex] = null;
    }

    // Marcar o número como disponível
    draggedNumber.isAvailable = true;

    setSelectedNumerators(updatedSelectedNumerators);
    setSelectedDenominators(updatedSelectedDenominators);
    setAvailableNumbers(updatedAvailableNumbers);
  };

  const checkAnswer = () => {
    const level = levels[currentLevel];
    if (
      selectedNumerators.includes(null) ||
      selectedDenominators.includes(null)
    ) {
      Alert.alert('Erro', 'Preencha todos os espaços.');
      return;
    }

    const numerators = selectedNumerators as number[];
    const denominators = selectedDenominators as number[];

    let isCorrect = false;
    switch (level.formula) {
      case 'Média':
        const sum = numerators.reduce((acc, val) => acc + val, 0);
        const denominator = denominators[0];
        const avg = sum / denominator;
        isCorrect = Math.abs(avg - level.result) < 0.01;
        break;
      // Outros casos podem ser adicionados aqui
      default:
        break;
    }

    if (isCorrect) {
      Alert.alert('Correto!', 'Você acertou!', [
        {
          text: 'Próximo Nível',
          onPress: () => {
            updateXP(level.xp);
            setCurrentLevel((prev) => prev + 1);
          },
        },
      ]);
    } else {
      Alert.alert('Errado', 'Tente novamente.');
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
    <DraxProvider>
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
        <Header title="Jogo de Fórmulas" showBackButton />
        <View style={styles.content}>
          <Text
            style={[
              styles.instructionText,
              darkModeEnabled ? styles.darkText : styles.lightText,
            ]}
          >
            Complete com os valores necessários para que a fórmula esteja
            correta:
          </Text>
          <Text
            style={[
              styles.levelText,
              darkModeEnabled ? styles.darkText : styles.lightText,
            ]}
          >
            Nível {currentLevel + 1}
          </Text>
          <Text
            style={[
              styles.formulaText,
              darkModeEnabled ? styles.darkText : styles.lightText,
            ]}
          >
            {levels[currentLevel]?.formulaDisplay}
          </Text>
          {/* Fórmula */}
          <View style={styles.formulaContainer}>
            {/* Numeradores */}
            <View style={styles.numeratorContainer}>
              {selectedNumerators.map((num, index) => (
                <DraxView
                  key={`numerator-${index}`}
                  style={[
                    styles.slot,
                    num !== null && styles.filledSlot,
                  ]}
                  receivingStyle={styles.receiving}
                  renderContent={() =>
                    num !== null ? (
                      <Text style={styles.slotText}>{num}</Text>
                    ) : null
                  }
                  onReceiveDragDrop={(event) =>
                    onReceiveDragDrop(event, index, 'numerator')
                  }
                  payload={{
                    from: 'numerator',
                    fromIndex: index,
                    numberId: availableNumbers.find((n) => n.value === num)?.id,
                  }}
                  draggable={false}
                  receptive={true}
                />
              ))}
            </View>
            {/* Linha de Fração */}
            <View style={styles.fractionLine} />
            {/* Denominadores */}
            <View style={styles.denominatorContainer}>
              {selectedDenominators.map((num, index) => (
                <DraxView
                  key={`denominator-${index}`}
                  style={[
                    styles.slot,
                    num !== null && styles.filledSlot,
                  ]}
                  receivingStyle={styles.receiving}
                  renderContent={() =>
                    num !== null ? (
                      <Text style={styles.slotText}>{num}</Text>
                    ) : null
                  }
                  onReceiveDragDrop={(event) =>
                    onReceiveDragDrop(event, index, 'denominator')
                  }
                  payload={{
                    from: 'denominator',
                    fromIndex: index,
                    numberId: availableNumbers.find((n) => n.value === num)?.id,
                  }}
                  draggable={false}
                  receptive={true}
                />
              ))}
            </View>
            {/* Igualdade com o resultado */}
            <Text style={styles.equalsText}>= {levels[currentLevel]?.result}</Text>
          </View>
          {/* Números Disponíveis */}
          <View style={styles.availableNumbersContainer}>
            <View style={styles.numbersContainer}>
              {availableNumbers.map((num, index) => (
                <DraxView
                  key={`number-${num.id}`}
                  style={[
                    styles.numberItem,
                    !num.isAvailable && styles.numberItemDisabled,
                  ]}
                  draggingStyle={styles.dragging}
                  dragReleasedStyle={styles.dragging}
                  hoverDraggingStyle={styles.dragging}
                  dragPayload={{
                    numberId: num.id,
                    from: 'available',
                  }}
                  longPressDelay={0}
                  renderContent={() => (
                    <Text style={styles.numberText}>{num.value}</Text>
                  )}
                  draggable={num.isAvailable}
                  receptive={false}
                />
              ))}
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            darkModeEnabled ? styles.darkButton : styles.lightButton,
          ]}
          onPress={checkAnswer}
        >
          <Text style={styles.buttonText}>Verificar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </DraxProvider>
  );
}

// Styles
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
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formulaText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  formulaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  numeratorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fractionLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#000',
    marginVertical: 5,
  },
  denominatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  equalsText: {
    fontSize: 18,
    marginTop: 10,
  },
  slot: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#4caf50',
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledSlot: {
    backgroundColor: '#d3d3d3',
  },
  receiving: {
    borderColor: '#000',
  },
  slotText: {
    fontSize: 18,
  },
  availableNumbersContainer: {
    marginBottom: 20,
  },
  numbersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  numberItem: {
    width: 60,
    height: 60,
    backgroundColor: '#4caf50',
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberItemDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.5,
  },
  dragging: {
    opacity: 0.5,
  },
  numberText: {
    color: '#fff',
    fontSize: 18,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    margin: 20,
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
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
});
