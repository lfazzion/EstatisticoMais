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
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import { firestore, auth } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  const [sortedProfessors, setSortedProfessors] = useState<Professor[]>([]);
  const [favoriteProfessors, setFavoriteProfessors] = useState<string[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answeredExercises, setAnsweredExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Listener para favoritos
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const favoritesDocRef = doc(firestore, 'favorites', user.uid);
    const unsubscribeFavorites = onSnapshot(favoritesDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFavoriteProfessors(data.professors || []);
      } else {
        setFavoriteProfessors([]);
      }
    });

    return () => {
      unsubscribeFavorites();
    };
  }, []);

  // Listener para professores
  useEffect(() => {
    const q = query(
      collection(firestore, 'users'),
      where('userType', '==', 'Professor'),
      where('approvalStatus', '==', 'aprovado'),
      orderBy('name', 'asc') // Ordena alfabeticamente
    );

    const unsubscribeProfessors = onSnapshot(q, (querySnapshot) => {
      const professorsData: Professor[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        professorsData.push({ uid: doc.id, name: data.name || 'Professor' });
      });
      setProfessors(professorsData);
      setLoading(false);
    });

    return () => {
      unsubscribeProfessors();
    };
  }, []);

  // Ordenar professores favoritos e não favoritos
  useEffect(() => {
    const favoriteProfs = professors.filter((prof) => favoriteProfessors.includes(prof.uid));
    const nonFavoriteProfs = professors.filter((prof) => !favoriteProfessors.includes(prof.uid));

    setSortedProfessors([...favoriteProfs, ...nonFavoriteProfs]);
  }, [professors, favoriteProfessors]);

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
                question: `${index + 1}. ${data.name}`,
                xpValue: data.xpValue,
              });
            });
            setExercises(exercisesData);

            // Verificar quais exercícios o aluno já respondeu corretamente
            await fetchAnsweredExercises();
          } catch (error) {
            console.error('Erro ao buscar exercícios:', error);
          }
        };
        fetchExercises();
      }
    }, [selectedProfessor])
  );

  const fetchAnsweredExercises = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(firestore, 'results'),
          where('userId', '==', user.uid),
          where('isCorrect', '==', true)
        );
        const querySnapshot = await getDocs(q);
        const answeredIds = querySnapshot.docs.map((doc) => doc.data().exerciseId);
        setAnsweredExercises(answeredIds);
      }
    } catch (error) {
      console.error('Erro ao buscar exercícios respondidos:', error);
    }
  };

  const toggleFavorite = async (professorUid: string) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(firestore, 'favorites', user.uid);
        let updatedFavorites = [...favoriteProfessors];
        if (favoriteProfessors.includes(professorUid)) {
          // Remover dos favoritos
          updatedFavorites = updatedFavorites.filter((uid) => uid !== professorUid);
        } else {
          // Adicionar aos favoritos
          updatedFavorites.push(professorUid);
        }
        await setDoc(docRef, { professors: updatedFavorites });
        // Não é necessário atualizar o estado manualmente, o listener cuidará disso
      }
    } catch (error) {
      console.error('Erro ao atualizar favoritos:', error);
    }
  };

  const renderProfessorItem = ({ item }: { item: Professor }) => (
    <TouchableOpacity
      style={styles.professorItem}
      onPress={() => setSelectedProfessor(item)}
    >
      <Text style={styles.professorText}>{item.name}</Text>
      <TouchableOpacity onPress={() => toggleFavorite(item.uid)}>
        <Ionicons
          name={favoriteProfessors.includes(item.uid) ? 'star' : 'star-outline'}
          size={24}
          color={favoriteProfessors.includes(item.uid) ? 'gold' : 'black'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isAnsweredCorrectly = answeredExercises.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.exerciseItem}
        onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
      >
        <Text style={styles.exerciseText}>{item.question}</Text>
        {isAnsweredCorrectly && <Text style={styles.xpText}>+{item.xpValue}XP</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <Header title="Exercícios Disponíveis" showBackButton />
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#4caf50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Exercícios Disponíveis" showBackButton />
      <View style={styles.content}>
        {!selectedProfessor ? (
          <>
            <Text style={styles.title}>Selecione um Professor:</Text>
            <FlatList
              data={sortedProfessors}
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
  // Seus estilos existentes
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  listContent: {
    paddingBottom: 20,
  },
  professorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
