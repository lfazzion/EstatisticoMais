// screens/EditExerciseScreen.tsx

import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import { firestore } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import Checkbox from 'expo-checkbox';
import { ThemeContext } from '../contexts/ThemeContext';

// Tipagem específica para as propriedades de navegação e rota
type EditExerciseRouteProp = RouteProp<RootStackParamList, 'EditExercise'>;
type EditExerciseNavigationProp = StackNavigationProp<RootStackParamList, 'EditExercise'>;

// Componente principal da tela de edição de exercício
export default function EditExerciseScreen() {
  // Obtenção das propriedades da rota e navegação
  const route = useRoute<EditExerciseRouteProp>();
  const navigation = useNavigation<EditExerciseNavigationProp>();
  const { exerciseId } = route.params;

  // Definição dos estados para controle dos campos e dados do exercício
  const [exerciseName, setExerciseName] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [correctOptions, setCorrectOptions] = useState<boolean[]>([]);
  const [hint, setHint] = useState<string>('');
  const [xpValue, setXpValue] = useState<number>(10);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Obter o estado do modo escuro do contexto
  const { darkModeEnabled } = useContext(ThemeContext);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(firestore, 'exercises', exerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExerciseName(data.name || '');
          setQuestion(data.question || '');
          setOptions(data.options || ['']);
          setCorrectOptions(data.correctOptions || [false]);
          setHint(data.hint || '');
          setXpValue(data.xpValue || 10);
        } else {
          console.error('Exercício não encontrado');
          setError('Exercício não encontrado. Por favor, tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao buscar exercício:', error);
        setError('Erro ao buscar exercício. Verifique sua conexão e tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchExercise();
  }, [exerciseId]);

  // Função para atualizar o texto de uma opção específica
  const handleOptionChange = (index: number, text: string) => {
    setOptions((prevOptions) => {
      const newOptions = [...prevOptions];
      newOptions[index] = text;
      return newOptions;
    });
  };

  const addOption = () => {
    if (options.length >= 5) {
      Alert.alert('Limite atingido', 'Você só pode adicionar até 5 opções.');
      return;
    }
    setOptions([...options, '']);
    setCorrectOptions([...correctOptions, false]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      const newCorrectOptions = [...correctOptions];
      newOptions.splice(index, 1);
      newCorrectOptions.splice(index, 1);
      setOptions(newOptions);
      setCorrectOptions(newCorrectOptions);
    }
  };

  const updateExercise = async () => {
    const filteredOptionsAndCorrectOptions = options.reduce(
      (
        acc: { options: string[]; correctOptions: boolean[] },
        option: string,
        index: number
      ) => {
        const trimmedOption = option.trim();
        if (trimmedOption !== '') {
          acc.options.push(trimmedOption);
          acc.correctOptions.push(correctOptions[index]);
        }
        return acc;
      },
      { options: [], correctOptions: [] }
    );

    const { options: filteredOptions, correctOptions: filteredCorrectOptions } = filteredOptionsAndCorrectOptions;

    if (exerciseName.trim() === '') {
      setError('Por favor, insira o nome do exercício.');
      return;
    }

    if (question.trim() === '') {
      setError('Por favor, insira a pergunta.');
      return;
    }

    if (filteredOptions.length < 2) {
      setError('Por favor, insira pelo menos duas opções.');
      return;
    }

    if (!filteredCorrectOptions.includes(true)) {
      setError('Por favor, selecione pelo menos uma opção correta.');
      return;
    }

    try {
      const exerciseRef = doc(firestore, 'exercises', exerciseId);
      await updateDoc(exerciseRef, {
        name: exerciseName.trim(),
        question: question.trim(),
        options: filteredOptions,
        correctOptions: filteredCorrectOptions,
        hint: hint.trim(),
        xpValue,
      });
      Alert.alert('Sucesso', 'Exercício atualizado com sucesso.', [
        {
          text: 'Ver Lista de Exercícios',
          onPress: () => {
            navigation.dispatch(
              CommonActions.reset({
                index: 1,
                routes: [
                  { name: 'ProfessorDrawer' },
                  { name: 'ProfessorExercises' },
                ],
              })
            );
          },
        },
        {
          text: 'Continuar Editando',
          onPress: () => {},
        },
      ]);
      setError('');
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
      setError('Ocorreu um erro ao atualizar o exercício. Tente novamente.');
    }
  };

  const getConditionalStyle = (lightStyle: any, darkStyle: any) => {
    return darkModeEnabled ? darkStyle : lightStyle;
  };

  const pickerItemStyle = useMemo(() => ({
    color: darkModeEnabled ? '#fff' : '#333',
    fontSize: 16,
  }), [darkModeEnabled]);

  const pickerColor = darkModeEnabled ? '#fff' : '#333';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getConditionalStyle(styles.lightContainer, styles.darkContainer)]}>
        <StatusBar barStyle={darkModeEnabled ? 'light-content' : 'dark-content'} backgroundColor="#4caf50" />
        <Header title="Editar Exercício" showBackButton />
        <ActivityIndicator size="large" color="#4caf50" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getConditionalStyle(styles.lightContainer, styles.darkContainer)]}>
      <StatusBar barStyle={darkModeEnabled ? 'light-content' : 'dark-content'} backgroundColor="#4caf50" />
      <Header title="Editar Exercício" showBackButton />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>Nome do Exercício:</Text>
        <TextInput
          style={[styles.input, getConditionalStyle(styles.lightInput, styles.darkInput)]}
          placeholder="Digite o nome do exercício"
          placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
          onChangeText={(text) => setExerciseName(text)}
          value={exerciseName}
        />

        <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>Pergunta:</Text>
        <TextInput
          style={[styles.input, getConditionalStyle(styles.lightInput, styles.darkInput), { height: 100 }]}
          placeholder="Digite a pergunta"
          placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
          multiline
          numberOfLines={4}
          onChangeText={(text) => setQuestion(text)}
          value={question}
        />

        {/* Campos de opções de resposta */}
        <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>Opções (Mínimo 2):</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <TextInput
              style={[styles.optionInput, getConditionalStyle(styles.lightInput, styles.darkInput)]}
              placeholder={`Opção ${index + 1}`}
              placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
              onChangeText={(text) => handleOptionChange(index, text)}
              value={option}
            />
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={correctOptions[index]}
                onValueChange={(newValue) => {
                  const newCorrectOptions = [...correctOptions];
                  newCorrectOptions[index] = newValue;
                  setCorrectOptions(newCorrectOptions);
                }}
                color={correctOptions[index] ? '#4caf50' : undefined}
              />
              <Text style={[styles.checkboxLabel, getConditionalStyle(styles.lightText, styles.darkText)]}>
                Correta
              </Text>
            </View>
            {options.length > 2 && (
              <TouchableOpacity
                onPress={() => removeOption(index)}
                style={styles.removeOptionButton}
              >
                <Text style={styles.removeOptionButtonText}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {/* Botão para adicionar nova opção */}
        <TouchableOpacity
          onPress={addOption}
          style={[styles.addOptionButton, getConditionalStyle(styles.lightButton, styles.darkButton)]}
        >
          <Text style={styles.addOptionButtonText}>Adicionar Opção</Text>
        </TouchableOpacity>

        {/* Seletor de valor de XP */}
        <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>Defina o XP:</Text>
        <View style={[styles.pickerContainer, getConditionalStyle(styles.lightPickerContainer, styles.darkPickerContainer)]}>
          <Picker
            key={darkModeEnabled ? 'dark' : 'light'}
            selectedValue={xpValue}
            onValueChange={(itemValue) => setXpValue(itemValue)}
            style={[styles.picker, { color: pickerColor }]}
            dropdownIconColor={darkModeEnabled ? '#fff' : '#333'}
            itemStyle={pickerItemStyle}
          >
            <Picker.Item label="+10XP (Fácil)" value={10} />
            <Picker.Item label="+20XP (Médio)" value={20} />
            <Picker.Item label="+30XP (Difícil)" value={30} />
            <Picker.Item label="+50XP (Muito Difícil)" value={50} />
          </Picker>
        </View>

        <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>Dica:</Text>
        <TextInput
          style={[styles.input, getConditionalStyle(styles.lightInput, styles.darkInput), { height: 100 }]}
          placeholder="Explicação ou fórmulas a serem utilizadas"
          placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
          multiline
          numberOfLines={4}
          onChangeText={(text) => setHint(text)}
          value={hint}
        />

        {error !== '' && (
          <Text style={[styles.errorText, getConditionalStyle(styles.lightErrorText, styles.darkErrorText)]}>
            {error}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.button, getConditionalStyle(styles.lightButton, styles.darkButton)]}
          onPress={updateExercise}
        >
          <Text style={styles.buttonText}>Atualizar Exercício</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos aplicados à tela
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
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  label: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    height: 50,
  },
  lightInput: {
    backgroundColor: '#eee',
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#555',
    color: '#fff',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
    height: 50,
    backgroundColor: 'transparent',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkboxLabel: {
    marginLeft: 5,
    fontSize: 16,
  },
  removeOptionButton: {
    marginLeft: 10,
  },
  removeOptionButtonText: {
    color: 'red',
    fontSize: 16,
  },
  addOptionButton: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addOptionButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  lightButton: {
    backgroundColor: '#4caf50',
  },
  darkButton: {
    backgroundColor: '#006400',
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 15,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  lightPickerContainer: {
    backgroundColor: '#eee',
  },
  darkPickerContainer: {
    backgroundColor: '#555',
  },
  picker: {
    width: '100%',
    justifyContent: 'center',
  },
  button: {
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
    marginTop: 10,
    textAlign: 'center',
  },
  lightErrorText: {
    color: 'red',
  },
  darkErrorText: {
    color: '#ff6666',
  },
});
