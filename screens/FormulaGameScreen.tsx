// screens/FormulaGameScreen.tsx

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Header from "../components/Header";
import { ThemeContext } from "../contexts/ThemeContext";
import { firestore, auth } from "../firebaseConfig";
import { doc, runTransaction } from "firebase/firestore";
import { DraxProvider, DraxView } from "react-native-drax";
import Icon from "react-native-vector-icons/Ionicons"; // Adicionado para ícones

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
    formula: "Média",
    formulaDisplay: "Média = (a + b + c + d) / n = 5",
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
  const [selectedNumerators, setSelectedNumerators] = useState<
    (number | null)[]
  >([]);
  const [selectedDenominators, setSelectedDenominators] = useState<
    (number | null)[]
  >([]);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>(
    [],
  );

  useEffect(() => {
    setupLevel();
  }, [currentLevel]);

  const setupLevel = () => {
    const level = levels[currentLevel];
    if (!level) {
      Alert.alert("Parabéns!", "Você completou todos os níveis!");
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

  // Implementação da função onDragEnd com atualização de estado funcional e delay para snapback
  const onDragEnd = (event: any) => {
    const { numberId, from, fromIndex } = event.dragged.payload;
    const { droppedOnTarget } = event; // Verificar se foi solto em um alvo válido

    if (!droppedOnTarget) {
      // Solto em área inválida
      // **Melhoria:** Atrasar a atualização do estado para permitir a animação de snapback
      setTimeout(() => {
        setAvailableNumbers((prevAvailableNumbers) => {
          const updatedNumbers = [...prevAvailableNumbers];
          const draggedNumber = updatedNumbers.find(
            (num) => num.id === numberId,
          );
          if (draggedNumber) {
            draggedNumber.isAvailable = true;
          }
          return updatedNumbers;
        });

        // **Melhoria:** Atualizar selectedNumerators e selectedDenominators de forma funcional
        if (from === "numerator") {
          setSelectedNumerators((prevSelectedNumerators) => {
            const updatedSelectedNumerators = [...prevSelectedNumerators];
            updatedSelectedNumerators[fromIndex] = null;
            return updatedSelectedNumerators;
          });
        } else if (from === "denominator") {
          setSelectedDenominators((prevSelectedDenominators) => {
            const updatedSelectedDenominators = [...prevSelectedDenominators];
            updatedSelectedDenominators[fromIndex] = null;
            return updatedSelectedDenominators;
          });
        }
      }, 1); // Tempo de atraso em milissegundos (ajuste conforme necessário)
    }
  };

  const onReceiveDragDrop = (
    event: any,
    index: number,
    type: "numerator" | "denominator",
  ) => {
    const { numberId, from, fromIndex } = event.dragged.payload;

    const draggedNumber = availableNumbers.find((num) => num.id === numberId);
    if (!draggedNumber) return;

    // **Melhoria:** Atualizar selectedNumerators e selectedDenominators de forma funcional
    if (from === "numerator") {
      setSelectedNumerators((prevSelectedNumerators) => {
        const updatedSelectedNumerators = [...prevSelectedNumerators];
        updatedSelectedNumerators[fromIndex] = null;
        return updatedSelectedNumerators;
      });
    } else if (from === "denominator") {
      setSelectedDenominators((prevSelectedDenominators) => {
        const updatedSelectedDenominators = [...prevSelectedDenominators];
        updatedSelectedDenominators[fromIndex] = null;
        return updatedSelectedDenominators;
      });
    }

    // **Melhoria:** Atualizar selectedNumerators e selectedDenominators usando função
    if (type === "numerator") {
      setSelectedNumerators((prevSelectedNumerators) => {
        const updatedSelectedNumerators = [...prevSelectedNumerators];
        if (updatedSelectedNumerators[index] !== null) {
          // Retornar o número anterior para disponível
          setAvailableNumbers((prevAvailableNumbers) => {
            const updatedNumbers = [...prevAvailableNumbers];
            const existingNum = updatedNumbers.find(
              (n) => n.value === updatedSelectedNumerators[index],
            );
            if (existingNum) existingNum.isAvailable = true;
            return updatedNumbers;
          });
        }
        updatedSelectedNumerators[index] = draggedNumber.value;
        return updatedSelectedNumerators;
      });
    } else {
      setSelectedDenominators((prevSelectedDenominators) => {
        const updatedSelectedDenominators = [...prevSelectedDenominators];
        if (updatedSelectedDenominators[index] !== null) {
          // Retornar o número anterior para disponível
          setAvailableNumbers((prevAvailableNumbers) => {
            const updatedNumbers = [...prevAvailableNumbers];
            const existingNum = updatedNumbers.find(
              (n) => n.value === selectedDenominators[index],
            );
            if (existingNum) existingNum.isAvailable = true;
            return updatedNumbers;
          });
        }
        updatedSelectedDenominators[index] = draggedNumber.value;
        return updatedSelectedDenominators;
      });
    }

    // **Melhoria:** Atualizar a disponibilidade de forma funcional
    setAvailableNumbers((prevAvailableNumbers) => {
      const updatedNumbers = [...prevAvailableNumbers];
      const num = updatedNumbers.find((n) => n.id === numberId);
      if (num) {
        num.isAvailable = false;
      }
      return updatedNumbers;
    });
  };

  const checkAnswer = () => {
    const level = levels[currentLevel];
    if (
      selectedNumerators.includes(null) ||
      selectedDenominators.includes(null)
    ) {
      Alert.alert("Erro", "Preencha todos os espaços.");
      return;
    }

    const numerators = selectedNumerators as number[];
    const denominators = selectedDenominators as number[];

    let isCorrect = false;
    switch (level.formula) {
      case "Média":
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
      Alert.alert("Correto!", "Você acertou!", [
        {
          text: "Próximo Nível",
          onPress: () => {
            updateXP(level.xp);
            setCurrentLevel((prev) => prev + 1);
          },
        },
      ]);
    } else {
      Alert.alert("Errado", "Tente novamente.");
    }
  };

  const updateXP = async (xpToAdd: number) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(firestore, "users", user.uid);
        await runTransaction(firestore, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw "Usuário não existe!";
          }
          const newXP = (userDoc.data().xp || 0) + xpToAdd;
          transaction.update(userRef, { xp: newXP });
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar XP:", error);
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
          barStyle={darkModeEnabled ? "light-content" : "dark-content"}
          backgroundColor={darkModeEnabled ? "#121212" : "#4caf50"}
        />
        <Header title="Jogo de Fórmulas" showBackButton />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                      darkModeEnabled ? styles.darkSlot : styles.lightSlot,
                    ]}
                    receivingStyle={styles.receiving}
                    renderContent={() =>
                      num !== null ? (
                        <Text style={styles.slotText}>{num}</Text>
                      ) : (
                        <Icon
                          name="add-circle-outline"
                          size={24}
                          color={darkModeEnabled ? "#fff" : "#333"}
                        />
                      )
                    }
                    onReceiveDragDrop={(event) =>
                      onReceiveDragDrop(event, index, "numerator")
                    }
                    dragPayload={
                      num !== null
                        ? {
                            numberId: availableNumbers.find(
                              (n) => n.value === num,
                            )?.id,
                            from: "numerator",
                            fromIndex: index,
                          }
                        : null
                    }
                    draggable={num !== null}
                    receptive={true}
                    animateSnapback={true} // Garantir que o snapback esteja ativado
                    onDragEnd={onDragEnd} // Adicionar onDragEnd
                    draggingStyle={styles.dragging}
                    dragReleasedStyle={styles.released} // Alterado para styles.released
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
                      darkModeEnabled ? styles.darkSlot : styles.lightSlot,
                    ]}
                    receivingStyle={styles.receiving}
                    renderContent={() =>
                      num !== null ? (
                        <Text style={styles.slotText}>{num}</Text>
                      ) : (
                        <Icon
                          name="add-circle-outline"
                          size={24}
                          color={darkModeEnabled ? "#fff" : "#333"}
                        />
                      )
                    }
                    onReceiveDragDrop={(event) =>
                      onReceiveDragDrop(event, index, "denominator")
                    }
                    dragPayload={
                      num !== null
                        ? {
                            numberId: availableNumbers.find(
                              (n) => n.value === num,
                            )?.id,
                            from: "denominator",
                            fromIndex: index,
                          }
                        : null
                    }
                    draggable={num !== null}
                    receptive={true}
                    animateSnapback={true} // Garantir que o snapback esteja ativado
                    onDragEnd={onDragEnd} // Adicionar onDragEnd
                    draggingStyle={styles.dragging}
                    dragReleasedStyle={styles.released} // Alterado para styles.released
                  />
                ))}
              </View>
              {/* Igualdade com o resultado */}
              <Text style={styles.equalsText}>
                = {levels[currentLevel]?.result}
              </Text>
            </View>
            {/* Números Disponíveis */}
            <View style={styles.availableNumbersContainer}>
              <Text
                style={[
                  styles.availableText,
                  darkModeEnabled ? styles.darkText : styles.lightText,
                ]}
              >
                Números Disponíveis:
              </Text>
              <View style={styles.numbersContainer}>
                {availableNumbers
                  .filter((num) => num.isAvailable)
                  .map((num) => (
                    <DraxView
                      key={`available-${num.id}`}
                      style={[
                        styles.numberItem,
                        darkModeEnabled
                          ? styles.darkNumberItem
                          : styles.lightNumberItem,
                      ]}
                      draggingStyle={styles.dragging}
                      dragReleasedStyle={styles.released} // Alterado para styles.released
                      hoverDraggingStyle={styles.hoverDragging}
                      dragPayload={{
                        numberId: num.id,
                        from: "available",
                      }}
                      longPressDelay={150}
                      renderContent={() => (
                        <Text style={styles.numberText}>{num.value}</Text>
                      )}
                      draggable={num.isAvailable}
                      animateSnapback={true} // Garantir que o snapback esteja ativado
                      onDragEnd={onDragEnd} // Adicionar onDragEnd
                    />
                  ))}
              </View>
            </View>
          </View>
        </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  lightContainer: {
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  levelText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  formulaText: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 20,
  },
  formulaContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  numeratorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  fractionLine: {
    width: "80%",
    height: 2,
    backgroundColor: "#4caf50",
    marginVertical: 5,
  },
  denominatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  equalsText: {
    fontSize: 18,
    marginTop: 10,
    fontWeight: "bold",
    color: "#ff9800",
  },
  slot: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: "#4caf50",
    borderRadius: 8,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
  },
  filledSlot: {
    backgroundColor: "#a5d6a7",
  },
  darkSlot: {
    borderColor: "#81c784",
    backgroundColor: "#424242",
  },
  lightSlot: {
    borderColor: "#4caf50",
    backgroundColor: "#e8f5e9",
  },
  receiving: {
    borderColor: "#ff9800",
    borderStyle: "dashed",
  },
  slotText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  availableNumbersContainer: {
    marginBottom: 20,
  },
  availableText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  numbersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  numbersContentContainer: {
    justifyContent: "center",
  },
  numberItem: {
    width: 60,
    height: 60,
    backgroundColor: "#4caf50",
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    elevation: 2, // Sombra para destacar
  },
  darkNumberItem: {
    backgroundColor: "#388e3c",
  },
  lightNumberItem: {
    backgroundColor: "#4caf50",
  },
  numberItemDisabled: {
    backgroundColor: "#a5d6a7",
    opacity: 0.6,
  },
  dragging: {
    opacity: 0.3,
  },
  released: { // Novo estilo adicionado
    opacity: 1,
  },
  hoverDragging: {
    borderColor: "#ff9800",
    borderWidth: 2,
  },
  numberText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  lightButton: {
    backgroundColor: "#4caf50",
  },
  darkButton: {
    backgroundColor: "#388e3c",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  lightText: {
    color: "#333",
  },
  darkText: {
    color: "#fff",
  },
});