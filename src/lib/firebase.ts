import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged, 
  User, 
  Auth 
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Firestore,
  FirestoreError 
} from "firebase/firestore";
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import firebaseConfigData from "../../firebase-applet-config.json";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  let firebaseConfig = firebaseConfigData as any;

  const configElement = document.getElementById("firebase-config");
  if (configElement && configElement.textContent) {
    try {
      firebaseConfig = JSON.parse(configElement.textContent);
    } catch (_) {}
  }

  if (firebaseConfig && firebaseConfig.apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Configure Firestore with long-polling auto-detection for reliable connectivity in web/iframe environments
    const firestoreSettings = {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true
    };

    try {
      db = firebaseConfig.firestoreDatabaseId 
        ? initializeFirestore(app, firestoreSettings, firebaseConfig.firestoreDatabaseId)
        : initializeFirestore(app, firestoreSettings);
    } catch {
      db = firebaseConfig.firestoreDatabaseId 
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
    }

    storage = getStorage(app);
  }
} catch (e) {
  console.log("Firebase initialized in pending mode until configuration is provided by user.");
}

export { app, auth, db, storage };

export interface FirestoreErrorInfo {
  error: string;
  code?: string;
}

export async function isFirebaseConnected(): Promise<boolean> {
  return auth !== null && db !== null;
}

export async function loginAdminWithFirebase(email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!auth) {
    return { 
      success: false, 
      error: "Firebase कनेक्ट नहीं है। कृपया Firebase प्रोजेक्ट कॉन्फ़िगर करें।" 
    };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, user: cred.user };
  } catch (err: any) {
    return { 
      success: false, 
      error: err.message || "प्रमाणीकरण विफल रहा (Authentication Failed)।" 
    };
  }
}

export async function loginWithGoogleFirebase(): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!auth) {
    return { 
      success: false, 
      error: "Firebase कनेक्टिविटी उपलब्ध नहीं है। कृपया ईमेल और पासवर्ड से लॉगइन करें।" 
    };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    return { success: true, user: cred.user };
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return { success: false, error: "गूगल लॉगइन रद्द कर दिया गया।" };
    }
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/unauthorized-domain' || err.message?.includes('invalid')) {
      return {
        success: false,
        error: "गूगल साइन-इन इस परिवेश में प्रतिबंधित है। कृपया ईमेल एवं एडमिन पासवर्ड से लॉगइन करें।"
      };
    }
    return { 
      success: false, 
      error: err.message || "गूगल प्रमाणीकरण विफल रहा। कृपया ईमेल एवं पासवर्ड से लॉगइन करें।" 
    };
  }
}

export async function logoutAdmin(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function uploadFileToFirebaseStorage(file: File, folder: string = "uploads"): Promise<string | null> {
  if (storage) {
    try {
      const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const storageRef = ref(storage, `${folder}/${cleanFileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (downloadUrl) return downloadUrl;
    } catch (err) {
      console.warn("Firebase Storage upload error, using Data URL fallback:", err);
    }
  }

  // Instant fallback to Base64 Data URL so upload NEVER fails even without cloud bucket credentials
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

