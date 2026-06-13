import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Match, UpcomingMatch, Channel, GlobalSettings } from '../types';

// The hardcoded authorized administrator email
export const AUTHORIZED_ADMIN = "mp.mywork51@gmail.com";

const DEFAULT_SETTINGS: GlobalSettings = {
  bannerAdEnabled: false,
  bannerAdCode: '<div class="p-4 bg-lime-950/20 rounded border border-lime-500/30 text-lime-400 text-center font-mono text-sm">Banner Ad Block [Manage via settings code]</div>',
  popunderAdEnabled: false,
  popunderAdCode: '<script>console.log("Pop-under Ad active.");</script>',
  welcomeTitle: "খেলাঘর-এ স্বাগতম",
  welcomeMessage: "আপনাকে স্বাগতম আমাদের খেলাঘর ওয়েবসাইটে! সব ধরণের লাইভ খেলা উপভোগ করতে আমাদের সাথেই থাকুন।",
  telegramUrl: "https://t.me/khelaghor_official",
  privacyPolicyUrl: "https://khelaghor.com/privacy-policy",
  termsUrl: "https://khelaghor.com/terms"
};

// Local storage fallback state if firebase is not configured
const LOCAL_STORAGE_KEY_MATCHES = 'khelaghor_matches';
const LOCAL_STORAGE_KEY_UPCOMING = 'khelaghor_upcoming';
const LOCAL_STORAGE_KEY_CHANNELS = 'khelaghor_channels';
const LOCAL_STORAGE_KEY_SETTINGS = 'khelaghor_settings';

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('khelaghor_local_update'));
  } catch (e) {
    console.error('Local Storage save failed', e);
  }
}

// Subscribe to data lists
export function subscribeToMatches(callback: (matches: Match[]) => void) {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          category: data.category || 'others',
          team1Name: data.team1Name || '',
          team1Logo: data.team1Logo || '',
          team2Name: data.team2Name || '',
          team2Logo: data.team2Logo || '',
          server1Url: data.server1Url || '',
          server2Url: data.server2Url || '',
          server3Url: data.server3Url || '',
          server4Url: data.server4Url || '',
          isLive: data.isLive ?? true,
          competition: data.competition || '',
          createdAt: data.createdAt || Date.now()
        });
      });
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'matches');
    });
  } else {
    const handler = () => {
      callback(getLocalData<Match[]>(LOCAL_STORAGE_KEY_MATCHES, []));
    };
    window.addEventListener('khelaghor_local_update', handler);
    handler(); // initial trigger
    return () => window.removeEventListener('khelaghor_local_update', handler);
  }
}

export function subscribeToUpcoming(callback: (upcoming: UpcomingMatch[]) => void) {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'upcoming'), orderBy('scheduledTime', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const list: UpcomingMatch[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          category: data.category || 'others',
          team1Name: data.team1Name || '',
          team1Logo: data.team1Logo || '',
          team2Name: data.team2Name || '',
          team2Logo: data.team2Logo || '',
          server1Url: data.server1Url || '',
          server2Url: data.server2Url || '',
          server3Url: data.server3Url || '',
          server4Url: data.server4Url || '',
          competition: data.competition || '',
          scheduledTime: data.scheduledTime || Date.now(),
          createdAt: data.createdAt || Date.now()
        });
      });
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'upcoming');
    });
  } else {
    const handler = () => {
      callback(getLocalData<UpcomingMatch[]>(LOCAL_STORAGE_KEY_UPCOMING, []));
    };
    window.addEventListener('khelaghor_local_update', handler);
    handler(); // initial trigger
    return () => window.removeEventListener('khelaghor_local_update', handler);
  }
}

export function subscribeToChannels(callback: (channels: Channel[]) => void) {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'channels'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: Channel[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || '',
          logoUrl: data.logoUrl || '',
          streamUrl1: data.streamUrl1 || '',
          streamUrl2: data.streamUrl2 || '',
          category: data.category || 'বাংলাদেশ স্পোর্টস',
          createdAt: data.createdAt || Date.now()
        });
      });
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'channels');
    });
  } else {
    const handler = () => {
      callback(getLocalData<Channel[]>(LOCAL_STORAGE_KEY_CHANNELS, []));
    };
    window.addEventListener('khelaghor_local_update', handler);
    handler(); // initial trigger
    return () => window.removeEventListener('khelaghor_local_update', handler);
  }
}

export function subscribeToSettings(callback: (settings: GlobalSettings) => void) {
  if (isFirebaseConfigured && db) {
    const settingsDocRef = doc(db, 'settings', 'global');
    return onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          bannerAdEnabled: !!data.bannerAdEnabled,
          bannerAdCode: data.bannerAdCode || '',
          popunderAdEnabled: !!data.popunderAdEnabled,
          popunderAdCode: data.popunderAdCode || '',
          welcomeTitle: data.welcomeTitle || DEFAULT_SETTINGS.welcomeTitle,
          welcomeMessage: data.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
          telegramUrl: data.telegramUrl || DEFAULT_SETTINGS.telegramUrl,
          privacyPolicyUrl: data.privacyPolicyUrl || DEFAULT_SETTINGS.privacyPolicyUrl,
          termsUrl: data.termsUrl || DEFAULT_SETTINGS.termsUrl
        });
      } else {
        // Set defaults if document is not yet initialized
        callback(DEFAULT_SETTINGS);
        // Admin user can create the settings doc, but let's initialize cleanly
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });
  } else {
    const handler = () => {
      callback(getLocalData<GlobalSettings>(LOCAL_STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS));
    };
    window.addEventListener('khelaghor_local_update', handler);
    handler(); // initial trigger
    return () => window.removeEventListener('khelaghor_local_update', handler);
  }
}

// Authentication wrappers
export function subscribeToAuth(callback: (user: User | null, isAdmin: boolean) => void) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, (currentUser: any) => {
      if (currentUser) {
        const email = currentUser.email || '';
        const authorized = email.toLowerCase() === AUTHORIZED_ADMIN.toLowerCase();
        callback(currentUser, authorized);
      } else {
        callback(null, false);
      }
    });
  } else {
    // Local mock auth state
    const handler = () => {
      const localUserStr = localStorage.getItem('khelaghor_mock_user');
      if (localUserStr) {
        const u = JSON.parse(localUserStr);
        callback(u, true); // Logged in mock behaves as admin
      } else {
        callback(null, false);
      }
    };
    window.addEventListener('khelaghor_mock_auth_update', handler);
    handler();
    return () => window.removeEventListener('khelaghor_mock_auth_update', handler);
  }
}

export async function loginWithGoogle(): Promise<{ user: any; isAdmin: boolean }> {
  if (isFirebaseConfigured && auth) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user?.email || '';
      const authorized = email.toLowerCase() === AUTHORIZED_ADMIN.toLowerCase();
      if (!authorized) {
        // Automatically sign out if not the single authorized admin email
        await signOut(auth);
        throw new Error(`Unauthorized. Only ${AUTHORIZED_ADMIN} is permitted to access the admin console.`);
      }
      return { user: result.user, isAdmin: true };
    } catch (e: any) {
      console.error('Authentication Error:', e);
      throw e;
    }
  } else {
    // Mock successful login
    const mockUser = {
      uid: 'mock-admin-uid',
      displayName: 'KhelaGhor Admin',
      email: AUTHORIZED_ADMIN,
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'
    };
    localStorage.setItem('khelaghor_mock_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('khelaghor_mock_auth_update'));
    return { user: mockUser, isAdmin: true };
  }
}

export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign-out failed', e);
    }
  } else {
    localStorage.removeItem('khelaghor_mock_user');
    window.dispatchEvent(new Event('khelaghor_mock_auth_update'));
  }
}

// Admin Match write operations
export async function addMatch(m: Omit<Match, 'id' | 'createdAt'>) {
  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, 'matches'), {
        ...m,
        createdAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'matches');
    }
  } else {
    const list = getLocalData<Match[]>(LOCAL_STORAGE_KEY_MATCHES, []);
    const newMatch: Match = {
      ...m,
      id: 'match_' + Date.now().toString(36),
      createdAt: Date.now()
    };
    setLocalData(LOCAL_STORAGE_KEY_MATCHES, [newMatch, ...list]);
  }
}

export async function deleteMatch(id: string) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'matches', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `matches/${id}`);
    }
  } else {
    const list = getLocalData<Match[]>(LOCAL_STORAGE_KEY_MATCHES, []);
    setLocalData(LOCAL_STORAGE_KEY_MATCHES, list.filter(item => item.id !== id));
  }
}

// Admin Upcoming write operations
export async function addUpcomingMatch(um: Omit<UpcomingMatch, 'id' | 'createdAt'>) {
  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, 'upcoming'), {
        ...um,
        createdAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'upcoming');
    }
  } else {
    const list = getLocalData<UpcomingMatch[]>(LOCAL_STORAGE_KEY_UPCOMING, []);
    const newUM: UpcomingMatch = {
      ...um,
      id: 'upcoming_' + Date.now().toString(36),
      createdAt: Date.now()
    };
    setLocalData(LOCAL_STORAGE_KEY_UPCOMING, [...list, newUM]);
  }
}

export async function deleteUpcomingMatch(id: string) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'upcoming', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `upcoming/${id}`);
    }
  } else {
    const list = getLocalData<UpcomingMatch[]>(LOCAL_STORAGE_KEY_UPCOMING, []);
    setLocalData(LOCAL_STORAGE_KEY_UPCOMING, list.filter(item => item.id !== id));
  }
}

// Transition an upcoming match to live list
export async function transitionMatchToLive(um: UpcomingMatch) {
  // Add match to Live Matches first
  await addMatch({
    category: um.category,
    team1Name: um.team1Name,
    team1Logo: um.team1Logo,
    team2Name: um.team2Name,
    team2Logo: um.team2Logo,
    server1Url: um.server1Url,
    server2Url: um.server2Url,
    server3Url: um.server3Url || '',
    server4Url: um.server4Url || '',
    isLive: true,
    competition: um.competition
  });
  // Delete from upcoming
  await deleteUpcomingMatch(um.id);
}

// Admin Channels write operations
export async function addChannel(ch: Omit<Channel, 'id' | 'createdAt'>) {
  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, 'channels'), {
        ...ch,
        createdAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'channels');
    }
  } else {
    const list = getLocalData<Channel[]>(LOCAL_STORAGE_KEY_CHANNELS, []);
    const newCh: Channel = {
      ...ch,
      id: 'channel_' + Date.now().toString(36),
      createdAt: Date.now()
    };
    setLocalData(LOCAL_STORAGE_KEY_CHANNELS, [newCh, ...list]);
  }
}

export async function deleteChannel(id: string) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'channels', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `channels/${id}`);
    }
  } else {
    const list = getLocalData<Channel[]>(LOCAL_STORAGE_KEY_CHANNELS, []);
    setLocalData(LOCAL_STORAGE_KEY_CHANNELS, list.filter(item => item.id !== id));
  }
}

export async function updateChannel(id: string, ch: Omit<Channel, 'id' | 'createdAt'>) {
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'channels', id), {
        ...ch
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `channels/${id}`);
    }
  } else {
    const list = getLocalData<Channel[]>(LOCAL_STORAGE_KEY_CHANNELS, []);
    setLocalData(LOCAL_STORAGE_KEY_CHANNELS, list.map(item => item.id === id ? { ...item, ...ch } : item));
  }
}

// Settings write operations
export async function saveGlobalSettings(s: GlobalSettings) {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...s,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/global');
    }
  } else {
    setLocalData(LOCAL_STORAGE_KEY_SETTINGS, s);
  }
}
