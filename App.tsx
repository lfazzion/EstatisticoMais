// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import PasswordResetScreen from './screens/PasswordResetScreen';
import AlunoHomeScreen from './screens/AlunoHomeScreen';
import ProfessorHomeScreen from './screens/ProfessorHomeScreen';

import { RootStackParamList } from './types/navigation';
import { LogBox } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

LogBox.ignoreLogs([
  '@firebase/auth: Auth',
  // Adicione outras mensagens que deseja ignorar
]);
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
        {/* Telas do Aluno */}
        <Stack.Screen 
          name="AlunoHome" 
          component={AlunoHomeScreen} 
          options={{ headerShown: false }}
        />
        {/* Telas do Professor */}
        <Stack.Screen 
          name="ProfessorHome" 
          component={ProfessorHomeScreen} 
          options={{ headerShown: false }}
        />
        {/* Adicione outras telas aqui conforme necessário */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
