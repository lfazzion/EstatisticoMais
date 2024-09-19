// TeacherScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { firebase } from '../firebaseConfig';

export default function TeacherScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const addExercise = () => {
    firebase.firestore().collection('exercises').add({
      question,
      answer,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      alert('Exercício adicionado com sucesso!');
      setQuestion('');
      setAnswer('');
    })
    .catch(error => alert(error.message));
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Pergunta"
        onChangeText={text => setQuestion(text)}
        value={question}
      />
      <TextInput
        style={styles.input}
        placeholder="Resposta"
        onChangeText={text => setAnswer(text)}
        value={answer}
      />
      <Button title="Adicionar Exercício" onPress={addExercise} />
    </View>
  );
}

const styles = StyleSheet.create({
  // estilos aqui
});
