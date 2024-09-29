// firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCCDV_3EG58Vk7Mh3xabSOs_9T2HbNeVpo",
  authDomain: "estatisticomais.firebaseapp.com",
  projectId: "estatisticomais",
  storageBucket: "estatisticomais.appspot.com",
  messagingSenderId: "961686939761",
  appId: "1:961686939761:web:418ecbfa22ad34ffdb53d0"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Auth com persistência usando AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Inicializa o Firestore
const firestore = getFirestore(app);

export { app, auth, firestore };
