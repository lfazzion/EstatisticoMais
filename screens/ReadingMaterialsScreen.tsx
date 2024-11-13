// screens/ReadingMaterialsScreen.tsx

import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Header from '../components/Header';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { ThemeContext } from '../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Pdf from 'react-native-pdf';

interface ReadingMaterial {
  id: string;
  title: string;
  asset: any; // Tipo genérico, pode ser refinado conforme necessário
  uri?: string; // Tornado opcional
}

export default function ReadingMaterialsScreen() {
  const [materials, setMaterials] = useState<ReadingMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMaterial, setSelectedMaterial] = useState<ReadingMaterial | null>(null);
  const { darkModeEnabled } = useContext(ThemeContext);

  // Defina seus materiais de leitura aqui
  const readingMaterials: ReadingMaterial[] = [
    {
      id: '1',
      title: 'Introdução à Estatística',
      asset: require('../assets/pdfs/estatistica.pdf'),
    },
    // Adicione mais materiais conforme necessário
  ];

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const materialsWithUri = await Promise.all(
          readingMaterials.map(async (material) => {
            const asset = Asset.fromModule(material.asset);
            await asset.downloadAsync(); // Garante que o asset esteja disponível localmente

            const fileUri = `${FileSystem.documentDirectory}${material.id}.pdf`;

            // Verifica se o arquivo já foi copiado para evitar cópias repetidas
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            console.log(`Arquivo existe para ${material.title}:`, fileInfo.exists);
            if (!fileInfo.exists) {
              await FileSystem.copyAsync({
                from: asset.localUri || asset.uri,
                to: fileUri,
              });
            }

            // Normaliza a URI para garantir que comece com 'file://'
            const normalizedUri = fileUri.startsWith('file://') ? fileUri : `file://${fileUri}`;
            console.log(`URI do PDF para ${material.title}:`, normalizedUri);

            return { ...material, uri: normalizedUri };
          })
        );

        setMaterials(materialsWithUri);
      } catch (error) {
        console.error('Erro ao carregar materiais de leitura:', error);
        Alert.alert('Erro', 'Não foi possível carregar os materiais de leitura.');
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, []);

  const renderItem = ({ item }: { item: ReadingMaterial }) => (
    <TouchableOpacity
      style={[styles.itemContainer, darkModeEnabled ? styles.darkItem : styles.lightItem]}
      onPress={() => {
        if (item.uri) {
          setSelectedMaterial(item);
        } else {
          Alert.alert('Erro', 'Arquivo PDF não disponível.');
        }
      }}
      accessibilityLabel={`Abrir material de leitura ${item.title}`}
      accessibilityRole="button"
    >
      <Ionicons
        name="document-text"
        size={24}
        color={darkModeEnabled ? '#fff' : '#000'}
        style={{ marginRight: 10 }}
      />
      <Text style={[styles.itemText, darkModeEnabled ? styles.darkText : styles.lightText]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const handleBackToList = () => {
    setSelectedMaterial(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, darkModeEnabled ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar
          barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
          backgroundColor={darkModeEnabled ? '#333' : '#4caf50'}
        />
        <Header title="Materiais de Leitura" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={[styles.loadingText, darkModeEnabled ? styles.darkText : styles.lightText]}>
            Carregando materiais de leitura...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkModeEnabled ? styles.darkContainer : styles.lightContainer]}>
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#333' : '#4caf50'}
      />
      <Header title="Materiais de Leitura" showBackButton={selectedMaterial !== null} onBackPress={handleBackToList} />
      {selectedMaterial && selectedMaterial.uri ? (
        <View style={styles.pdfContainer}>
          <Pdf
            source={{ uri: selectedMaterial.uri, cache: true }}
            style={styles.pdf}
            onError={(error) => {
              console.error('Erro ao carregar PDF:', error);
              Alert.alert('Erro', 'Não foi possível carregar o PDF.');
              setSelectedMaterial(null);
            }}
            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`Número de páginas: ${numberOfPages}`);
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Página ${page} de ${numberOfPages}`);
            }}
            enablePaging={true}
            // Adicione outras propriedades conforme necessário
          />
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={[styles.emptyText, darkModeEnabled ? styles.darkText : styles.lightText]}>
              Nenhum material de leitura disponível no momento.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  lightItem: {
    backgroundColor: '#eee',
  },
  darkItem: {
    backgroundColor: '#1e1e1e',
  },
  itemText: {
    fontSize: 16,
  },
  lightText: {
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
  },
});