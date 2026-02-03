//This code was provided by the Firebase website

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc,
  onSnapshot, updateDoc, query, orderBy, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
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

async function upsertUserDocument(user) {
  const userRef = doc(db, "users", user.uid);

  console.log("upsertUserDocument() for UID:", user.uid);

  try {
    await setDoc(
      userRef,
      {
        isAnonymous: user.isAnonymous ?? true,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }  //do not overwrite existing data
    );
    console.log("user doc written/updated for:", user.uid);
  } catch (err) {
    console.error("Error writing user doc:", err);
  }
}

console.log("Firebase initialized");

export let currentUser = null; 

export function ensureUser() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          currentUser = user;
          console.log("User signed in:", user.uid);

          await upsertUserDocument(user); 
          resolve(user);
        } else {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          console.log("Signed in anonymously:", cred.user.uid);

          await upsertUserDocument(cred.user);
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

//helper to get a subcollection under the current user
export function userCollection(subpath) {
  if (!currentUser) {
    throw new Error("No currentUser yet, wait for userReady first.");
  }
  //tasks", "meds", "reminders", "foodLogs"
  return collection(db, "users", currentUser.uid, subpath);
}
//helper for sharing
export function collectionForUser(uid, subpath) {
  return collection(db, "users", uid, subpath);
}
export {
  db,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  onAuthStateChanged,
  signInAnonymously,
  EmailAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  setDoc
};
