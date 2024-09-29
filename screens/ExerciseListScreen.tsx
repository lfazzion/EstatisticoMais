// screens/ExerciseListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Header from '../components/Header';
import { firestore } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

interface Exercise {
  id: string;
  question: string;
}

export default function ExerciseListScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'exercises'));
        const exercisesData: Exercise[] = [];
        querySnapshot.forEach(doc => {
          exercisesData.push({ id: doc.id, ...doc.data() } as Exercise);
        });
        setExercises(exercisesData);
      } catch (error) {
        console.error('Erro ao buscar exercícios:', error);
      }
    };
    fetchExercises();
  }, []);

  const renderItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity 
      style={styles.exerciseItem} 
      onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
    >
      <Text style={styles.exerciseText}>{item.question}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Exercícios Disponíveis" />
      <FlatList
        data={exercises}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 20,
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
});
