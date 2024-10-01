// screens/ExerciseListScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Header from '../components/Header';
import { firestore, auth } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

interface Professor {
  uid: string;
  name: string;
}

interface Exercise {
  id: string;
  question: string;
  xpValue: number;
}

export default function ExerciseListScreen() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const q = query(
          collection(firestore, 'users'),
          where('userType', '==', 'Professor'),
          where('approvalStatus', '==', 'aprovado')
        );
        const querySnapshot = await getDocs(q);
        const professorsData: Professor[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          professorsData.push({ uid: doc.id, name: data.name || 'Professor' });
        });
        setProfessors(professorsData);
      } catch (error) {
        console.error('Erro ao buscar professores:', error);
      }
    };
    fetchProfessors();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedProfessor) {
        const fetchExercises = async () => {
          try {
            const q = query(
              collection(firestore, 'exercises'),
              where('createdBy', '==', selectedProfessor.uid),
              orderBy('createdAt', 'asc')
            );
            const querySnapshot = await getDocs(q);
            const exercisesData: Exercise[] = [];
            querySnapshot.docs.forEach((doc, index) => {
              const data = doc.data();
              exercisesData.push({
                id: doc.id,
                question: `${index + 1}. ${data.name || 'Exercício Sem Nome'}`, // Adiciona a numeração
                xpValue: data.xpValue || 10,
              });
            });
            setExercises(exercisesData);

            // Verificar quais exercícios o aluno já completou
            await checkCompletedExercises();
          } catch (error) {
            console.error('Erro ao buscar exercícios:', error);
          }
        };
        fetchExercises();
      }
    }, [selectedProfessor])
  );

  const checkCompletedExercises = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(firestore, 'results'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const completedIds = querySnapshot.docs.map((doc) => doc.data().exerciseId);
        setCompletedExercises(completedIds);
      }
    } catch (error) {
      console.error('Erro ao verificar exercícios concluídos:', error);
    }
  };

  const renderProfessorItem = ({ item }: { item: Professor }) => (
    <TouchableOpacity
      style={styles.professorItem}
      onPress={() => setSelectedProfessor(item)}
    >
      <Text style={styles.professorText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isCompleted = completedExercises.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.exerciseItem}
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
      >
        <Text style={styles.exerciseText}>{item.question}</Text>
        {isCompleted && <Text style={styles.xpText}>+{item.xpValue}XP</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Exercícios Disponíveis" showBackButton />
      <View style={styles.content}>
        {!selectedProfessor ? (
          <>
            <Text style={styles.title}>Selecione um Professor:</Text>
            <FlatList
              data={professors}
              keyExtractor={(item) => item.uid}
              renderItem={renderProfessorItem}
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <>
            <Text style={styles.title}>Exercícios de {selectedProfessor.name}:</Text>
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              renderItem={renderExerciseItem}
              contentContainerStyle={styles.listContent}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => setSelectedProfessor(null)}
            >
              <Text style={styles.buttonText}>Selecionar outro professor</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Remova qualquer padding ou margin top
  },
  content: {
    flex: 1,
    padding: 20,
    // Adicione um paddingTop para evitar sobreposição
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  listContent: {
    paddingBottom: 20,
  },
  professorItem: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  professorText: {
    fontSize: 16,
    color: '#333',
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  exerciseText: {
    fontSize: 16,
    color: '#333',
  },
  xpText: {
    fontSize: 16,
    color: 'green',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});
