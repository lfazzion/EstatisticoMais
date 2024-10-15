// screens/AlunoVideosScreen.tsx

import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { firestore, auth } from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Video, ResizeMode } from 'expo-av'; // Importando ResizeMode
import { ThemeContext } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

interface VideoItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  xpValue: number;
  createdAt: Date;
}

type AlunoVideosNavigationProp = StackNavigationProp<RootStackParamList, 'AlunoVideos'>;

export default function AlunoVideosScreen() {
  const navigation = useNavigation<AlunoVideosNavigationProp>();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { darkModeEnabled } = useContext(ThemeContext);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  // Função para buscar vídeos do Firestore
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(firestore, 'videos'),
        where('url', '!=', ''),
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Função para abrir o modal de reprodução de vídeo
  const openVideoModal = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsModalVisible(true);
  };

  // Função para fechar o modal de reprodução de vídeo
  const closeVideoModal = () => {
    setIsModalVisible(false);
    setSelectedVideo(null);
  };

  const renderVideoItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <TouchableOpacity
        style={[styles.videoItem, getConditionalStyle(styles.lightVideoItem, styles.darkVideoItem)]}
        onPress={() => openVideoModal(item)}
        accessibilityLabel={`Assistir vídeo ${item.title}`}
        accessibilityRole="button"
      >
        <View style={styles.videoInfo}>
          <Ionicons name="videocam" size={24} color="#4caf50" style={{ marginRight: 10 }} />
          <Text style={[styles.videoTitle, getConditionalStyle(styles.lightText, styles.darkText)]}>
            {item.title}
          </Text>
        </View>
        <Ionicons name="play-circle-outline" size={30} color="#4caf50" />
      </TouchableOpacity>
    ),
    []
  );

  const keyExtractor = useCallback((item: VideoItem) => item.id, []);

  const getConditionalStyle = (lightStyle: any, darkStyle: any) => {
    return darkModeEnabled ? darkStyle : lightStyle;
  };

  return (
    <SafeAreaView style={[styles.container, getConditionalStyle(styles.lightContainer, styles.darkContainer)]}>
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#333' : '#4caf50'}
      />
      <Header title="Vídeos" showBackButton={false} />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#4caf50" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : videos.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum vídeo disponível no momento.</Text>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={keyExtractor}
            renderItem={renderVideoItem}
            contentContainerStyle={styles.listContent}
            initialNumToRender={10}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
          />
        )}
      </View>

      {/* Modal para reprodução de vídeo */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeVideoModal}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, getConditionalStyle(styles.lightModal, styles.darkModal)]}>
            <TouchableOpacity onPress={closeVideoModal} style={styles.closeButton} accessibilityLabel="Fechar vídeo" accessibilityRole="button">
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {selectedVideo && (
              <Video
                source={{ uri: selectedVideo.url }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode={ResizeMode.CONTAIN} // Usando o enum ResizeMode
                shouldPlay
                useNativeControls
                style={styles.videoPlayer}
              />
            )}
            {selectedVideo && (
              <Text style={[styles.videoSummary, getConditionalStyle(styles.lightText, styles.darkText)]}>
                {selectedVideo.summary}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  content: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  videoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eee',
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
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  videoSummary: {
    marginTop: 10,
    fontSize: 14,
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  lightModal: {
    backgroundColor: '#4caf50',
  },
  darkModal: {
    backgroundColor: '#006400',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  darkText: {
    color: '#fff',
  },
  lightText: {
    color: '#333',
  },
});
