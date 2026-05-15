import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Firebase Configuration — FoxArea OTP
const firebaseConfig = {
  apiKey: "AIzaSyDIh9yTFECFBVedU4z4R439HjFkKgGEAW0",
  authDomain: "otp-website-foxarea.firebaseapp.com",
  projectId: "otp-website-foxarea",
  storageBucket: "otp-website-foxarea.firebasestorage.app",
  messagingSenderId: "653158582897",
  appId: "1:653158582897:web:516b29bee725ff66c329d0"
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)

export { app, auth }
