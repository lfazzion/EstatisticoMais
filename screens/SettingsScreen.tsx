// screens/SettingsScreen.tsx

import React, { useState } from 'react';
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
} from 'react-native';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import appJson from '../app.json'; // Ajuste o caminho conforme necessário

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    // Salvar a preferência de notificações no AsyncStorage ou enviar para o backend
    await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
  };

  const toggleDarkMode = async () => {
    const newValue = !darkModeEnabled;
    setDarkModeEnabled(newValue);
    // Salvar a preferência de modo escuro no AsyncStorage ou enviar para o backend
    await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(newValue));
    // Implementar a lógica para aplicar o modo escuro em todo o app
  };

  const openAbout = () => {
    const appName = appJson.expo.name || 'Nome do Aplicativo';
    const appVersion = appJson.expo.version || '1.0';
    const aboutMessage = `${appName}\nVersão ${appVersion}\nDesenvolvido por alunos do Unis\n© 2024`;
    Alert.alert('Sobre', aboutMessage, [{ text: 'OK' }], { cancelable: true });
  };  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4caf50" />
      <Header title="Configurações" showBackButton />
      <View style={styles.content}>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Notificações</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            thumbColor={notificationsEnabled ? '#4caf50' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#a5d6a7' }}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Modo Escuro</Text>
          <Switch
            value={darkModeEnabled}
            onValueChange={toggleDarkMode}
            thumbColor={darkModeEnabled ? '#4caf50' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#a5d6a7' }}
          />
        </View>
        <TouchableOpacity style={styles.aboutButton} onPress={openAbout}>
          <Text style={styles.aboutButtonText}>Sobre o Aplicativo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    // Adicione um paddingTop para evitar sobreposição
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  settingText: {
    fontSize: 18,
    color: '#333',
  },
  aboutButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  aboutButtonText: {
    fontSize: 18,
    color: '#4caf50',
  },
});
