import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpL2DhKpnafPfMmtqGz_XGc6vmeEbVyUw",
  authDomain: "mediplan-errami.firebaseapp.com",
  projectId: "mediplan-errami",
  storageBucket: "mediplan-errami.firebasestorage.app",
  messagingSenderId: "907435036127",
  appId: "1:907435036127:web:3cf644bfb9907a3c56886a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);