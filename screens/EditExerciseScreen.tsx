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
} from 'react-native';
import Header from '../components/Header';
import { firestore } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import Checkbox from 'expo-checkbox'; // Usando expo-checkbox para os checkboxes

type EditExerciseRouteProp = RouteProp<RootStackParamList, 'EditExercise'>;
type EditExerciseNavigationProp = StackNavigationProp<RootStackParamList, 'EditExercise'>;

export default function EditExerciseScreen() {
  const route = useRoute<EditExerciseRouteProp>();
  const navigation = useNavigation<EditExerciseNavigationProp>();
  const { exerciseId } = route.params;

  const [exerciseName, setExerciseName] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '', '']);
  const [correctOptions, setCorrectOptions] = useState<boolean[]>([false, false, false, false, false]);
  const [hint, setHint] = useState('');
  const [xpValue, setXpValue] = useState(10);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(firestore, 'exercises', exerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExerciseName(data.name || '');
          setQuestion(data.question || '');
          const fetchedOptions = data.options || [''];
          const fetchedCorrectOptions = data.correctOptions || [false];
          // Preencher arrays até 5 elementos
          setOptions([...fetchedOptions, '', '', '', ''].slice(0, 5));
          setCorrectOptions([...fetchedCorrectOptions, false, false, false, false].slice(0, 5));
          setHint(data.hint || '');
          setXpValue(data.xpValue || 10);
        } else {
          console.error('Exercício não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar exercício:', error);
      }
    };
    fetchExercise();
  }, [exerciseId]);

  const updateExercise = async () => {
    // Filtrar opções em branco
    const filteredOptions = options.filter((option) => option.trim() !== '');
    const filteredCorrectOptions = correctOptions.slice(0, filteredOptions.length);

    if (
      exerciseName.trim() === '' ||
      question.trim() === '' ||
      filteredOptions.length < 2 ||
      !filteredCorrectOptions.includes(true)
    ) {
      setError('Por favor, preencha todos os campos e selecione pelo menos uma opção correta.');
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
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
      setError('Ocorreu um erro ao atualizar o exercício. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Editar Exercício" showBackButton />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nome do Exercício:</Text>
        <TextInput
          style={[styles.input, { height: 50 }]}
          placeholder="Digite o nome do exercício"
          placeholderTextColor="#aaa"
          onChangeText={(text) => setExerciseName(text)}
          value={exerciseName}
        />

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

        <Text style={styles.label}>Opções(Mínimo 2):</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <TextInput
              style={styles.optionInput}
              placeholder={`Opção ${index + 1}`}
              placeholderTextColor="#aaa"
              onChangeText={(text) => {
                const newOptions = [...options];
                newOptions[index] = text;
                setOptions(newOptions);
              }}
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
          </View>
        ))}

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

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={updateExercise}>
          <Text style={styles.buttonText}>Atualizar Exercício</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Utilize os mesmos estilos do AddExerciseScreen
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Remova qualquer padding ou margin top
  },
  content: {
    padding: 20,
    // Adicione um paddingTop para evitar sobreposição
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
    // height ajustável
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
