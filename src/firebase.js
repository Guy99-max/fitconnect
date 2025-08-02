// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYo95ZhK_B3p4gI4_o_o0jXREm-QiJypo",
  authDomain: "fitconnect-2f25f.firebaseapp.com",
  projectId: "fitconnect-2f25f",
  storageBucket: "fitconnect-2f25f.appspot.com", // ✅ מתוקן
  messagingSenderId: "298017926794",
  appId: "1:298017926794:web:ba56bc5797a0f988e9c773"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
