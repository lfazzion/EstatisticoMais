// screens/AddExerciseScreen.tsx
// Importação de módulos e componentes necessários para o funcionamento da tela
import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { firestore, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ProfessorDrawerParamList } from '../types/navigation';

// Constante para o valor padrão de XP a ser atribuído ao exercício
const DEFAULT_XP_VALUE = 10;

// Tipagem para a propriedade de navegação específica dessa tela
type AddExerciseNavigationProp = DrawerNavigationProp<ProfessorDrawerParamList, 'AddExercise'>;

// Componente principal da tela para adicionar exercícios
export default function AddExerciseScreen() {
  // Definição dos estados locais para controlar os campos e interações do usuário
  const [exerciseName, setExerciseName] = useState<string>(''); // Nome do exercício
  const [question, setQuestion] = useState<string>(''); // Pergunta do exercício
  const [options, setOptions] = useState<string[]>(['', '']); // Opções de resposta, inicializado com duas vazias
  const [correctOptions, setCorrectOptions] = useState<boolean[]>([false, false]); // Opções corretas, inicializado com duas falsas
  const [hint, setHint] = useState<string>(''); // Dica para o exercício
  const [error, setError] = useState<string>(''); // Mensagem de erro
  const [loading, setLoading] = useState<boolean>(false); // Estado de carregamento
  const [xpValue, setXpValue] = useState<number>(DEFAULT_XP_VALUE); // Valor de XP associado ao exercício

  // Obtenção do objeto de navegação para redirecionamento
  const navigation = useNavigation<AddExerciseNavigationProp>();

  // Função para atualizar o texto de uma opção específica, com base no índice
  const handleOptionChange = (index: number, text: string) => {
    setOptions((prevOptions) => {
      const newOptions = [...prevOptions];
      newOptions[index] = text;
      return newOptions;
    });
  };

  // Função para adicionar uma nova opção de resposta, limitando a cinco opções
  const addOption = () => {
    if (options.length >= 5) {
      Alert.alert('Limite atingido', 'Você só pode adicionar até 5 opções.');
      return;
    }
    setOptions([...options, '']);
    setCorrectOptions([...correctOptions, false]);
  };

  // Função para remover uma opção de resposta, mantendo pelo menos duas opções
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

  // Função para adicionar o exercício ao banco de dados
  const addExercise = async () => {
    // Filtra opções em branco e alinha com as opções corretas
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

    // Validações dos campos obrigatórios antes de enviar os dados
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

    // Define o estado de carregamento e começa o processo de adição
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Usuário não autenticado. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      // Adiciona o exercício no Firestore
      await addDoc(collection(firestore, 'exercises'), {
        name: exerciseName.trim(),
        question: question.trim(),
        options: filteredOptions,
        correctOptions: filteredCorrectOptions,
        xpValue,
        hint: hint.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      // Mensagem de sucesso e redirecionamento
      Alert.alert('Sucesso', 'Exercício adicionado com sucesso.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ProfessorExercises'),
        },
      ]);
      // Limpa os campos do formulário
      setExerciseName('');
      setQuestion('');
      setOptions(['', '']);
      setCorrectOptions([false, false]);
      setHint('');
      setXpValue(DEFAULT_XP_VALUE);
      setError('');
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error);
      setError('Ocorreu um erro ao adicionar o exercício. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Retorna a estrutura da interface da tela
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Adicionar Exercício" showBackButton />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Entrada de texto para o nome do exercício */}
        <Text style={styles.label}>Nome do Exercício:</Text>
        <TextInput
          style={[styles.input, { height: 50 }]}
          placeholder="Digite o nome do exercício"
          placeholderTextColor="#aaa"
          onChangeText={(text) => setExerciseName(text)}
          value={exerciseName}
          editable={!loading}
        />

        {/* Entrada de texto para a pergunta do exercício */}
        <Text style={styles.label}>Pergunta:</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Digite a pergunta"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          onChangeText={(text) => setQuestion(text)}
          value={question}
          editable={!loading}
        />

        {/* Opções de resposta, podendo adicionar e remover */}
        <Text style={styles.label}>Opções (Mínimo 2):</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <TextInput
              style={styles.optionInput}
              placeholder={`Opção ${index + 1}`}
              placeholderTextColor="#aaa"
              onChangeText={(text) => handleOptionChange(index, text)}
              value={option}
              editable={!loading}
            />
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={correctOptions[index]}
                onValueChange={(newValue) => {
                  const newCorrectOptions = [...correctOptions];
                  newCorrectOptions[index] = newValue;
                  setCorrectOptions(newCorrectOptions);
                }}
                disabled={loading}
              />
              <Text style={styles.checkboxLabel}>Correta</Text>
            </View>
            {options.length > 2 && (
              <TouchableOpacity
                onPress={() => removeOption(index)}
                disabled={loading}
                style={styles.removeOptionButton}
              >
                <Text style={styles.removeOptionButtonText}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {/* Botão para adicionar mais uma opção */}
        <TouchableOpacity
          onPress={addOption}
          disabled={loading}
          style={styles.addOptionButton}
        >
          <Text style={styles.addOptionButtonText}>Adicionar Opção</Text>
        </TouchableOpacity>

        {/* Seletor para o valor de XP do exercício */}
        <Text style={styles.label}>Selecione o valor de XP:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={xpValue}
            onValueChange={(itemValue) => setXpValue(itemValue)}
            style={styles.picker}
            enabled={!loading}
          >
            <Picker.Item label="+10XP (Fácil)" value={10} />
            <Picker.Item label="+20XP (Médio)" value={20} />
            <Picker.Item label="+30XP (Difícil)" value={30} />
            <Picker.Item label="+50XP (Muito Difícil)" value={50} />
          </Picker>
        </View>

        {/* Entrada de texto para a dica do exercício */}
        <Text style={styles.label}>Dica:</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Explicação ou fórmulas a serem utilizadas"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          onChangeText={(text) => setHint(text)}
          value={hint}
          editable={!loading}
        />

        {/* Exibição de mensagens de erro ou um indicador de carregamento */}
        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
        {loading ? (
          <ActivityIndicator size="large" color="#4caf50" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={addExercise}>
            <Text style={styles.buttonText}>Salvar Exercício</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos da tela
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
