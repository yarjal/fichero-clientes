// ============================================================
//  PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE
//  La obtienes en: Firebase Console → ⚙️ Configuración del
//  proyecto → tus apps → "SDK setup and configuration"
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAL_1KgUhVKMDaa7R1SOOIbqp2Nf1czHo",
  authDomain: "luiguies-2f628.firebaseapp.com",
  projectId: "luiguies-2f628",
  storageBucket: "luiguies-2f628.firebasestorage.app",
  messagingSenderId: "362296915404",
  appId: "1:362296915404:web:78874f2afc20f36b2d1969",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
