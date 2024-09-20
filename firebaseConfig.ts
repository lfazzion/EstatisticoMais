// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCDV_3EG58Vk7Mh3xabSOs_9T2HbNeVpo",
  authDomain: "estatisticomais.firebaseapp.com",
  projectId: "estatisticomais",
  storageBucket: "estatisticomais.appspot.com",
  messagingSenderId: "961686939761",
  appId: "1:961686939761:web:418ecbfa22ad34ffdb53d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };