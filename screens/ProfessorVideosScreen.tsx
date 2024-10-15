// screens/ProfessorVideosScreen.tsx

import React, { useState, useCallback, useContext } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import { firestore, auth } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemeContext } from '../contexts/ThemeContext';

interface Video {
  id: string;
  title: string;
  url: string;
  createdAt: Timestamp;
}

const ProfessorVideosScreen: React.FC = (): JSX.Element => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { darkModeEnabled } = useContext(ThemeContext);

  useFocusEffect(
    useCallback(() => {
      const fetchVideos = async () => {
        setLoading(true);
        try {
          const user = auth.currentUser;
          if (user) {
            const q = query(
              collection(firestore, 'videos'),
              where('createdBy', '==', user.uid),
              orderBy('createdAt', 'asc')
            );
            const querySnapshot = await getDocs(q);
            const videosData: Video[] = querySnapshot.docs
              .map((docSnap) => {
                const data = docSnap.data();
                if (data.createdAt) {
                  return { id: docSnap.id, ...data } as Video;
                } else {
                  console.warn(`Vídeo com ID ${docSnap.id} está faltando o campo 'createdAt'.`);
                  return null;
                }
              })
              .filter((video): video is Video => video !== null);
            setVideos(videosData);
          }
        } catch (error) {
          console.error('Erro ao buscar vídeos:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchVideos();
    }, [])
  );

  const deleteVideo = async (videoId: string) => {
    setDeletingVideoId(videoId);
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = (attempt: number) => Math.pow(2, attempt) * 1000;

    while (retryCount < maxRetries) {
      try {
        await deleteDoc(doc(firestore, 'videos', videoId));
        setVideos((prevVideos) =>
          prevVideos.filter((video) => video.id !== videoId)
        );
        setDeletingVideoId(null);
        return;
      } catch (error: any) {
        retryCount++;
        if (error.code === 'permission-denied') {
          Alert.alert('Erro', 'Você não tem permissão para deletar este vídeo.');
          break;
        } else if (error.message.includes('network')) {
          if (retryCount >= maxRetries) {
            Alert.alert(
              'Erro de Conexão',
              'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
            );
            break;
          } else {
            await new Promise((resolve) => setTimeout(resolve, retryDelay(retryCount)));
          }
        } else {
          Alert.alert(
            'Erro',
            'Ocorreu um erro ao deletar o vídeo. Por favor, tente novamente.'
          );
          break;
        }
        console.error('Erro ao deletar vídeo:', error);
      } finally {
        setDeletingVideoId(null);
      }
    }
  };

  const confirmDelete = (videoId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este vídeo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteVideo(videoId),
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Video; index: number }) => (
      <TouchableOpacity
        style={[
          styles.videoItem,
          darkModeEnabled ? styles.darkVideoItem : styles.lightVideoItem,
        ]}
        onPress={() => navigation.navigate('EditVideo', { videoId: item.id })}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={[
              styles.videoText,
              darkModeEnabled ? styles.darkText : styles.lightText,
            ]}
          >
            {`${index + 1}. ${item.title}`}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item.id)}
            disabled={deletingVideoId === item.id}
          >
            {deletingVideoId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Excluir</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [navigation, deletingVideoId, darkModeEnabled]
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        darkModeEnabled ? styles.darkContainer : styles.lightContainer,
      ]}
    >
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
      />
      <Header title="Meus Vídeos" showBackButton />
      {loading ? (
        <ActivityIndicator
          size="large"
          color={darkModeEnabled ? '#fff' : '#4caf50'}
          style={styles.loadingIndicator}
        />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text
              style={[
                styles.emptyText,
                darkModeEnabled ? styles.darkText : styles.lightText,
              ]}
            >
              Nenhum vídeo encontrado.
            </Text>
          }
        />
      )}
      <TouchableOpacity
        style={[
          styles.addButton,
          darkModeEnabled ? styles.darkAddButton : styles.lightAddButton,
        ]}
        onPress={() => navigation.navigate('AddVideo')}
        accessibilityLabel="Adicionar Vídeo"
        accessibilityRole="button"
      >
        <Text style={styles.addButtonText}>Adicionar Vídeo</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ProfessorVideosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#333',
  },
  listContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
    flexGrow: 1,
  },
  videoItem: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  lightVideoItem: {
    backgroundColor: '#eee',
  },
  darkVideoItem: {
    backgroundColor: '#555',
  },
  videoText: {
    fontSize: 16,
    flex: 1,
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 10,
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  addButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  lightAddButton: {
    backgroundColor: '#4caf50',
  },
  darkAddButton: {
    backgroundColor: '#006400',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
