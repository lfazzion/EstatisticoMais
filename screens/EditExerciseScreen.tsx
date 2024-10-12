// screens/EditExerciseScreen.tsx
// Importações necessárias de módulos e componentes
import React, { useState, useEffect } from 'react';
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

// Tipagem específica para as propriedades de navegação e rota
type EditExerciseRouteProp = RouteProp<RootStackParamList, 'EditExercise'>;
type EditExerciseNavigationProp = StackNavigationProp<RootStackParamList, 'EditExercise'>;

// Componente principal da tela de edição de exercício
export default function EditExerciseScreen() {
  // Obtenção das propriedades da rota e navegação
  const route = useRoute<EditExerciseRouteProp>();
  const navigation = useNavigation<EditExerciseNavigationProp>();
  const { exerciseId } = route.params; // Obtém o ID do exercício passado pela navegação

  // Definição dos estados para controle dos campos e dados do exercício
  const [exerciseName, setExerciseName] = useState<string>(''); // Nome do exercício
  const [question, setQuestion] = useState<string>(''); // Pergunta do exercício
  const [options, setOptions] = useState<string[]>([]); // Opções de resposta
  const [correctOptions, setCorrectOptions] = useState<boolean[]>([]); // Marcação das opções corretas
  const [hint, setHint] = useState<string>(''); // Dica ou sugestão para o exercício
  const [xpValue, setXpValue] = useState<number>(10); // Valor do XP associado
  const [error, setError] = useState<string>(''); // Mensagem de erro
  const [loading, setLoading] = useState<boolean>(true); // Controle do estado de carregamento

  // useEffect para buscar os dados do exercício ao carregar o componente
  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(firestore, 'exercises', exerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExerciseName(data.name || ''); // Atualiza o estado com o nome do exercício
          setQuestion(data.question || ''); // Atualiza a pergunta
          setOptions(data.options || ['']); // Atualiza as opções
          setCorrectOptions(data.correctOptions || [false]); // Atualiza as opções corretas
          setHint(data.hint || ''); // Atualiza a dica
          setXpValue(data.xpValue || 10); // Atualiza o XP
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

  // Função para adicionar uma nova opção de resposta
  const addOption = () => {
    if (options.length >= 5) {
      Alert.alert('Limite atingido', 'Você só pode adicionar até 5 opções.');
      return;
    }
    setOptions([...options, '']); // Adiciona uma nova opção vazia
    setCorrectOptions([...correctOptions, false]); // Adiciona uma marcação falsa para a nova opção
  };

  // Função para remover uma opção de resposta, mantendo o mínimo de duas
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

  // Função para atualizar o exercício no Firestore
  const updateExercise = async () => {
    // Filtragem das opções em branco e alinhamento com correctOptions
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

    // Validações dos campos obrigatórios
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

  // Retorno de uma tela de carregamento, caso o estado loading esteja verdadeiro
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <Header title="Editar Exercício" showBackButton />
        <ActivityIndicator size="large" color="#4caf50" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  // Interface principal da tela de edição do exercício
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Editar Exercício" showBackButton />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Entrada para o nome do exercício */}
        <Text style={styles.label}>Nome do Exercício:</Text>
        <TextInput
          style={[styles.input, { height: 50 }]}
          placeholder="Digite o nome do exercício"
          placeholderTextColor="#aaa"
          onChangeText={(text) => setExerciseName(text)}
          value={exerciseName}
        />

        {/* Entrada para a pergunta do exercício */}
        <Text style={styles.label}>Pergunta:</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Digite a pergunta"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          onChangeText={(text) => setQuestion(text)}
          value={question}
        />

        {/* Campos de opções de resposta */}
        <Text style={styles.label}>Opções (Mínimo 2):</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <TextInput
              style={styles.optionInput}
              placeholder={`Opção ${index + 1}`}
              placeholderTextColor="#aaa"
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
              />
              <Text style={styles.checkboxLabel}>Correta</Text>
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
        <TouchableOpacity onPress={addOption} style={styles.addOptionButton}>
          <Text style={styles.addOptionButtonText}>Adicionar Opção</Text>
        </TouchableOpacity>

        {/* Seletor de valor de XP */}
        <Text style={styles.label}>Selecione o valor de XP:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={xpValue}
            onValueChange={(itemValue) => setXpValue(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="+10XP (Fácil)" value={10} />
            <Picker.Item label="+20XP (Médio)" value={20} />
            <Picker.Item label="+30XP (Difícil)" value={30} />
            <Picker.Item label="+50XP (Muito Difícil)" value={50} />
          </Picker>
        </View>

        {/* Entrada para a dica ou ajuda do exercício */}
        <Text style={styles.label}>Dica:</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Explicação ou fórmulas a serem utilizadas"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          onChangeText={(text) => setHint(text)}
          value={hint}
        />

        {/* Mensagem de erro, se houver, e botão para atualizar o exercício */}
        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={updateExercise}>
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
    backgroundColor: '#fff',
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
  input: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    height: 50,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  checkboxLabel: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
  },
  removeOptionButton: {
    marginLeft: 10,
  },
  removeOptionButtonText: {
    color: 'red',
    fontSize: 16,
  },
  addOptionButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addOptionButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    width: '100%',
    height: 50,
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
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});
