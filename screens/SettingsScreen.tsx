// screens/SettingsScreen.tsx
// Importação de módulos e componentes necessários para o funcionamento da tela
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appJson from '../app.json';
import { ThemeContext } from '../contexts/ThemeContext';

const SettingsScreen: React.FC = (): JSX.Element => {
  // Estado para habilitar/desabilitar notificações
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  // Estado para controlar a visibilidade do modal "Sobre"
  const [aboutModalVisible, setAboutModalVisible] = useState<boolean>(false);
  // Obter o estado do tema (modo escuro/claro) e a função para alterná-lo
  const { darkModeEnabled, toggleDarkMode } = useContext(ThemeContext);
  // Obter as dimensões da janela para ajustar o layout dinamicamente
  const { height } = useWindowDimensions();

  // Obter a altura da barra de status
  const statusBarHeight = StatusBar.currentHeight || 0;

  // Carregar as preferências de notificações do armazenamento assíncrono quando o componente for montado
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Recupera a preferência de notificações armazenada localmente
        const storedNotifications = await AsyncStorage.getItem('notificationsEnabled');
        if (storedNotifications !== null) {
          setNotificationsEnabled(JSON.parse(storedNotifications));
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de notificações:', error);
      }
    };
    loadSettings();

    return () => {
      // Função de limpeza para evitar vazamentos de memória
    };
  }, []);

  // Função para alternar o estado das notificações e salvar no armazenamento assíncrono
  const toggleNotifications = async (): Promise<void> => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
    } catch (error) {
      console.error('Erro ao salvar preferências de notificações:', error);
      Alert.alert('Erro', 'Não foi possível salvar a preferência de notificações. Tente novamente.');
    }
  };

  // Função para abrir o modal "Sobre"
  const openAbout = (): void => {
    setAboutModalVisible(true);
  };

  // Função para fechar o modal "Sobre"
  const closeAbout = (): void => {
    setAboutModalVisible(false);
  };

  // Nome e versão do aplicativo a partir do arquivo app.json
  const appName = appJson.expo.name || 'Nome do Aplicativo';
  const appVersion = appJson.expo.version || '1.0';

  // Função para obter estilo condicional com base no modo escuro/claro
  const getConditionalStyle = (lightStyle: any, darkStyle: any) => {
    return darkModeEnabled ? darkStyle : lightStyle;
  };

  return (
    <SafeAreaView style={[styles.container, getConditionalStyle(styles.lightContainer, styles.darkContainer)]}>
      {/* Barra de status com cor e estilo condicional ao tema */}
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
      />
      {/* Cabeçalho da tela de configurações */}
      <Header title="Configurações" showBackButton />
      <View style={styles.content}>
        {/* Item de configuração para notificações */}
        <View style={[styles.settingItem, getConditionalStyle(styles.lightSettingItem, styles.darkSettingItem)]}>
          <Text style={[styles.settingText, getConditionalStyle(styles.lightText, styles.darkText)]}>
            Notificações
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            thumbColor={notificationsEnabled ? '#4caf50' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#a5d6a7' }}
            accessibilityLabel="Alternar notificações"
            accessibilityRole="switch"
          />
        </View>
        {/* Item de configuração para modo escuro */}
        <View style={[styles.settingItem, getConditionalStyle(styles.lightSettingItem, styles.darkSettingItem)]}>
          <Text style={[styles.settingText, getConditionalStyle(styles.lightText, styles.darkText)]}>
            Modo Escuro
          </Text>
          <Switch
            value={darkModeEnabled}
            onValueChange={toggleDarkMode}
            thumbColor={darkModeEnabled ? '#4caf50' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#a5d6a7' }}
            accessibilityLabel="Alternar modo escuro"
            accessibilityRole="switch"
          />
        </View>
        {/* Botão para abrir o modal "Sobre o Aplicativo" */}
        <TouchableOpacity
          style={styles.aboutButton}
          onPress={openAbout}
          accessibilityLabel="Sobre o Aplicativo"
          accessibilityRole="button"
        >
          <Text style={styles.aboutButtonText}>Sobre o Aplicativo</Text>
        </TouchableOpacity>
      </View>

      {/* Modal "Sobre o Aplicativo" */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={closeAbout}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, getConditionalStyle(styles.lightModal, styles.darkModal), { maxHeight: height * 0.8 }]}> {/* O modal ocupa até 80% da altura da tela */}
            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Nome do aplicativo */}
              <Text style={[styles.modalTitle, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                {appName}
              </Text>
              {/* Texto informativo sobre o objetivo do aplicativo */}
              <Text style={[styles.modalText, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                Este aplicativo foi criado com o objetivo de facilitar o aprendizado e proporcionar uma melhor
                experiência de ensino.
              </Text>
              {/* Versão do aplicativo */}
              <Text style={[styles.modalText, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                Versão: {appVersion}
              </Text>
              {/* Créditos do desenvolvimento */}
              <Text style={[styles.modalText, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                Desenvolvido por alunos do Unis
              </Text>
              {/* Direitos autorais */}
              <Text style={[styles.modalText, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                © 2024
              </Text>
            </ScrollView>
            {/* Botão para fechar o modal */}
            <Pressable
              style={[styles.closeButton, { marginTop: 30 }]}
              onPress={closeAbout}
              accessibilityLabel="Fechar"
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;

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
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  lightSettingItem: {
    backgroundColor: '#eee',
  },
  darkSettingItem: {
    backgroundColor: '#555',
  },
  settingText: {
    fontSize: 18,
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  aboutButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  aboutButtonText: {
    fontSize: 18,
    color: '#4caf50',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  lightModal: {
    backgroundColor: '#fff',
  },
  darkModal: {
    backgroundColor: '#444',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalTextLight: {
    color: '#333',
  },
  modalTextDark: {
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});