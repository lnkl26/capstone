//This code was provided by the Firebase website

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc,
  onSnapshot, updateDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously, EmailAuthProvider, 
  linkWithCredential, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAB4egUudllw5ZMuLxO49sCd76PH-Pa80M",
  authDomain: "capstone-i-55cd7.firebaseapp.com",
  projectId: "capstone-i-55cd7",
  storageBucket: "capstone-i-55cd7.firebasestorage.app",
  messagingSenderId: "554997803293",
  appId: "1:554997803293:web:3a24b5c97d0147c0b259f4",
  measurementId: "G-E1EKC65E5J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

//The rest is not from firebase lol

console.log("Firebase initialized");

export let currentUser = null; 

export function ensureUser() {
//promises a user id before allowing saving
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          //already signed in (could be anon or username/PIN)
          currentUser = user;
          console.log("User signed in:", user.uid);
          resolve(user);
        } else {
          //sign in anonymously
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          console.log("Signed in anonymously:", cred.user.uid);
          resolve(cred.user);
        }
      } catch (err) {
        console.error("Error ensuring user:", err);
        reject(err);
      }
    });
  });
}

export const userReady = ensureUser();

export {
  db, collection, addDoc, deleteDoc, doc,
  onSnapshot, updateDoc, query, orderBy, serverTimestamp,   onAuthStateChanged,
  signInAnonymously, EmailAuthProvider, linkWithCredential, signInWithEmailAndPassword,
};
