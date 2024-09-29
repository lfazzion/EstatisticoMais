// App.tsx

import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
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

import { RootStackParamList, AlunoDrawerParamList, ProfessorDrawerParamList } from './types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function AlunoDrawer() {
  return (
    <Drawer.Navigator 
      initialRouteName="AlunoHome"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }} // Adicione esta linha
    >
      <Drawer.Screen name="AlunoHome" component={AlunoHomeScreen} options={{ title: 'Início' }} />
      <Drawer.Screen name="ExerciseList" component={ExerciseListScreen} options={{ title: 'Exercícios' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      {/* Adicione outras telas para o aluno */}
    </Drawer.Navigator>
  );
}

function ProfessorDrawer() {
  return (
    <Drawer.Navigator 
      initialRouteName="ProfessorHome"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }} // Adicione esta linha
    >
      <Drawer.Screen name="ProfessorHome" component={ProfessorHomeScreen} options={{ title: 'Início' }} />
      <Drawer.Screen name="AddExercise" component={AddExerciseScreen} options={{ title: 'Adicionar Exercício' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      {/* Adicione outras telas para o professor */}
    </Drawer.Navigator>
  );
}

// Tipamos o parâmetro 'props' com DrawerContentComponentProps
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Navegar de volta para a tela de login
        props.navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      })
      .catch(error => {
        console.error('Erro ao sair:', error);
      });
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Sair"
        onPress={handleLogout}
      />
    </DrawerContentScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Telas de Autenticação */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PasswordReset" 
          component={PasswordResetScreen} 
          options={{ headerShown: false }}
        />
        {/* Navegação Principal */}
        <Stack.Screen 
          name="AlunoDrawer" 
          component={AlunoDrawer} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ProfessorDrawer" 
          component={ProfessorDrawer} 
          options={{ headerShown: false }}
        />
        {/* Tela de Detalhes do Exercício */}
        <Stack.Screen 
          name="ExerciseDetail" 
          component={ExerciseDetailScreen} 
          options={{ headerShown: false }}
        />
        {/* Adicione outras telas aqui conforme necessário */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
