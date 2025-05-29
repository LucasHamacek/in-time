import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if Firebase credentials are provided
const hasFirebaseCredentials = import.meta.env.VITE_FIREBASE_API_KEY && 
                                import.meta.env.VITE_FIREBASE_PROJECT_ID && 
                                import.meta.env.VITE_FIREBASE_APP_ID;

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (hasFirebaseCredentials) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Mock objects for development without Firebase
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
export default app;
