// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyBo1fCidF3cW_ge2J8d1hAetwI2Z84Rs5s",

  authDomain: "cnbf-3ba9e.firebaseapp.com",

  projectId: "cnbf-3ba9e",

  storageBucket: "cnbf-3ba9e.appspot.com",

  messagingSenderId: "334954577666",

  appId: "1:334954577666:web:a78bcace6b445b05df4c1b"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db}