// App.tsx

import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import PasswordResetScreen from './screens/PasswordResetScreen';
import AlunoHomeScreen from './screens/AlunoHomeScreen';
import ProfessorHomeScreen from './screens/ProfessorHomeScreen';
import AddExerciseScreen from './screens/AddExerciseScreen';
import ExerciseListScreen from './screens/ExerciseListScreen';
import ExerciseDetailScreen from './screens/ExerciseDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import GamesScreen from './screens/GamesScreen';
import ReadingMaterialsScreen from './screens/ReadingMaterialsScreen';
import ProfessorExercisesScreen from './screens/ProfessorExercisesScreen';
import EditExerciseScreen from './screens/EditExerciseScreen';
import HintScreen from './screens/HintScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfessorVideosScreen from './screens/ProfessorVideosScreen';
import AddVideoScreen from './screens/AddVideoScreen';
import EditVideoScreen from './screens/EditVideoScreen';
import AlunoVideosScreen from './screens/AlunoVideosScreen'; // Importação da nova tela
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';

import { RootStackParamList, AlunoDrawerParamList, ProfessorDrawerParamList } from './types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function AlunoDrawerNavigator() {
  const { darkModeEnabled } = useContext(ThemeContext);

  return (
    <Drawer.Navigator
      initialRouteName="AlunoHome"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: darkModeEnabled ? '#333' : '#fff',
        },
        drawerActiveTintColor: darkModeEnabled ? '#fff' : '#000',
        drawerInactiveTintColor: darkModeEnabled ? '#ccc' : '#888',
      }}
    >
      <Drawer.Screen
        name="AlunoHome"
        component={AlunoHomeScreen}
        options={{
          title: 'Início',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{
          title: 'Exercícios',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="AlunoVideos" // Nome da nova rota
        component={AlunoVideosScreen}
        options={{
          title: 'Vídeos',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="videocam" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configurações',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
      {/* Adicione outras telas para o aluno */}
    </Drawer.Navigator>
  );
}

function ProfessorDrawerNavigator() {
  const { darkModeEnabled } = useContext(ThemeContext);

  return (
    <Drawer.Navigator
      initialRouteName="ProfessorHome"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: darkModeEnabled ? '#333' : '#fff',
        },
        drawerActiveTintColor: darkModeEnabled ? '#fff' : '#000',
        drawerInactiveTintColor: darkModeEnabled ? '#ccc' : '#888',
      }}
    >
      <Drawer.Screen
        name="ProfessorHome"
        component={ProfessorHomeScreen}
        options={{
          title: 'Início',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="AddExercise"
        component={AddExerciseScreen}
        options={{
          title: 'Adicionar Exercício',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="add" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="ProfessorExercises"
        component={ProfessorExercisesScreen}
        options={{
          title: 'Meus Exercícios',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="clipboard" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="ProfessorVideos"
        component={ProfessorVideosScreen}
        options={{
          title: 'Meus Vídeos',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="videocam" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="ReadingMaterials"
        component={ReadingMaterialsScreen}
        options={{
          title: 'Materiais de Leitura',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="book" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="AlunoStatistics"
        component={GamesScreen} // Substitua por uma tela de estatísticas real, se disponível
        options={{
          title: 'Estatísticas dos Alunos',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configurações',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
      {/* Adicione outras telas para o professor */}
    </Drawer.Navigator>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { darkModeEnabled } = useContext(ThemeContext);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        props.navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      })
      .catch((error) => {
        console.error('Erro ao sair:', error);
        Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
      });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1 }}
      style={{ backgroundColor: darkModeEnabled ? '#333' : '#fff' }}
    >
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <DrawerItemList {...props} />
        </View>
        <View style={{ padding: 15 }}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              darkModeEnabled ? styles.darkLogoutButton : styles.lightLogoutButton,
            ]}
            accessibilityLabel="Sair do aplicativo"
            accessibilityRole="button"
          >
            <Ionicons name="exit" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
  },
  lightLogoutButton: {
    backgroundColor: '#f44336',
  },
  darkLogoutButton: {
    backgroundColor: '#b71c1c',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Telas de Autenticação */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} options={{ headerShown: false }} />
          {/* Navegação Principal */}
          <Stack.Screen name="AlunoDrawer" component={AlunoDrawerNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="ProfessorDrawer" component={ProfessorDrawerNavigator} options={{ headerShown: false }} />
          {/* Outras Telas */}
          <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Hint" component={HintScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Games" component={GamesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ProfessorVideos" component={ProfessorVideosScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="ReadingMaterials"
            component={ReadingMaterialsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfessorExercises"
            component={ProfessorExercisesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="EditExercise" component={EditExerciseScreen} options={{ headerShown: false }} />
          {/* Adicionando telas de vídeo */}
          <Stack.Screen name="AddVideo" component={AddVideoScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditVideo" component={EditVideoScreen} options={{ headerShown: false }} />
          {/* REMOVA ESTA LINHA PARA EVITAR DUPLICAÇÃO */}
          {/* <Stack.Screen name="AlunoVideos" component={AlunoVideosScreen} options={{ headerShown: false }} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
