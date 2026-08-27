import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAbWWDV00qaN5lyBygs5xPrjkm_8dzYEss',
  authDomain: 'aveocafe-lounge.firebaseapp.com',
  projectId: 'aveocafe-lounge',
  storageBucket: 'aveocafe-lounge.firebasestorage.app',
  messagingSenderId: '83831360825',
  appId: '1:83831360825:web:ff45923cd1adc1612fece8',
  measurementId: 'G-K0GL62TQVS',
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId,
);

export const firebaseApp = hasFirebaseConfig
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

export const auth = hasFirebaseConfig && firebaseApp ? getAuth(firebaseApp) : null;
export const db = hasFirebaseConfig && firebaseApp ? getFirestore(firebaseApp) : null;
