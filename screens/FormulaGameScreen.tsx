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
  Dimensions,
} from "react-native";
import Header from "../components/Header";
import { ThemeContext } from "../contexts/ThemeContext";
import { firestore, auth } from "../firebaseConfig";
import { doc, runTransaction } from "firebase/firestore";
import { DraxProvider, DraxView, DraxScrollView } from "react-native-drax";
import Icon from "react-native-vector-icons/Ionicons";
import MixedText from "../components/MixedText";

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
    id: 2,
    formula: "Média",
    formulaDisplay: "$$\\frac{a + b + c}{n} = 4$$", // Usando LaTeX
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    numeratorSlots: 3,
    denominatorSlots: 1,
    result: 4,
    xp: 10,
  },
  {
    id: 3,
    formula: "Média",
    formulaDisplay: "$$\\frac{a + b + c + d}{n} = 5$$", // Usando LaTeX
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    numeratorSlots: 4,
    denominatorSlots: 1,
    result: 5,
    xp: 10,
  },
];

export default function FormulaGameScreen() {
  const { darkModeEnabled } = useContext(ThemeContext);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedNumerators, setSelectedNumerators] = useState<(number | null)[]>(
    []
  );
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

  const getNumberValueById = (id: number | null): number | null => {
    if (id === null) return null;
    const num = availableNumbers.find((n) => n.id === id);
    return num ? num.value : null;
  };

  const onDragEnd = (event: any) => {
    const { numberId, from, fromIndex } = event.dragged.payload;
    const { droppedOnTarget } = event;

    if (!droppedOnTarget) {
      setTimeout(() => {
        setAvailableNumbers((prevAvailableNumbers) =>
          prevAvailableNumbers.map((num) =>
            num.id === numberId ? { ...num, isAvailable: true } : num
          )
        );

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
      }, 100);
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

    if (type === "numerator") {
      setSelectedNumerators((prevSelectedNumerators) => {
        const updatedSelectedNumerators = [...prevSelectedNumerators];
        if (updatedSelectedNumerators[index] !== null) {
          const existingNumberId = updatedSelectedNumerators[index];
          setAvailableNumbers((prevAvailableNumbers) =>
            prevAvailableNumbers.map((n) =>
              n.id === existingNumberId
                ? { ...n, isAvailable: true }
                : n
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
          const existingNumberId = updatedSelectedDenominators[index];
          setAvailableNumbers((prevAvailableNumbers) =>
            prevAvailableNumbers.map((n) =>
              n.id === existingNumberId
                ? { ...n, isAvailable: true }
                : n
            )
          );
        }
        updatedSelectedDenominators[index] = numberId;
        return updatedSelectedDenominators;
      });
    }

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
        {/* Ajustando o layout para garantir que o botão "Verificar" permaneça visível */}
        <View style={styles.mainContent}>
          <DraxScrollView
            contentContainerStyle={styles.scrollContainer}
            style={styles.draxScrollView}
          >
            <View style={styles.content}>
              <Text
                style={[
                  styles.instructionText,
                  darkModeEnabled ? styles.darkText : styles.lightText,
                ]}
              >
                Arraste os valores necessários para que a fórmula esteja correta:
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
                            animateSnapback={true}
                            onDragEnd={onDragEnd}
                            draggingStyle={styles.dragging}
                            dragReleasedStyle={styles.released}
                          />
                          {index < selectedNumerators.length - 1 && (
                            <Text
                              style={[
                                styles.plusText,
                                darkModeEnabled
                                  ? styles.whiteText
                                  : styles.blackText,
                              ]}
                            >
                              +
                            </Text>
                          )}
                        </React.Fragment>
                      ))}
                    </View>

                    {/* Linha da fração */}
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
                          animateSnapback={true}
                          onDragEnd={onDragEnd}
                          draggingStyle={styles.dragging}
                          dragReleasedStyle={styles.released}
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
                        dragReleasedStyle={styles.released}
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
                        animateSnapback={true}
                        onDragEnd={onDragEnd}
                      />
                    ))}
                </View>
              </View>
            </View>
          </DraxScrollView>
          {/* Botão "Verificar" fixo na parte inferior */}
          <View
            style={[
              styles.buttonContainer,
              { backgroundColor: darkModeEnabled ? "#121212" : "#fff" },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.button,
                darkModeEnabled ? styles.darkButton : styles.lightButton,
              ]}
              onPress={checkAnswer}
            >
              <Text style={styles.buttonText}>Verificar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </DraxProvider>
  );
}

// Styles
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  draxScrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  lightContainer: {
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  content: {
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
    width: width * 0.9, // Define uma largura responsiva
  },
  fractionWithEquals: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
  },
  fraction: {
    alignItems: "center",
    marginRight: 10,
    width: width * 0.6, // Ajuste a largura conforme necessário
  },
  numeratorContainer: {
    flexDirection: "row",
    justifyContent: "center", // Centraliza os slots
    alignItems: "center", // Centraliza verticalmente
    flexWrap: "nowrap", // Evita quebras de linha
    marginBottom: 4, // Pequeno espaçamento entre numeradores e linha da fração
  },
  denominatorContainer: {
    flexDirection: "row",
    justifyContent: "center", // Centraliza os slots
    alignItems: "center", // Centraliza verticalmente
    flexWrap: "nowrap", // Evita quebras de linha
    marginTop: 4, // Pequeno espaçamento entre linha da fração e denominadores
  },
  fractionLine: {
    width: "100%",
    height: 2, // Ajuste a altura da linha conforme necessário
    backgroundColor: "#4caf50",
    marginVertical: 4,
  },
  equalsText: {
    fontSize: 34,
    marginLeft: 4,
    fontWeight: "normal",
    color: "#ff9800",
  },
  slot: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#4caf50",
    borderRadius: 8,
    marginHorizontal: 4, // Espaçamento horizontal fixo entre os slots
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
    fontSize: 22,
    marginHorizontal: 0, // Espaçamento entre o slot e o símbolo "+"
    alignSelf: "center", // Alinha verticalmente o "+" com o slot
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
  numberItem: {
    width: 55,
    height: 55,
    backgroundColor: "#4caf50",
    margin: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    elevation: 2,
  },
  darkNumberItem: {
    backgroundColor: "#388e3c",
  },
  lightNumberItem: {
    backgroundColor: "#4caf50",
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
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  button: {
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
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