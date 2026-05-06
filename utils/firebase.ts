import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  off,
  update,
  query,
  orderByChild,
  equalTo,
  DataSnapshot,
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

// ─── Firebase Project Config ────────────────────────────────────────────────
// This is a free Firebase project created for SOS! Emergency App.
// Realtime Database rules are set to allow public read/write for demo purposes.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
export const auth = getAuth(app);

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SOSRequest {
  id: string;
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  mapsLink: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'resolved';
  acceptedBy?: string;
  type: string;
}

export interface HelperProfile {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  experience: string;
  bio: string;
  status: 'available' | 'offline';
  registeredAt: number;
  helpedCount: number;
}

// ─── Push a new SOS Request ──────────────────────────────────────────────────
export const pushSOSRequest = async (
  userId: string,
  userName: string,
  latitude: number,
  longitude: number,
  type: string = 'Location Share'
): Promise<string> => {
  const requestsRef = ref(db, 'sos_requests');
  const newRef = push(requestsRef);
  const id = newRef.key!;

  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  await set(newRef, {
    id,
    userId,
    userName,
    latitude,
    longitude,
    mapsLink,
    timestamp: Date.now(),
    status: 'pending',
    type,
  });

  return id;
};

// ─── Listen to all pending SOS Requests (for helpers) ────────────────────────
export const listenToSOSRequests = (
  callback: (requests: SOSRequest[]) => void
): (() => void) => {
  const requestsRef = ref(db, 'sos_requests');

  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const requests: SOSRequest[] = Object.values(data)
      .filter((r: any) => r.status === 'pending')
      .sort((a: any, b: any) => b.timestamp - a.timestamp) as SOSRequest[];

    callback(requests);
  };

  onValue(requestsRef, handler);

  // Return unsubscribe function
  return () => off(requestsRef, 'value', handler);
};

// ─── Listen to a specific request (for user to detect acceptance) ─────────────
export const listenToRequest = (
  requestId: string,
  callback: (request: SOSRequest | null) => void
): (() => void) => {
  const reqRef = ref(db, `sos_requests/${requestId}`);

  const handler = (snapshot: DataSnapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as SOSRequest) : null);
  };

  onValue(reqRef, handler);
  return () => off(reqRef, 'value', handler);
};

// ─── Accept a request (helper action) ────────────────────────────────────────
export const acceptSOSRequest = async (
  requestId: string,
  helperName: string
): Promise<void> => {
  const reqRef = ref(db, `sos_requests/${requestId}`);
  await update(reqRef, {
    status: 'accepted',
    acceptedBy: helperName,
  });
};

// ─── Resolve / close a request ────────────────────────────────────────────────
export const resolveSOSRequest = async (requestId: string): Promise<void> => {
  const reqRef = ref(db, `sos_requests/${requestId}`);
  await update(reqRef, { status: 'resolved' });
};

// ─── Register a Helper Profile ────────────────────────────────────────────────
export const registerHelper = async (
  id: string,
  name: string,
  phone: string,
  specialty: string,
  experience: string,
  bio: string
): Promise<void> => {
  const newHelper: HelperProfile = {
    id,
    name,
    phone,
    specialty,
    experience,
    bio,
    status: 'available',
    registeredAt: Date.now(),
    helpedCount: 0,
  };

  try {
    const helperRef = ref(db, `helpers/${id}`);
    await set(helperRef, newHelper);
  } catch (e) {
    console.warn('Firebase DB failed, falling back to cross-tab localStorage', e);
  }

  // Cross-tab fallback for Web
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing = JSON.parse(window.localStorage.getItem('sos_mock_helpers') || '[]');
    const updated = [...existing.filter((h: any) => h.id !== id), newHelper];
    window.localStorage.setItem('sos_mock_helpers', JSON.stringify(updated));
    // Manually dispatch storage event for same tab
    window.dispatchEvent(new Event('storage'));
  }
};

// ─── Update helper online/offline status ─────────────────────────────────────
export const updateHelperStatus = async (
  helperId: string,
  status: 'available' | 'offline'
): Promise<void> => {
  const helperRef = ref(db, `helpers/${helperId}`);
  await update(helperRef, { status });
};

// ─── Listen to all registered helpers ────────────────────────────────────────
export const listenToHelpers = (
  callback: (helpers: HelperProfile[]) => void
): (() => void) => {
  const helpersRef = ref(db, 'helpers');

  const handler = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(Object.values(data) as HelperProfile[]);
    }
  };

  // Try Firebase first
  onValue(helpersRef, handler, (error) => {
    console.warn('Firebase listen failed, using localStorage fallback');
  });

  // Cross-tab fallback for Web
  const storageHandler = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem('sos_mock_helpers');
      if (data) {
        callback(JSON.parse(data));
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageHandler);
    // Initial load
    storageHandler();
  }

  return () => {
    off(helpersRef, 'value', handler);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageHandler);
    }
  };
};

// ─── Calculate distance between two GPS points (Haversine) ───────────────────
export const calcDistanceKm = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
