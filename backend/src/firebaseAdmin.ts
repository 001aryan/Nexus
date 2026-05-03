import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON');
  }
}

function createFirebaseAdminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = loadServiceAccount();
  const credential = serviceAccount ? cert(serviceAccount) : applicationDefault();
  return initializeApp({ credential });
}

export const adminApp = createFirebaseAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);