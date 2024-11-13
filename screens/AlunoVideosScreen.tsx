// screens/AlunoVideosScreen.tsx

import React, { useEffect, useState, useContext, useCallback } from 'react';
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
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { firestore } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../contexts/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import YoutubePlayer from 'react-native-youtube-iframe';

interface VideoItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  xpValue: number;
  createdAt: Date;
}

interface Professor {
  uid: string;
  name: string;
}

type AlunoVideosNavigationProp = StackNavigationProp<RootStackParamList, 'AlunoVideos'>;

export default function AlunoVideosScreen() {
  const navigation = useNavigation<AlunoVideosNavigationProp>();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingProfessors, setLoadingProfessors] = useState<boolean>(true);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { darkModeEnabled } = useContext(ThemeContext);

  // Estados para o Modal de Vídeo
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentVideoSummary, setCurrentVideoSummary] = useState<string>(''); // Novo estado para o sumário

  // Função para buscar professores
  const fetchProfessors = useCallback(async () => {
    setLoadingProfessors(true);
    try {
      const q = query(
        collection(firestore, 'users'),
        where('userType', '==', 'Professor'),
        where('approvalStatus', '==', 'aprovado'),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const professorsData: Professor[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        professorsData.push({ uid: doc.id, name: data.name || 'Professor' });
      });
      setProfessors(professorsData);
    } catch (err) {
      console.error('Erro ao buscar professores:', err);
      setError('Não foi possível carregar os professores. Tente novamente mais tarde.');
      Alert.alert('Erro', 'Não foi possível carregar os professores. Tente novamente mais tarde.');
    } finally {
      setLoadingProfessors(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  // Função para buscar vídeos do professor selecionado
  const fetchVideos = useCallback(async () => {
    if (!selectedProfessor) return;
    setLoadingVideos(true);
    try {
      const q = query(
        collection(firestore, 'videos'),
        where('createdBy', '==', selectedProfessor.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const videosData: VideoItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        videosData.push({
          id: doc.id,
          title: data.title || 'Sem Título',
          url: data.url || '',
          summary: data.summary || '',
          xpValue: data.xpValue || 10,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      setVideos(videosData);
    } catch (err) {
      console.error('Erro ao buscar vídeos:', err);
      setError('Não foi possível carregar os vídeos. Tente novamente mais tarde.');
      Alert.alert('Erro', 'Não foi possível carregar os vídeos. Tente novamente mais tarde.');
    } finally {
      setLoadingVideos(false);
    }
  }, [selectedProfessor]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Função para extrair o ID do vídeo do YouTube
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:\?v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (match && match[1]) {
      console.log('Video ID extraído:', match[1]);
      return match[1];
    } else if (url.length === 11) {
      // Se o usuário inseriu apenas o ID do vídeo
      console.log('Video ID é o próprio URL:', url);
      return url;
    } else {
      console.log('Falha ao extrair o Video ID da URL:', url);
      return null;
    }
  };

  // Função para abrir o vídeo no Modal
  const openVideo = (url: string, summary: string) => {
    const videoId = extractVideoId(url);
    if (videoId) {
      setCurrentVideoId(videoId);
      setCurrentVideoSummary(summary); // Define o sumário atual
      setIsModalVisible(true);
    } else {
      Alert.alert('Erro', 'URL do vídeo inválida.');
    }
  };

  const renderProfessorItem = useCallback(
    ({ item }: { item: Professor }) => (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => setSelectedProfessor(item)}
        accessibilityLabel={`Selecionar professor ${item.name}`}
        accessibilityRole="button"
      >
        <Text style={styles.itemText}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={24} color="#4caf50" />
      </TouchableOpacity>
    ),
    []
  );

  const renderVideoItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => openVideo(item.url, item.summary)} // Passa o sumário ao abrir
        accessibilityLabel={`Assistir vídeo ${item.title}`}
        accessibilityRole="button"
      >
        <View style={styles.videoInfo}>
          <Ionicons name="videocam" size={24} color="#4caf50" style={{ marginRight: 10 }} />
          <Text style={styles.itemText}>{item.title}</Text>
        </View>
        <Ionicons name="play-circle-outline" size={30} color="#4caf50" />
      </TouchableOpacity>
    ),
    []
  );

  const keyExtractorProfessor = useCallback((item: Professor) => item.uid, []);
  const keyExtractorVideo = useCallback((item: VideoItem) => item.id, []);

  const getStyles = () => {
    return darkModeEnabled ? darkStyles : lightStyles;
  };

  const styles = getStyles();

  const handleBackPress = () => {
    if (selectedProfessor) {
      setSelectedProfessor(null);
      setVideos([]);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#333' : '#4caf50'}
      />
      <Header
        title={selectedProfessor ? 'Vídeos' : 'Professores'}
        showBackButton={true}
        onBackPress={handleBackPress}
      />
      <View style={styles.content}>
        {loadingProfessors || loadingVideos ? (
          <ActivityIndicator size="large" color="#4caf50" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : selectedProfessor ? (
          videos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum vídeo disponível para este professor.</Text>
          ) : (
            <FlatList
              data={videos}
              keyExtractor={keyExtractorVideo}
              renderItem={renderVideoItem}
              contentContainerStyle={styles.listContent}
              initialNumToRender={10}
              windowSize={5}
              maxToRenderPerBatch={10}
              removeClippedSubviews={true}
            />
          )
        ) : professors.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum professor disponível no momento.</Text>
        ) : (
          <FlatList
            data={professors}
            keyExtractor={keyExtractorProfessor}
            renderItem={renderProfessorItem}
            contentContainerStyle={styles.listContent}
            initialNumToRender={10}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
          />
        )}
      </View>

      {/* Modal para exibir o vídeo */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
              accessibilityLabel="Fechar vídeo"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            {currentVideoId ? (
              <>
                <YoutubePlayer
                  height={Dimensions.get('window').width * (9 / 16)} // 16:9 Aspect Ratio
                  width={Dimensions.get('window').width - 40}
                  play={true}
                  videoId={currentVideoId}
                  forceAndroidAutoplay={false}
                  webViewStyle={{ opacity: 0.99 }}
                />
                {currentVideoSummary ? (
                  <ScrollView style={styles.modalSummaryContainer}>
                    <Text style={styles.modalSummaryText}>
                      {currentVideoSummary}
                    </Text>
                  </ScrollView>
                ) : null}
              </>
            ) : (
              <ActivityIndicator size="large" color="#4caf50" />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Definição de estilos separados para temas claro e escuro
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    maxHeight: '90%',
    width: '95%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalSummaryContainer: {
    marginTop: 10,
    width: '100%',
  },
  modalSummaryText: {
    fontSize: 14,
    color: '#fff',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#555',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ccc',
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    maxHeight: '90%',
    width: '95%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalSummaryContainer: {
    marginTop: 10,
    width: '100%',
  },
  modalSummaryText: {
    fontSize: 14,
    color: '#fff',
  },
});
