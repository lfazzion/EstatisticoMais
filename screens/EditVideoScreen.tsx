// screens/EditVideoScreen.tsx

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, DrawerActions } from '@react-navigation/native';
import Header from '../components/Header';
import { firestore } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { RootStackParamList, ProfessorDrawerParamList } from '../types/navigation';
import { ThemeContext } from '../contexts/ThemeContext';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Picker } from '@react-native-picker/picker';

interface ErrorState {
  title?: string;
  url?: string;
  general?: string;
}

type EditVideoRouteProp = RouteProp<RootStackParamList, 'EditVideo'>;
type EditVideoNavigationProp = DrawerNavigationProp<ProfessorDrawerParamList, 'ProfessorVideos'>;

export default function EditVideoScreen() {
  const route = useRoute<EditVideoRouteProp>();
  const navigation = useNavigation<EditVideoNavigationProp>();
  const { videoId } = route.params;

  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoLink, setVideoLink] = useState<string>(''); // URL do vídeo
  const [summary, setSummary] = useState<string>(''); // Sumário ou transcrição do vídeo
  const [error, setError] = useState<ErrorState>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false); // Estado de atualização
  const [xpValue, setXpValue] = useState<number>(10); // Valor de XP associado ao vídeo

  const { darkModeEnabled } = useContext(ThemeContext);

  // Função para validar URLs
  const isValidURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const docRef = doc(firestore, 'videos', videoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVideoTitle(data.title || '');
          setVideoLink(data.url || '');
          setSummary(data.summary || '');
          setXpValue(data.xpValue || 10);
        } else {
          console.error('Vídeo não encontrado');
          setError({ general: 'Vídeo não encontrado. Por favor, tente novamente.' });
        }
      } catch (error) {
        console.error('Erro ao buscar vídeo:', error);
        setError({ general: 'Erro ao buscar vídeo. Verifique sua conexão e tente novamente.' });
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId]);

  const updateVideo = useCallback(async () => {
    // Resetar erros
    setError({});

    // Validações
    let valid = true;
    const newError: ErrorState = {};

    if (videoTitle.trim() === '') {
      newError.title = 'Por favor, insira o título do vídeo.';
      valid = false;
    }

    if (videoLink.trim() === '') {
      newError.url = 'Por favor, insira a URL do vídeo.';
      valid = false;
    } else if (!isValidURL(videoLink.trim())) {
      newError.url = 'Por favor, insira uma URL válida.';
      valid = false;
    }

    // Limite de caracteres para summary
    if (summary.trim().length > 5000) { // Atualizado para 5000 caracteres
      newError.general = 'O sumário não pode exceder 5000 caracteres.';
      valid = false;
    }

    if (!valid) {
      setError(newError);
      return;
    }

    setUpdating(true);
    try {
      const videoRef = doc(firestore, 'videos', videoId);
      await updateDoc(videoRef, {
        title: videoTitle.trim(),
        url: videoLink.trim(),
        summary: summary.trim(),
        xpValue,
      });

      // Desfocar o teclado
      Keyboard.dismiss();

      Alert.alert('Sucesso', 'Vídeo atualizado com sucesso.', [
        {
          text: 'OK',
          onPress: () => navigation.dispatch(DrawerActions.jumpTo('ProfessorVideos')),
        },
      ]);

      setError({});
    } catch (error) {
      console.error('Erro ao atualizar vídeo:', error);
      setError({ general: 'Ocorreu um erro ao atualizar o vídeo. Tente novamente.' });
    } finally {
      setUpdating(false);
    }
  }, [videoTitle, videoLink, summary, xpValue, videoId, navigation]);

  const getConditionalStyle = (lightStyle: any, darkStyle: any) => {
    return darkModeEnabled ? darkStyle : lightStyle;
  };

  // Memoizar estilos dinâmicos para evitar recomputações desnecessárias
  const pickerItemStyle = useMemo(() => ({
    color: darkModeEnabled ? '#fff' : '#333',
    fontSize: 16,
  }), [darkModeEnabled]);

  const pickerColor = darkModeEnabled ? '#fff' : '#333';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, getConditionalStyle(styles.lightContainer, styles.darkContainer)]}>
        <StatusBar
          barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
          backgroundColor={darkModeEnabled ? '#333' : '#4caf50'}
        />
        <Header title="Editar Vídeo" showBackButton />
        <ActivityIndicator size="large" color={darkModeEnabled ? '#fff' : '#4caf50'} style={styles.loadingIndicator} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, getConditionalStyle(styles.lightContainer, styles.darkContainer)]}>
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#333' : '#4caf50'}
      />
      <Header title="Editar Vídeo" showBackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Entrada de texto para o título do vídeo */}
          <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>Título do Vídeo:</Text>
          <TextInput
            style={[
              styles.input,
              getConditionalStyle(styles.lightInput, styles.darkInput),
              error.title ? styles.inputError : null,
            ]}
            placeholder="Digite o título do vídeo"
            placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
            onChangeText={(text) => setVideoTitle(text)}
            value={videoTitle}
            editable={!updating}
            accessibilityLabel="Campo para inserir o título do vídeo"
            // Nenhuma restrição adicional necessária para suportar caracteres em português
          />
          {error.title && <Text style={styles.errorText}>{error.title}</Text>}

          {/* Entrada de texto para a URL do vídeo */}
          <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>URL do Vídeo:</Text>
          <TextInput
            style={[
              styles.input,
              getConditionalStyle(styles.lightInput, styles.darkInput),
              error.url ? styles.inputError : null,
            ]}
            placeholder="Digite a URL do vídeo"
            placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
            onChangeText={(text) => setVideoLink(text)}
            value={videoLink}
            editable={!updating}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            accessibilityLabel="Campo para inserir a URL do vídeo"
          />
          {error.url && <Text style={styles.errorText}>{error.url}</Text>}

          {/* Seletor para o valor de XP do vídeo */}
          <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>Defina o XP:</Text>
          <View
            style={[
              styles.pickerContainer,
              getConditionalStyle(styles.lightPickerContainer, styles.darkPickerContainer),
            ]}
          >
            <Picker
              key={darkModeEnabled ? 'dark' : 'light'} // Força re-renderização ao mudar o tema
              selectedValue={xpValue}
              onValueChange={(itemValue) => setXpValue(itemValue)}
              style={[
                styles.picker,
                { color: pickerColor }, // Ajuste da cor do texto para combinar com o tema
              ]}
              dropdownIconColor={darkModeEnabled ? '#fff' : '#333'}
              enabled={!updating}
              itemStyle={pickerItemStyle} // Definindo a cor diretamente para cada item
            >
              <Picker.Item label="+10XP (Fácil)" value={10} />
              <Picker.Item label="+20XP (Médio)" value={20} />
              <Picker.Item label="+30XP (Difícil)" value={30} />
              <Picker.Item label="+50XP (Muito Difícil)" value={50} />
            </Picker>
          </View>

          {/* Entrada de texto para o sumário do vídeo */}
          <Text style={[styles.label, getConditionalStyle(styles.lightText, styles.darkText)]}>Sumário ou Transcrição:</Text>
          <TextInput
            style={[
              styles.input,
              getConditionalStyle(styles.lightInput, styles.darkInput),
              styles.textArea,
            ]}
            placeholder="Digite um resumo ou a transcrição do vídeo"
            placeholderTextColor={darkModeEnabled ? '#aaa' : '#666'}
            multiline
            numberOfLines={6}
            onChangeText={(text) => setSummary(text)}
            value={summary}
            editable={!updating}
            accessibilityLabel="Campo para inserir o sumário ou transcrição do vídeo"
            // Nenhuma restrição adicional necessária para suportar caracteres em português
          />

          {/* Exibição de mensagens de erro ou um indicador de carregamento */}
          {error.general && (
            <Text style={[styles.errorText, getConditionalStyle(styles.lightErrorText, styles.darkErrorText)]}>
              {error.general}
            </Text>
          )}
          {updating ? (
            <ActivityIndicator size="large" color={darkModeEnabled ? '#fff' : '#4caf50'} />
          ) : (
            <TouchableOpacity
              style={[styles.button, getConditionalStyle(styles.lightButton, styles.darkButton)]}
              onPress={updateVideo}
              accessibilityLabel="Salvar Alterações do Vídeo"
              accessibilityRole="button"
              accessibilityHint="Atualiza o vídeo com as novas informações fornecidas"
            >
              <Text style={styles.buttonText}>Salvar Alterações</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  label: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    height: 50,
    // Removido borderWidth e borderColor para eliminar a borda
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top', // Para Android, alinha o texto no topo
    paddingVertical: 10,
  },
  lightInput: {
    backgroundColor: '#eee',
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#555',
    color: '#fff',
  },
  inputError: {
    // Opcional: adicionar algum estilo para indicar erro sem borda, como fundo vermelho claro
    backgroundColor: '#ffe6e6',
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  lightButton: {
    backgroundColor: '#4caf50',
  },
  darkButton: {
    backgroundColor: '#006400',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    marginBottom: 10,
  },
  lightErrorText: {
    color: 'red',
  },
  darkErrorText: {
    color: '#ff6666',
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 15,
    height: 50, // Consistência com os outros campos de entrada
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  lightPickerContainer: {
    backgroundColor: '#eee',
  },
  darkPickerContainer: {
    backgroundColor: '#555',
  },
  picker: {
    width: '100%',
    justifyContent: 'center',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});