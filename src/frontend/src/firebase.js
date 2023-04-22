import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJOvUe8EMewvjuNiFRlac6kFd1Renlbbc",
  authDomain: "sum-up-d220d.firebaseapp.com",
  projectId: "sum-up-d220d",
  storageBucket: "sum-up-d220d.appspot.com",
  messagingSenderId: "344753210850",
  appId: "1:344753210850:web:664c0ff969f70275cbe5bb",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth();

const database = getDatabase();
const dataRef = ref(database, `audioText`);

export { app, auth, dataRef, get, db };
