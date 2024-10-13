// screens/ExerciseListScreen.tsx

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Alert,
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
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ITEM_HEIGHT = 70;

interface Professor {
  uid: string;
  name: string;
}

interface Exercise {
  id: string;
  question: string;
  xpValue: number;
}

const handleFavoriteError = (error: any) => {
  console.error('Erro ao atualizar favoritos:', error);
  if (error.code === 'permission-denied') {
    Alert.alert('Erro', 'Você não tem permissão para alterar os favoritos.');
  } else if (error.message.includes('network')) {
    Alert.alert(
      'Erro de Conexão',
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    );
  } else {
    Alert.alert(
      'Erro',
      'Ocorreu um erro ao atualizar os favoritos. Por favor, tente novamente.'
    );
  }
};

interface ProfessorItemProps {
  professor: Professor;
  isFavorite: boolean;
  onSelect: (professor: Professor) => void;
  onToggleFavorite: (uid: string) => void;
}

const ProfessorItem: React.FC<ProfessorItemProps> = React.memo(
  ({ professor, isFavorite, onSelect, onToggleFavorite }) => (
    <TouchableOpacity
      style={styles.professorItem}
      onPress={() => onSelect(professor)}
      accessibilityLabel={`Selecionar professor ${professor.name}`}
      accessibilityRole="button"
    >
      <Text style={styles.professorText}>{professor.name}</Text>
      <TouchableOpacity
        onPress={() => onToggleFavorite(professor.uid)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={`Favoritar professor ${professor.name}`}
        accessibilityRole="button"
      >
        <Ionicons
          name={isFavorite ? 'star' : 'star-outline'}
          size={24}
          color={isFavorite ? 'gold' : 'black'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )
);

interface ExerciseItemProps {
  exercise: Exercise;
  isAnsweredCorrectly: boolean;
  onSelect: (exerciseId: string) => void;
}

const ExerciseItem: React.FC<ExerciseItemProps> = React.memo(
  ({ exercise, isAnsweredCorrectly, onSelect }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => onSelect(exercise.id)}
      accessibilityLabel={`Selecionar exercício ${exercise.question}`}
      accessibilityRole="button"
    >
      <Text style={styles.exerciseText}>{exercise.question}</Text>
      {isAnsweredCorrectly && <Text style={styles.xpText}>+{exercise.xpValue}XP</Text>}
    </TouchableOpacity>
  )
);

export default function ExerciseListScreen() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [favoriteProfessors, setFavoriteProfessors] = useState<string[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answeredExercises, setAnsweredExercises] = useState<string[]>([]);
  const [loadingProfessors, setLoadingProfessors] = useState<boolean>(true);
  const [loadingExercises, setLoadingExercises] = useState<boolean>(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const exercisesCache = useRef<{ [key: string]: Exercise[] }>({});

  const toggleFavorite = useCallback(async (professorUid: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(firestore, 'favorites', user.uid);

    try {
      await runTransaction(firestore, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        let updatedFavorites: string[] = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          const professors: string[] = data.professors || [];
          if (professors.includes(professorUid)) {
            updatedFavorites = professors.filter((uid) => uid !== professorUid);
          } else {
            updatedFavorites = [...professors, professorUid];
          }
        } else {
          updatedFavorites = [professorUid];
        }
        transaction.set(docRef, { professors: updatedFavorites });
      });
    } catch (error: any) {
      handleFavoriteError(error);
    }
  }, []);

  useEffect(() => {
    let unsubscribeFavorites: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const favoritesDocRef = doc(firestore, 'favorites', user.uid);
        unsubscribeFavorites = onSnapshot(
          favoritesDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setFavoriteProfessors(data.professors || []);
            } else {
              setFavoriteProfessors([]);
            }
          },
          (error) => {
            console.error('Erro ao obter favoritos:', error);
          }
        );
      } else {
        setFavoriteProfessors([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFavorites) {
        unsubscribeFavorites();
      }
    };
  }, []);

  useEffect(() => {
    setLoadingProfessors(true);
    const q = query(
      collection(firestore, 'users'),
      where('userType', '==', 'Professor'),
      where('approvalStatus', '==', 'aprovado'),
      orderBy('name', 'asc')
    );

    const unsubscribeProfessors = onSnapshot(
      q,
      (querySnapshot) => {
        const professorsData: Professor[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          professorsData.push({ uid: doc.id, name: data.name || 'Professor' });
        });
        setProfessors(professorsData);
        setLoadingProfessors(false);
      },
      (error) => {
        console.error('Erro ao buscar professores:', error);
        setLoadingProfessors(false);
        Alert.alert(
          'Erro',
          'Não foi possível carregar a lista de professores. Por favor, tente novamente mais tarde.'
        );
      }
    );

    return () => {
      unsubscribeProfessors();
    };
  }, []);

  const sortedProfessors = useMemo(() => {
    const favoriteSet = new Set(favoriteProfessors);
    return professors.slice().sort((a, b) => {
      const aIsFavorite = favoriteSet.has(a.uid);
      const bIsFavorite = favoriteSet.has(b.uid);
      if (aIsFavorite === bIsFavorite) {
        return a.name.localeCompare(b.name);
      }
      return aIsFavorite ? -1 : 1;
    });
  }, [professors, favoriteProfessors]);

  const fetchExercisesData = async (professorUid: string): Promise<Exercise[]> => {
    if (exercisesCache.current[professorUid]) {
      return exercisesCache.current[professorUid];
    }

    const q = query(
      collection(firestore, 'exercises'),
      where('createdBy', '==', professorUid),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const exercisesData = querySnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        id: doc.id,
        question: `${index + 1}. ${data.name}`,
        xpValue: data.xpValue,
      };
    });
    exercisesCache.current[professorUid] = exercisesData;
    return exercisesData;
  };

  const fetchAnsweredExercisesData = async (userUid: string): Promise<string[]> => {
    const q = query(
      collection(firestore, 'results'),
      where('userId', '==', userUid),
      where('isCorrect', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data().exerciseId);
  };

  const fetchExercises = useCallback(async () => {
    if (!selectedProfessor) return;
    setLoadingExercises(true);
    try {
      const userUid = auth.currentUser?.uid || '';
      const [exercisesData, answeredIds] = await Promise.all([
        fetchExercisesData(selectedProfessor.uid),
        fetchAnsweredExercisesData(userUid),
      ]);

      setExercises(exercisesData);
      setAnsweredExercises(answeredIds);
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar os exercícios. Por favor, tente novamente mais tarde.'
      );
    } finally {
      setLoadingExercises(false);
    }
  }, [selectedProfessor]);

  const onSelectProfessor = useCallback((professor: Professor) => {
    setSelectedProfessor(professor);
    setExercises([]);
    setAnsweredExercises([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExercises();
    }, [fetchExercises])
  );

  const renderProfessorItem = useCallback(
    ({ item }: { item: Professor }) => (
      <ProfessorItem
        professor={item}
        isFavorite={favoriteProfessors.includes(item.uid)}
        onSelect={onSelectProfessor}
        onToggleFavorite={toggleFavorite}
      />
    ),
    [favoriteProfessors, onSelectProfessor, toggleFavorite]
  );

  const renderExerciseItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseItem
        exercise={item}
        isAnsweredCorrectly={answeredExercises.includes(item.id)}
        onSelect={(exerciseId) => navigation.navigate('ExerciseDetail', { exerciseId })}
      />
    ),
    [answeredExercises, navigation]
  );

  const handleBackPress = () => {
    setSelectedProfessor(null);
  };

  if (loadingProfessors) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
        <Header title="Exercícios Disponíveis" showBackButton={false} />
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#4caf50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header
        title="Exercícios Disponíveis"
        showBackButton={selectedProfessor !== null}
        onBackPress={selectedProfessor !== null ? handleBackPress : undefined}
      />
      <View style={styles.content}>
        {!selectedProfessor ? (
          <>
            <Text style={styles.title}>Selecione um Professor:</Text>
            {sortedProfessors.length === 0 ? (
              <Text style={styles.emptyMessage}>Nenhum professor disponível no momento.</Text>
            ) : (
              <FlatList
                data={sortedProfessors}
                keyExtractor={(item) => item.uid}
                renderItem={renderProfessorItem}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                windowSize={5}
                maxToRenderPerBatch={10}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
              />
            )}
          </>
        ) : loadingExercises ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4caf50" />
          </View>
        ) : (
          <>
            <Text style={styles.title}>Exercícios de {selectedProfessor.name}:</Text>
            {exercises.length === 0 ? (
              <Text style={styles.emptyMessage}>
                Nenhum exercício disponível para este professor.
              </Text>
            ) : (
              <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                renderItem={renderExerciseItem}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                windowSize={5}
                maxToRenderPerBatch={10}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
              />
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={handleBackPress}
              accessibilityLabel="Selecionar outro professor"
              accessibilityRole="button"
            >
              <View style={styles.buttonContent}>
                <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Selecionar outro professor</Text>
              </View>
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
    fontWeight: 'bold',
    color: '#333',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
