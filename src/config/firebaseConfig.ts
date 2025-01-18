// firebaseConfig.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// Define the type for the Firebase configuration object
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Ensure process.env variables are typed correctly
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_PUBLIC_FIREBASE_APP_ID as string,
};

// Optional check to ensure that all required variables are defined
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error("Firebase configuration is missing required environment variables.");
}

// Initialize Firebase app and authentication
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

export { auth };
