import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDdUK6B_o2amzkuxZpkvIy1rjTLIakEi_o",
    authDomain: "helperhub-c77cc.firebaseapp.com",
    projectId: "helperhub-c77cc",
    storageBucket: "helperhub-c77cc.firebasestorage.app",
    messagingSenderId: "137448240850",
    appId: "1:137448240850:web:25bcc86a97ff8da8d09f0b",
    measurementId: "G-CJTT7HTJ61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Realtime Database
const database = getDatabase(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, database, storage };