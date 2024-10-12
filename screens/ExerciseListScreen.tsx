// screens/ExerciseListScreen.tsx
// Importações necessárias
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
  setDoc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Constante para a altura dos itens no FlatList
const ITEM_HEIGHT = 70; // Ajuste conforme necessário

// Interfaces definindo o formato dos dados
interface Professor {
  uid: string; // Identificador único do professor
  name: string; // Nome do professor
}

interface Exercise {
  id: string; // Identificador único do exercício
  question: string; // Texto da questão do exercício
  xpValue: number; // Valor de XP atribuído ao exercício
}

// Função auxiliar para tratar erros ao atualizar favoritos
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

// Componente ProfessorItem memorizado para otimização
interface ProfessorItemProps {
  professor: Professor; // Dados do professor
  isFavorite: boolean; // Indicador se o professor é favorito
  onSelect: (professor: Professor) => void; // Função ao selecionar o professor
  onToggleFavorite: (uid: string) => void; // Função para alternar o favorito
}

const ProfessorItem: React.FC<ProfessorItemProps> = React.memo(
  ({ professor, isFavorite, onSelect, onToggleFavorite }) => (
    <TouchableOpacity
      style={styles.professorItem}
      onPress={() => onSelect(professor)} // Seleciona o professor
      accessibilityLabel={`Selecionar professor ${professor.name}`}
      accessibilityRole="button"
    >
      <Text style={styles.professorText}>{professor.name}</Text>
      <TouchableOpacity
        onPress={() => onToggleFavorite(professor.uid)} // Alterna o favorito do professor
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Área de clique expandida
        accessibilityLabel={`Favoritar professor ${professor.name}`}
        accessibilityRole="button"
      >
        <Ionicons
          name={isFavorite ? 'star' : 'star-outline'} // Ícone de estrela (favorito)
          size={24}
          color={isFavorite ? 'gold' : 'black'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  )
);

// Componente ExerciseItem memorizado para otimização
interface ExerciseItemProps {
  exercise: Exercise; // Dados do exercício
  isAnsweredCorrectly: boolean; // Indicador se o exercício foi respondido corretamente
  onSelect: (exerciseId: string) => void; // Função ao selecionar o exercício
}

const ExerciseItem: React.FC<ExerciseItemProps> = React.memo(
  ({ exercise, isAnsweredCorrectly, onSelect }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => onSelect(exercise.id)} // Seleciona o exercício
      accessibilityLabel={`Selecionar exercício ${exercise.question}`}
      accessibilityRole="button"
    >
      <Text style={styles.exerciseText}>{exercise.question}</Text>
      {isAnsweredCorrectly && <Text style={styles.xpText}>+{exercise.xpValue}XP</Text>} {/* Exibe o XP se respondido corretamente */}
    </TouchableOpacity>
  )
);

// Componente principal da tela de lista de exercícios
export default function ExerciseListScreen() {
  const [professors, setProfessors] = useState<Professor[]>([]); // Estado para armazenar a lista de professores
  const [favoriteProfessors, setFavoriteProfessors] = useState<string[]>([]); // Estado para armazenar os professores favoritos
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null); // Estado para armazenar o professor selecionado
  const [exercises, setExercises] = useState<Exercise[]>([]); // Estado para armazenar a lista de exercícios
  const [answeredExercises, setAnsweredExercises] = useState<string[]>([]); // Estado para armazenar os exercícios respondidos corretamente
  const [loadingProfessors, setLoadingProfessors] = useState<boolean>(true); // Estado de carregamento dos professores
  const [loadingExercises, setLoadingExercises] = useState<boolean>(false); // Estado de carregamento dos exercícios
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>(); // Obter a navegação

  const exercisesCache = useRef<{ [key: string]: Exercise[] }>({}); // Cache para armazenar exercícios já carregados

  // Função para alternar favorito
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
            // Remover dos favoritos
            updatedFavorites = professors.filter((uid) => uid !== professorUid);
          } else {
            // Adicionar aos favoritos
            updatedFavorites = [...professors, professorUid];
          }
        } else {
          // Documento não existe, adicionar o professor como favorito
          updatedFavorites = [professorUid];
        }
        transaction.set(docRef, { professors: updatedFavorites });
      });
    } catch (error: any) {
      handleFavoriteError(error); // Tratar erro ao alternar favoritos
    }
  }, []);

  // useEffect para gerenciar favoritos
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
              setFavoriteProfessors(data.professors || []); // Atualiza os favoritos
            } else {
              setFavoriteProfessors([]); // Nenhum favorito encontrado
            }
          },
          (error) => {
            console.error('Erro ao obter favoritos:', error);
          }
        );
      } else {
        setFavoriteProfessors([]); // Limpa os favoritos se o usuário sair
      }
    });

    return () => {
      unsubscribeAuth(); // Desinscreve do listener de autenticação
      if (unsubscribeFavorites) {
        unsubscribeFavorites(); // Desinscreve do listener de favoritos
      }
    };
  }, []);

  // Listener para professores
  useEffect(() => {
    setLoadingProfessors(true); // Inicia o carregamento dos professores
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
        setProfessors(professorsData); // Atualiza a lista de professores
        setLoadingProfessors(false); // Conclui o carregamento
      },
      (error) => {
        console.error('Erro ao buscar professores:', error);
        setLoadingProfessors(false); // Conclui o carregamento mesmo em caso de erro
        Alert.alert(
          'Erro',
          'Não foi possível carregar a lista de professores. Por favor, tente novamente mais tarde.'
        );
      }
    );

    return () => {
      unsubscribeProfessors(); // Desinscreve do listener de professores
    };
  }, []);

  // Memoização de sortedProfessors
  const sortedProfessors = useMemo(() => {
    const favoriteSet = new Set(favoriteProfessors); // Conjunto de professores favoritos
    return professors.slice().sort((a, b) => {
      const aIsFavorite = favoriteSet.has(a.uid);
      const bIsFavorite = favoriteSet.has(b.uid);
      if (aIsFavorite === bIsFavorite) {
        return a.name.localeCompare(b.name); // Ordena alfabeticamente se ambos forem ou não favoritos
      }
      return aIsFavorite ? -1 : 1; // Favoritos vêm primeiro
    });
  }, [professors, favoriteProfessors]);

  // Funções para buscar dados
  const fetchExercisesData = async (professorUid: string): Promise<Exercise[]> => {
    if (exercisesCache.current[professorUid]) {
      return exercisesCache.current[professorUid]; // Retorna os exercícios do cache se disponíveis
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
        question: `${index + 1}. ${data.name}`, // Formata a questão do exercício
        xpValue: data.xpValue,
      };
    });
    exercisesCache.current[professorUid] = exercisesData; // Armazena no cache
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

  // Função ao selecionar um professor
  const onSelectProfessor = useCallback((professor: Professor) => {
    setSelectedProfessor(professor);
    setExercises([]);
    setAnsweredExercises([]);
  }, []);

  // useFocusEffect para carregar exercícios ao focar na tela
  useFocusEffect(
    useCallback(() => {
      fetchExercises();
    }, [fetchExercises])
  );

  // Funções memoizadas de renderização
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

  // Renderização condicional baseada nos estados de carregamento
  if (loadingProfessors) {
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

  // Renderização principal do componente
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Exercícios Disponíveis" showBackButton />
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
          <ActivityIndicator size="large" color="#4caf50" />
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
              onPress={() => setSelectedProfessor(null)}
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

// Estilos do componente
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
});
