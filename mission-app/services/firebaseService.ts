import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, remove, onValue, off, DataSnapshot, Database } from 'firebase/database';
import { RoomSummary } from '../types';

// Firebase configuration from environment variables
// Set these in your .env file or Vercel environment settings:
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_DATABASE_URL,
// VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Check if Firebase is configured
const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let database: Database | null = null;

const initFirebase = (): Database | null => {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured. Room discovery will use local storage only.');
    return null;
  }

  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return null;
    }
  }
  return database;
};

// --- Room Registry Functions ---

const ROOMS_REF = 'rooms';

export const publishRoomToFirebase = async (room: RoomSummary): Promise<void> => {
  const db = initFirebase();
  if (!db) return;

  try {
    const roomRef = ref(db, `${ROOMS_REF}/${room.roomCode}`);
    await set(roomRef, {
      roomCode: room.roomCode,
      orgName: room.orgName,
      createdAt: room.createdAt,
      isEnded: room.isEnded
    });
    console.log('Room published to Firebase:', room.roomCode);
  } catch (error) {
    console.error('Error publishing room to Firebase:', error);
  }
};

export const removeRoomFromFirebase = async (roomCode: string): Promise<void> => {
  const db = initFirebase();
  if (!db) return;

  try {
    const roomRef = ref(db, `${ROOMS_REF}/${roomCode}`);
    await remove(roomRef);
    console.log('Room removed from Firebase:', roomCode);
  } catch (error) {
    console.error('Error removing room from Firebase:', error);
  }
};

export const updateRoomStatusInFirebase = async (roomCode: string, isEnded: boolean): Promise<void> => {
  const db = initFirebase();
  if (!db) return;

  try {
    const roomRef = ref(db, `${ROOMS_REF}/${roomCode}/isEnded`);
    await set(roomRef, isEnded);
    console.log('Room status updated in Firebase:', roomCode, isEnded);
  } catch (error) {
    console.error('Error updating room status in Firebase:', error);
  }
};

export const subscribeToRooms = (callback: (rooms: RoomSummary[]) => void): (() => void) => {
  const db = initFirebase();
  if (!db) {
    callback([]);
    return () => {};
  }

  const roomsRef = ref(db, ROOMS_REF);

  const handleSnapshot = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (data) {
      const rooms: RoomSummary[] = Object.values(data);
      // Sort: active first, then by createdAt descending
      rooms.sort((a, b) => {
        if (a.isEnded && !b.isEnded) return 1;
        if (!a.isEnded && b.isEnded) return -1;
        return b.createdAt - a.createdAt;
      });
      callback(rooms);
    } else {
      callback([]);
    }
  };

  onValue(roomsRef, handleSnapshot);

  // Return unsubscribe function
  return () => {
    off(roomsRef, 'value', handleSnapshot);
  };
};

// Fetch rooms once (for initial load)
export const fetchRoomsOnce = async (): Promise<RoomSummary[]> => {
  const db = initFirebase();
  if (!db) return [];

  return new Promise((resolve) => {
    const roomsRef = ref(db, ROOMS_REF);
    onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rooms: RoomSummary[] = Object.values(data);
        rooms.sort((a, b) => {
          if (a.isEnded && !b.isEnded) return 1;
          if (!a.isEnded && b.isEnded) return -1;
          return b.createdAt - a.createdAt;
        });
        resolve(rooms);
      } else {
        resolve([]);
      }
    }, { onlyOnce: true });
  });
};
