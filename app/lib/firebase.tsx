// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAB-WbFZTQ8bfHA3W44Q9ithgDGWos1jss",
  authDomain: "quietshelter-b5f54.firebaseapp.com",
  projectId: "quietshelter-b5f54",
  storageBucket: "quietshelter-b5f54.firebasestorage.app",
  messagingSenderId: "964395764892",
  appId: "1:964395764892:web:a1f680a6a0c25c4608f159",
  measurementId: "G-PX8FHES7GD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);