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
import Icon from "react-native-vector-icons/Ionicons";
import MixedText from "../components/MixedText"; // Importando o MixedText

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
    formulaDisplay: "$$\\frac{a + b}{n} = 7$$", // Usando LaTeX
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    numeratorSlots: 2,
    denominatorSlots: 1,
    result: 7,
    xp: 10,
  },
  {
    id: 1,
    formula: "Média",
    formulaDisplay: "$$\\frac{a + b + c}{n} = 4$$", // Usando LaTeX
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    numeratorSlots: 3,
    denominatorSlots: 1,
    result: 4,
    xp: 10,
  },
  {
    id: 1,
    formula: "Média",
    formulaDisplay: "$$\\frac{a + b + c + d}{n} = 5$$", // Usando LaTeX
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    numeratorSlots: 4,
    denominatorSlots: 1,
    result: 5,
    xp: 10,
  }
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
    []
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

  // Função para obter o valor do número a partir do ID
  const getNumberValueById = (id: number | null): number | null => {
    if (id === null) return null;
    const num = availableNumbers.find((n) => n.id === id);
    return num ? num.value : null;
  };

  // Implementação da função onDragEnd com atualização de estado funcional e delay para snapback
  const onDragEnd = (event: any) => {
    const { numberId, from, fromIndex } = event.dragged.payload;
    const { droppedOnTarget } = event; // Verificar se foi solto em um alvo válido

    if (!droppedOnTarget) {
      // Solto em área inválida
      // **Melhoria:** Atrasar a atualização do estado para permitir a animação de snapback
      setTimeout(() => {
        setAvailableNumbers((prevAvailableNumbers) =>
          prevAvailableNumbers.map((num) =>
            num.id === numberId ? { ...num, isAvailable: true } : num
          )
        );

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
      }, 100); // Tempo de atraso em milissegundos (ajuste conforme necessário)
    }
  };

  const onReceiveDragDrop = (
    event: any,
    index: number,
    type: "numerator" | "denominator"
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
          // Retornar o número anterior para disponível de forma imutável
          const existingNumberId = updatedSelectedNumerators[index];
          setAvailableNumbers((prevAvailableNumbers) =>
            prevAvailableNumbers.map((n) =>
              n.id === existingNumberId ? { ...n, isAvailable: true } : n
            )
          );
        }
        updatedSelectedNumerators[index] = numberId;
        return updatedSelectedNumerators;
      });
    } else {
      setSelectedDenominators((prevSelectedDenominators) => {
        const updatedSelectedDenominators = [...prevSelectedDenominators];
        if (updatedSelectedDenominators[index] !== null) {
          // Retornar o número anterior para disponível de forma imutável
          const existingNumberId = updatedSelectedDenominators[index];
          setAvailableNumbers((prevAvailableNumbers) =>
            prevAvailableNumbers.map((n) =>
              n.id === existingNumberId ? { ...n, isAvailable: true } : n
            )
          );
        }
        updatedSelectedDenominators[index] = numberId;
        return updatedSelectedDenominators;
      });
    }

    // **Melhoria:** Atualizar a disponibilidade de forma imutável
    setAvailableNumbers((prevAvailableNumbers) =>
      prevAvailableNumbers.map((n) =>
        n.id === numberId ? { ...n, isAvailable: false } : n
      )
    );
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

    const numeratorsValues = selectedNumerators.map((id) =>
      getNumberValueById(id)
    ) as number[];
    const denominatorsValues = selectedDenominators.map((id) =>
      getNumberValueById(id)
    ) as number[];

    let isCorrect = false;
    switch (level.formula) {
      case "Média":
        const sum = numeratorsValues.reduce((acc, val) => acc + val, 0);
        const denominator = denominatorsValues[0];
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
              Arraste os valores necessários para que a fórmula esteja
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
            {/* Exibindo a fórmula com MixedText */}
            <MixedText
              content={levels[currentLevel]?.formulaDisplay}
              style={[
                styles.formulaText,
                darkModeEnabled ? styles.darkText : styles.lightText,
              ]}
            />
            {/* Fórmula Interativa */}
            <View style={styles.formulaContainer}>
              {/* Fração e Igualdade em uma linha */}
              <View style={styles.fractionWithEquals}>
                {/* Fração */}
                <View style={styles.fraction}>
                  {/* Numeradores */}
                  <View style={styles.numeratorContainer}>
                    {selectedNumerators.map((numId, index) => (
                      <React.Fragment key={`numerator-fragment-${index}`}>
                        <DraxView
                          key={`numerator-${index}`}
                          style={[
                            styles.slot,
                            numId !== null && styles.filledSlot,
                            darkModeEnabled
                              ? styles.darkSlot
                              : styles.lightSlot,
                          ]}
                          receivingStyle={styles.receiving}
                          renderContent={() =>
                            numId !== null ? (
                              <Text
                                style={[
                                  styles.slotText,
                                  darkModeEnabled
                                    ? styles.whiteText
                                    : styles.blackText,
                                ]}
                              >
                                {getNumberValueById(numId)}
                              </Text>
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
                            numId !== null
                              ? {
                                  numberId: numId,
                                  from: "numerator",
                                  fromIndex: index,
                                }
                              : null
                          }
                          draggable={numId !== null}
                          receptive={true}
                          animateSnapback={true} // Garantir que o snapback esteja ativado
                          onDragEnd={onDragEnd} // Adicionar onDragEnd
                          draggingStyle={styles.dragging}
                          dragReleasedStyle={styles.released} // Alterado para styles.released
                        />
                        {index < selectedNumerators.length - 1 && (
                          <Text
                            style={[
                              styles.plusText,
                              darkModeEnabled
                                ? styles.darkText
                                : styles.lightText,
                            ]}
                          >
                            +
                          </Text>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                  {/* Linha de Fração */}
                  <View style={styles.fractionLine} />
                  {/* Denominadores */}
                  <View style={styles.denominatorContainer}>
                    {selectedDenominators.map((numId, index) => (
                      <DraxView
                        key={`denominator-${index}`}
                        style={[
                          styles.slot,
                          numId !== null && styles.filledSlot,
                          darkModeEnabled
                            ? styles.darkSlot
                            : styles.lightSlot,
                        ]}
                        receivingStyle={styles.receiving}
                        renderContent={() =>
                          numId !== null ? (
                            <Text
                              style={[
                                styles.slotText,
                                darkModeEnabled
                                  ? styles.whiteText
                                  : styles.blackText,
                              ]}
                            >
                              {getNumberValueById(numId)}
                            </Text>
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
                          numId !== null
                            ? {
                                numberId: numId,
                                from: "denominator",
                                fromIndex: index,
                              }
                            : null
                        }
                        draggable={numId !== null}
                        receptive={true}
                        animateSnapback={true} // Garantir que o snapback esteja ativado
                        onDragEnd={onDragEnd} // Adicionar onDragEnd
                        draggingStyle={styles.dragging}
                        dragReleasedStyle={styles.released} // Alterado para styles.released
                      />
                    ))}
                  </View>
                </View>
                {/* Igualdade com o resultado */}
                <Text style={styles.equalsText}>
                  = {levels[currentLevel]?.result}
                </Text>
              </View>
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
    marginBottom: 15,
  },
  levelText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  formulaText: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 20,
  },
  formulaContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  fractionWithEquals: {
    flexDirection: "row",
    alignItems: "center",
  },
  fraction: {
    alignItems: "center",
    marginRight: 10, // Espaço entre a fração e o sinal de igual
  },
  numeratorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  fractionLine: {
    width: "99%",
    height: 4,
    backgroundColor: "#4caf50",
    marginVertical: 8,
  },
  denominatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  equalsText: {
    fontSize: 34,
    marginLeft: 4, // Espaço entre a fração e o sinal de igual
    fontWeight: "normal",
    color: "#ff9800",
  },
  slot: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: "#4caf50",
    borderRadius: 8,
    margin: 2,
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
  },
  whiteText: {
    color: "#fff",
  },
  blackText: {
    color: "#000",
  },
  plusText: {
    fontSize: 24,
    marginHorizontal: 5,
    color: "#4caf50",
    fontWeight: "bold",
    alignSelf: "center",
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
    width: 55,
    height: 55,
    backgroundColor: "#4caf50",
    margin: 6,
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
  released: {
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