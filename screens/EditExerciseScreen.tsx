// screens/EditExerciseScreen.tsx

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
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Picker } from '@react-native-picker/picker';

type EditExerciseRouteProp = RouteProp<RootStackParamList, 'EditExercise'>;

export default function EditExerciseScreen() {
  const route = useRoute<EditExerciseRouteProp>();
  const { exerciseId } = route.params;

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [xpValue, setXpValue] = useState(10);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(firestore, 'exercises', exerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setQuestion(data.question);
          setOptions(data.options);
          setCorrectOption(data.correctOption);
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
    if (
      question === '' ||
      options.some((option) => option === '') ||
      correctOption === null
    ) {
      setError('Por favor, preencha todos os campos e selecione a opção correta.');
      return;
    }

    try {
      const exerciseRef = doc(firestore, 'exercises', exerciseId);
      await updateDoc(exerciseRef, {
        question,
        options,
        correctOption,
        xpValue,
      });
      Alert.alert('Sucesso', 'Exercício atualizado com sucesso.');
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
        <Text style={styles.label}>Pergunta:</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite a pergunta"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          onChangeText={(text) => setQuestion(text)}
          value={question}
        />
        <Text style={styles.label}>Opções:</Text>
        {options.map((option, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={`Opção ${index + 1}`}
            placeholderTextColor="#aaa"
            onChangeText={(text) => {
              const newOptions = [...options];
              newOptions[index] = text;
              setOptions(newOptions);
            }}
            value={option}
          />
        ))}
        <Text style={styles.label}>Selecione a opção correta:</Text>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              correctOption === index && styles.selectedOption,
            ]}
            onPress={() => setCorrectOption(index)}
          >
            <Text style={styles.optionText}>{`Opção ${index + 1}: ${option}`}</Text>
          </TouchableOpacity>
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
    height: 50,
  },
  optionButton: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#c8e6c9',
  },
  optionText: {
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
