import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
  firebaseLoginId?: string;
  firebaseLoginPassword?: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyAdY_yl7OHRNvV21m4ZD7uGQrpzBpFtxzM",
  authDomain: "wide-outlook-1lkqp.firebaseapp.com",
  projectId: "wide-outlook-1lkqp",
  storageBucket: "wide-outlook-1lkqp.firebasestorage.app",
  messagingSenderId: "540989836249",
  appId: "1:540989836249:web:658e56a2eddc0ceeca67c8",
  firestoreDatabaseId: "ai-studio-c6a902aa-23ea-409f-9faf-10ef12ab271f",
  firebaseLoginId: "aiman.creamy.creations@gmail.com",
  firebaseLoginPassword: "aiman@999"
};

let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;

export function getFirebaseConfig(): FirebaseConfig | null {
  const cached = localStorage.getItem('acc_firebase_config');
  if (!cached) {
    // Return default hardcoded config as fallback if not set in localstorage
    return DEFAULT_FIREBASE_CONFIG;
  }
  try {
    return JSON.parse(cached);
  } catch (e) {
    return DEFAULT_FIREBASE_CONFIG;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig) {
  localStorage.setItem('acc_firebase_config', JSON.stringify(config));
}

export function clearFirebaseConfig() {
  localStorage.removeItem('acc_firebase_config');
}

export function initializeFirebase(): { status: 'connected' | 'not-configured' | 'error'; message: string } {
  const config = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { status: 'not-configured', message: 'Firebase is not configured yet. Using secure LocalStorage engine.' };
  }

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    firestoreDb = config.firestoreDatabaseId 
      ? getFirestore(firebaseApp, config.firestoreDatabaseId)
      : getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
    return { status: 'connected', message: 'Firebase connected successfully and ready for real-time synchronization.' };
  } catch (error: any) {
    console.error("Firebase dynamic initialization error:", error);
    return { status: 'error', message: `Initialization Error: ${error.message}` };
  }
}

// Auto-initialize Firebase immediately on import
initializeFirebase();

// Helper to check currently configured client health 
export function checkDatabaseConnectionHealth(): { status: 'local' | 'cloud' | 'error'; message: string } {
  const config = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { 
      status: 'local', 
      message: '● Active & Secure (Local Cache Engine Active)' 
    };
  }

  try {
    initializeFirebase();
    return { 
      status: 'cloud', 
      message: `● Connected to Live Database (${config.projectId})` 
    };
  } catch (err: any) {
    return { 
      status: 'error', 
      message: `● Error syncing with Firebase: ${err.message}` 
    };
  }
}

// Firestore Database Synchronizer Handlers
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = firebaseAuth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function dbSaveProduct(prod: any) {
  if (!firestoreDb) initializeFirebase();
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "products", prod.id), prod);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `products/${prod.id}`);
  }
}

export async function dbDeleteProduct(id: string) {
  if (!firestoreDb) initializeFirebase();
  if (!firestoreDb) return;
  try {
    await deleteDoc(doc(firestoreDb, "products", id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
  }
}

export async function dbSaveSettings(settings: any) {
  if (!firestoreDb) initializeFirebase();
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "settings", "shop_settings"), settings);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, "settings/shop_settings");
  }
}

export async function dbSaveOrder(order: any) {
  if (!firestoreDb) initializeFirebase();
  if (!firestoreDb) return;
  try {
    await setDoc(doc(firestoreDb, "orders", order.id), order);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `orders/${order.id}`);
  }
}

export { firebaseApp, firestoreDb, firebaseAuth, collection, doc, onSnapshot, setDoc, deleteDoc };
