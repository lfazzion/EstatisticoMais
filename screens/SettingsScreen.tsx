// screens/SettingsScreen.tsx
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
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [aboutModalVisible, setAboutModalVisible] = useState<boolean>(false);
  const { darkModeEnabled, toggleDarkMode } = useContext(ThemeContext);
  const { height } = useWindowDimensions();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedNotifications = await AsyncStorage.getItem('notificationsEnabled');
        if (storedNotifications !== null) {
          setNotificationsEnabled(JSON.parse(storedNotifications));
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de notificações:', error);
      }
    };
    loadSettings();
  }, []);

  const toggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
    } catch (error) {
      console.error('Erro ao salvar preferências de notificações:', error);
      Alert.alert('Erro', 'Não foi possível salvar a preferência de notificações. Tente novamente.');
    }
  };

  const getConditionalStyle = (lightStyle: any, darkStyle: any) => {
    return darkModeEnabled ? darkStyle : lightStyle;
  };

  return (
    <SafeAreaView style={[styles.container, getConditionalStyle(styles.lightContainer, styles.darkContainer)]}>
      <StatusBar
        barStyle={darkModeEnabled ? 'light-content' : 'dark-content'}
        backgroundColor={darkModeEnabled ? '#000' : '#4caf50'}
      />
      <Header title="Configurações" showBackButton />
      <View style={styles.content}>
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
        <TouchableOpacity
          style={styles.aboutButton}
          onPress={() => setAboutModalVisible(true)}
          accessibilityLabel="Sobre o Aplicativo"
          accessibilityRole="button"
        >
          <Text style={styles.aboutButtonText}>Sobre o Aplicativo</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalView,
            getConditionalStyle(styles.lightModal, styles.darkModal),
            { maxHeight: height * 0.8 }
          ]}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={[styles.modalTitle, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                {appJson.expo.name}
              </Text>
              <Text style={[styles.modalText, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                Este aplicativo foi criado com o objetivo de facilitar o aprendizado e proporcionar uma melhor
                experiência de ensino.
              </Text>
              <Text style={[styles.modalText, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                Versão: {appJson.expo.version}
              </Text>
              <Text style={[styles.modalText, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                Desenvolvido por alunos do Unis
              </Text>
              <Text style={[styles.modalText, getConditionalStyle(styles.modalTextLight, styles.modalTextDark)]}>
                © 2024
              </Text>
            </ScrollView>
            <Pressable
              style={[styles.closeButton, { marginTop: 30 }]}
              onPress={() => setAboutModalVisible(false)}
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

export default SettingsScreen;