// ProfessorExercisesScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Header from '../components/Header';
import { firestore, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

interface Exercise {
  id: string;
  question: string;
  name: string;
  createdAt: any; // Adicionei o campo createdAt
}

export default function ProfessorExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    React.useCallback(() => {
      const fetchExercises = async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            const q = query(
              collection(firestore, 'exercises'),
              where('createdBy', '==', user.uid),
              orderBy('createdAt', 'asc') // Ordena por data de criação ascendente
            );
            const querySnapshot = await getDocs(q);
            const exercisesData: Exercise[] = [];
            querySnapshot.forEach((doc) => {
              exercisesData.push({ id: doc.id, ...doc.data() } as Exercise);
            });
            setExercises(exercisesData);
          }
        } catch (error) {
          console.error('Erro ao buscar exercícios:', error);
        }
      };
      fetchExercises();
    }, [])
  );

  const deleteExercise = async (exerciseId: string) => {
    try {
      await deleteDoc(doc(firestore, 'exercises', exerciseId));
      setExercises(exercises.filter((exercise) => exercise.id !== exerciseId));
    } catch (error) {
      console.error('Erro ao deletar exercício:', error);
    }
  };

  const confirmDelete = (exerciseId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este exercício?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteExercise(exerciseId) },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item, index }: { item: Exercise; index: number }) => (
    <View style={styles.exerciseItem}>
      <Text style={styles.exerciseText}>{`${index + 1}. ${item.name || item.question}`}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditExercise', { exerciseId: item.id })}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Meus Exercícios" showBackButton />
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Remova qualquer padding ou margin top
  },
  listContent: {
    padding: 20,
    // Adicione um paddingTop para evitar sobreposição
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  exerciseItem: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  exerciseText: {
    fontSize: 16,
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
