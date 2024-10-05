// App.tsx

import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

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
import VideosScreen from './screens/VideosScreen';
import ReadingMaterialsScreen from './screens/ReadingMaterialsScreen';
import ProfessorExercisesScreen from './screens/ProfessorExercisesScreen';
import EditExerciseScreen from './screens/EditExerciseScreen';
import HintScreen from './screens/HintScreen';
import SettingsScreen from './screens/SettingsScreen'; // Importação da SettingsScreen

import { RootStackParamList } from './types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function AlunoDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="AlunoHome"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="AlunoHome" component={AlunoHomeScreen} options={{ title: 'Início' }} />
      <Drawer.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{ title: 'Exercícios' }}
      />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
      {/* Adicione outras telas para o aluno */}
    </Drawer.Navigator>
  );
}

function ProfessorDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="ProfessorHome"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen
        name="ProfessorHome"
        component={ProfessorHomeScreen}
        options={{ title: 'Início' }}
      />
      <Drawer.Screen
        name="AddExercise"
        component={AddExerciseScreen}
        options={{ title: 'Adicionar Exercício' }}
      />
      <Drawer.Screen
        name="ProfessorExercises"
        component={ProfessorExercisesScreen}
        options={{ title: 'Meus Exercícios' }}
      />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
      {/* Adicione outras telas para o professor */}
    </Drawer.Navigator>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
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
      });
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem label="Sair" onPress={handleLogout} />
    </DrawerContentScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Telas de Autenticação */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="PasswordReset"
          component={PasswordResetScreen}
          options={{ headerShown: false }}
        />
        {/* Navegação Principal */}
        <Stack.Screen name="AlunoDrawer" component={AlunoDrawer} options={{ headerShown: false }} />
        <Stack.Screen
          name="ProfessorDrawer"
          component={ProfessorDrawer}
          options={{ headerShown: false }}
        />
        {/* Outras Telas */}
        <Stack.Screen
          name="ExerciseDetail"
          component={ExerciseDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Hint" component={HintScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Games" component={GamesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Videos" component={VideosScreen} options={{ headerShown: false }} />
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
        <Stack.Screen
          name="EditExercise"
          component={EditExerciseScreen}
          options={{ headerShown: false }}
        />
        {/* Adicione outras telas aqui conforme necessário */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
