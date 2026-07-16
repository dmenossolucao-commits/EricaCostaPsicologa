import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Use .appspot.com as it is the highly compatible and standard Google Cloud Storage bucket
// for Firebase projects, especially under this sandbox container environment
const bucketName = firebaseConfig.storageBucket && firebaseConfig.storageBucket.includes('appspot.com')
  ? firebaseConfig.storageBucket
  : `${firebaseConfig.projectId}.appspot.com`;

console.log(`[Firebase Initialization] Initializing Storage with bucket: gs://${bucketName}`);
export const storage = getStorage(app, `gs://${bucketName}`);

