// screens/AddExerciseScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Header from '../components/Header';
import { firestore } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddExerciseScreen() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [error, setError] = useState('');

  const addExercise = async () => {
    if (question === '' || options.some(option => option === '') || correctOption === null) {
      setError('Por favor, preencha todos os campos e selecione a opção correta.');
      return;
    }

    try {
      await addDoc(collection(firestore, 'exercises'), {
        question: question,
        options: options,
        correctOption: correctOption,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Sucesso', 'Exercício adicionado com sucesso.');
      // Limpar campos
      setQuestion('');
      setOptions(['', '', '', '']);
      setCorrectOption(null);
      setError('');
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error);
      setError('Ocorreu um erro ao adicionar o exercício. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Adicionar Exercício" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Pergunta:</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite a pergunta"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          onChangeText={text => setQuestion(text)}
          value={question}
        />
        <Text style={styles.label}>Opções:</Text>
        {options.map((option, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={`Opção ${index + 1}`}
            placeholderTextColor="#aaa"
            onChangeText={text => {
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
        {error !== '' && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={addExercise}>
          <Text style={styles.buttonText}>Salvar Exercício</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
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
