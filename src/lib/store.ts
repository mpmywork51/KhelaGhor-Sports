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
  increment
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
import { supabase } from './supabase';

// The hardcoded authorized administrator email
export const AUTHORIZED_ADMIN = "mp.mywork51@gmail.com";

const DEFAULT_SETTINGS: GlobalSettings = {
  bannerAdEnabled: false,
  bannerAdCode: '<div class="p-4 bg-lime-950/20 rounded border border-lime-500/30 text-lime-400 text-center font-mono text-sm">Banner Ad Block [Manage via settings code]</div>',
  popunderAdEnabled: false,
  popunderAdCode: '<script>console.log("Pop-under Ad active.");</script>',
  welcomeTitle: "লাইভখেলা-য় স্বাগতম",
  welcomeMessage: "আপনাকে স্বাগতম আমাদের লাইভখেলা ওয়েবসাইটে! সব ধরণের লাইভ খেলা উপভোগ করতে আমাদের সাথেই থাকুন।",
  telegramUrl: "https://t.me/livekhela_official",
  privacyPolicyUrl: "https://livekhela.com/privacy-policy",
  termsUrl: "https://livekhela.com/terms",
  trafficSimulationEnabled: false,
  simulatedBaselineTraffic: 0,
  totalVisits: 0
};

// Module-level cache to keep in-sync settings reference for background simulation threads
let cachedGlobalSettings: GlobalSettings = { ...DEFAULT_SETTINGS };

// Local storage fallback state if databases are down
const LOCAL_STORAGE_KEY_MATCHES = 'livekhela_matches';
const LOCAL_STORAGE_KEY_UPCOMING = 'livekhela_upcoming';
const LOCAL_STORAGE_KEY_CHANNELS = 'livekhela_channels';
const LOCAL_STORAGE_KEY_SETTINGS = 'livekhela_settings';

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
    window.dispatchEvent(new Event('livekhela_local_update'));
  } catch (e) {
    console.error('Local Storage save failed', e);
  }
}

// -----------------------------------------------------------------
// SUPABASE FETCH HELPERS WITH ERROR RESILIENCY
// -----------------------------------------------------------------
async function fetchMatchesFromSupabase(): Promise<Match[]> {
  try {
    const { data, error } = await supabase.from('matches').select('*');
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      category: d.category || 'others',
      team1Name: d.team1Name || '',
      team1Logo: d.team1Logo || '',
      team2Name: d.team2Name || '',
      team2Logo: d.team2Logo || '',
      server1Url: d.server1Url || '',
      server2Url: d.server2Url || '',
      server3Url: d.server3Url || '',
      server4Url: d.server4Url || '',
      isLive: d.isLive ?? true,
      competition: d.competition || '',
      createdAt: Number(d.createdAt) || Date.now(),
      serial: d.serial !== undefined && d.serial !== null ? Number(d.serial) : 999
    }));
  } catch (err) {
    console.warn('Supabase fetch matches failed (table might be unconfigured):', err);
    throw err;
  }
}

async function fetchUpcomingFromSupabase(): Promise<UpcomingMatch[]> {
  try {
    const { data, error } = await supabase.from('upcoming').select('*');
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      category: d.category || 'others',
      team1Name: d.team1Name || '',
      team1Logo: d.team1Logo || '',
      team2Name: d.team2Name || '',
      team2Logo: d.team2Logo || '',
      server1Url: d.server1Url || '',
      server2Url: d.server2Url || '',
      server3Url: d.server3Url || '',
      server4Url: d.server4Url || '',
      competition: d.competition || '',
      scheduledTime: Number(d.scheduledTime) || Date.now(),
      createdAt: Number(d.createdAt) || Date.now(),
      serial: d.serial !== undefined && d.serial !== null ? Number(d.serial) : 999
    }));
  } catch (err) {
    console.warn('Supabase fetch upcoming matches failed (table might be unconfigured):', err);
    throw err;
  }
}

async function fetchChannelsFromSupabase(): Promise<Channel[]> {
  try {
    const { data, error } = await supabase.from('channels').select('*');
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      name: d.name || '',
      logoUrl: d.logoUrl || '',
      streamUrl1: d.streamUrl1 || '',
      streamUrl2: d.streamUrl2 || '',
      category: d.category || 'বাংলাদেশ স্পোর্টস',
      createdAt: Number(d.createdAt) || Date.now(),
      serial: d.serial !== undefined && d.serial !== null ? Number(d.serial) : 999
    }));
  } catch (err) {
    console.warn('Supabase fetch channels failed (table might be unconfigured):', err);
    throw err;
  }
}

async function fetchSettingsFromSupabase(): Promise<GlobalSettings> {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
    if (error) throw error;
    if (!data) return DEFAULT_SETTINGS;
    return {
      bannerAdEnabled: !!data.bannerAdEnabled,
      bannerAdCode: data.bannerAdCode || '',
      popunderAdEnabled: !!data.popunderAdEnabled,
      popunderAdCode: data.popunderAdCode || '',
      welcomeTitle: data.welcomeTitle || DEFAULT_SETTINGS.welcomeTitle,
      welcomeMessage: data.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
      telegramUrl: data.telegramUrl || DEFAULT_SETTINGS.telegramUrl,
      privacyPolicyUrl: data.privacyPolicyUrl || DEFAULT_SETTINGS.privacyPolicyUrl,
      termsUrl: data.termsUrl || DEFAULT_SETTINGS.termsUrl,
      trafficSimulationEnabled: data.trafficSimulationEnabled !== undefined ? !!data.trafficSimulationEnabled : false,
      simulatedBaselineTraffic: data.simulatedBaselineTraffic !== undefined ? Number(data.simulatedBaselineTraffic) : 0,
      totalVisits: data.totalVisits !== undefined ? Number(data.totalVisits) : 0
    };
  } catch (err) {
    console.warn('Supabase fetch global settings failed (table might be unconfigured):', err);
    throw err;
  }
}

// -----------------------------------------------------------------
// TWO-WAY HYBRID REALTIME BACKUP SUBSCRIBERS
// -----------------------------------------------------------------

export function subscribeToMatches(callback: (matches: Match[]) => void) {
  let unsubFirestore: (() => void) | null = null;
  let supabaseSub: any = null;
  let isFirestoreActive = false;
  let isSupabaseActive = false;

  const loadFallbackLocal = () => {
    const list = getLocalData<Match[]>(LOCAL_STORAGE_KEY_MATCHES, []);
    const sorted = [...list].sort((a, b) => {
      const serialA = a.serial ?? 999;
      const serialB = b.serial ?? 999;
      if (serialA !== serialB) return serialA - serialB;
      return b.createdAt - a.createdAt;
    });
    callback(sorted);
  };

  const startSupabaseFallback = async () => {
    if (isSupabaseActive) return;
    isSupabaseActive = true;
    console.log('🔄 S1 [Firebase] failed/down. Activating S2 [Supabase] for matches.');

    try {
      const list = await fetchMatchesFromSupabase();
      if (!list || list.length === 0) {
        // If Supabase has no data, attempt Firebase read again
        if (isFirebaseConfigured && db && !isFirestoreActive) {
          startFirestorePrimary();
          return;
        }
      }
      
      const sorted = [...list].sort((a, b) => {
        const serialA = a.serial ?? 999;
        const serialB = b.serial ?? 999;
        if (serialA !== serialB) return serialA - serialB;
        return b.createdAt - a.createdAt;
      });
      callback(sorted);
    } catch (e) {
      console.warn('Supabase matches query failed, falling back to local storage', e);
      loadFallbackLocal();
    }

    // Subscribe to Supabase Postgres modifications
    try {
      supabaseSub = supabase
        .channel('matches-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async () => {
          try {
            const updated = await fetchMatchesFromSupabase();
            const sorted = [...updated].sort((a, b) => {
              const serialA = a.serial ?? 999;
              const serialB = b.serial ?? 999;
              if (serialA !== serialB) return serialA - serialB;
              return b.createdAt - a.createdAt;
            });
            callback(sorted);
          } catch (err) {
            console.warn('Supabase real-time update error, querying Firebase primary...', err);
            if (isFirebaseConfigured && db) {
              startFirestorePrimary();
            }
          }
        })
        .subscribe();
    } catch (errSub) {
      console.warn('Supabase subscription channel failed:', errSub);
    }
  };

  const startFirestorePrimary = () => {
    if (isFirebaseConfigured && db) {
      try {
        isFirestoreActive = true;
        const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
        unsubFirestore = onSnapshot(q, (snapshot) => {
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
              createdAt: data.createdAt || Date.now(),
              serial: data.serial !== undefined && data.serial !== null ? Number(data.serial) : 999
            });
          });
          const sorted = [...list].sort((a, b) => {
            const serialA = a.serial ?? 999;
            const serialB = b.serial ?? 999;
            if (serialA !== serialB) return serialA - serialB;
            return b.createdAt - a.createdAt;
          });
          callback(sorted);
        }, (error) => {
          console.warn('Firestore matches update failed, trying Supabase primary...', error);
          isFirestoreActive = false;
          startSupabaseFallback();
        });
      } catch (err) {
        console.warn('Firestore primary initialization failed, falling back to Supabase...', err);
        isFirestoreActive = false;
        startSupabaseFallback();
      }
    } else {
      startSupabaseFallback();
    }
  };

  // Run primary stream
  startFirestorePrimary();

  return () => {
    if (unsubFirestore) {
      unsubFirestore();
    }
    if (supabaseSub) {
      supabase.removeChannel(supabaseSub);
    }
  };
}

export function subscribeToUpcoming(callback: (upcoming: UpcomingMatch[]) => void) {
  let unsubFirestore: (() => void) | null = null;
  let supabaseSub: any = null;
  let isFirestoreActive = false;
  let isSupabaseActive = false;

  const loadFallbackLocal = () => {
    const list = getLocalData<UpcomingMatch[]>(LOCAL_STORAGE_KEY_UPCOMING, []);
    const sorted = [...list].sort((a, b) => {
      const serialA = a.serial ?? 999;
      const serialB = b.serial ?? 999;
      if (serialA !== serialB) return serialA - serialB;
      return a.scheduledTime - b.scheduledTime;
    });
    callback(sorted);
  };

  const startSupabaseFallback = async () => {
    if (isSupabaseActive) return;
    isSupabaseActive = true;
    console.log('🔄 S1 [Firebase] failed/down. Activating S2 [Supabase] for upcoming matches.');

    try {
      const list = await fetchUpcomingFromSupabase();
      if (!list || list.length === 0) {
        if (isFirebaseConfigured && db && !isFirestoreActive) {
          startFirestorePrimary();
          return;
        }
      }
      
      const sorted = [...list].sort((a, b) => {
        const serialA = a.serial ?? 999;
        const serialB = b.serial ?? 999;
        if (serialA !== serialB) return serialA - serialB;
        return a.scheduledTime - b.scheduledTime;
      });
      callback(sorted);
    } catch (e) {
      console.warn('Supabase upcoming query failed, falling back to local storage', e);
      loadFallbackLocal();
    }

    try {
      supabaseSub = supabase
        .channel('upcoming-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'upcoming' }, async () => {
          try {
            const updated = await fetchUpcomingFromSupabase();
            const sorted = [...updated].sort((a, b) => {
              const serialA = a.serial ?? 999;
              const serialB = b.serial ?? 999;
              if (serialA !== serialB) return serialA - serialB;
              return a.scheduledTime - b.scheduledTime;
            });
            callback(sorted);
          } catch (err) {
            console.warn('Supabase real-time update error, querying Firebase primary...', err);
            if (isFirebaseConfigured && db) {
              startFirestorePrimary();
            }
          }
        })
        .subscribe();
    } catch (errSub) {
      console.warn('Supabase subscription channel failed:', errSub);
    }
  };

  const startFirestorePrimary = () => {
    if (isFirebaseConfigured && db) {
      try {
        isFirestoreActive = true;
        const q = query(collection(db, 'upcoming'), orderBy('scheduledTime', 'asc'));
        unsubFirestore = onSnapshot(q, (snapshot) => {
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
              createdAt: data.createdAt || Date.now(),
              serial: data.serial !== undefined && data.serial !== null ? Number(data.serial) : 999
            });
          });
          const sorted = [...list].sort((a, b) => {
            const serialA = a.serial ?? 999;
            const serialB = b.serial ?? 999;
            if (serialA !== serialB) return serialA - serialB;
            return a.scheduledTime - b.scheduledTime;
          });
          callback(sorted);
        }, (error) => {
          console.warn('Firestore upcoming update failed, trying Supabase primary...', error);
          isFirestoreActive = false;
          startSupabaseFallback();
        });
      } catch (err) {
        console.warn('Firestore primary initialization failed, falling back to Supabase...', err);
        isFirestoreActive = false;
        startSupabaseFallback();
      }
    } else {
      startSupabaseFallback();
    }
  };

  startFirestorePrimary();

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (supabaseSub) supabase.removeChannel(supabaseSub);
  };
}

export function subscribeToChannels(callback: (channels: Channel[]) => void) {
  let unsubFirestore: (() => void) | null = null;
  let supabaseSub: any = null;
  let isFirestoreActive = false;
  let isSupabaseActive = false;

  const loadFallbackLocal = () => {
    const list = getLocalData<Channel[]>(LOCAL_STORAGE_KEY_CHANNELS, []);
    const sorted = [...list].sort((a, b) => {
      const serialA = a.serial ?? 999;
      const serialB = b.serial ?? 999;
      if (serialA !== serialB) return serialA - serialB;
      return b.createdAt - a.createdAt;
    });
    callback(sorted);
  };

  const startSupabaseFallback = async () => {
    if (isSupabaseActive) return;
    isSupabaseActive = true;
    console.log('🔄 S1 [Firebase] failed/down. Activating S2 [Supabase] for channels.');

    try {
      const list = await fetchChannelsFromSupabase();
      if (!list || list.length === 0) {
        if (isFirebaseConfigured && db && !isFirestoreActive) {
          startFirestorePrimary();
          return;
        }
      }
      
      const sorted = [...list].sort((a, b) => {
        const serialA = a.serial ?? 999;
        const serialB = b.serial ?? 999;
        if (serialA !== serialB) return serialA - serialB;
        return b.createdAt - a.createdAt;
      });
      callback(sorted);
    } catch (e) {
      console.warn('Supabase channels query failed, falling back to local storage', e);
      loadFallbackLocal();
    }

    try {
      supabaseSub = supabase
        .channel('channels-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, async () => {
          try {
            const updated = await fetchChannelsFromSupabase();
            const sorted = [...updated].sort((a, b) => {
              const serialA = a.serial ?? 999;
              const serialB = b.serial ?? 999;
              if (serialA !== serialB) return serialA - serialB;
              return b.createdAt - a.createdAt;
            });
            callback(sorted);
          } catch (err) {
            console.warn('Supabase real-time update error, querying Firebase primary...', err);
            if (isFirebaseConfigured && db) {
              startFirestorePrimary();
            }
          }
        })
        .subscribe();
    } catch (errSub) {
      console.warn('Supabase subscription channel failed:', errSub);
    }
  };

  const startFirestorePrimary = () => {
    if (isFirebaseConfigured && db) {
      try {
        isFirestoreActive = true;
        const q = query(collection(db, 'channels'), orderBy('createdAt', 'desc'));
        unsubFirestore = onSnapshot(q, (snapshot) => {
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
              createdAt: data.createdAt || Date.now(),
              serial: data.serial !== undefined && data.serial !== null ? Number(data.serial) : 999
            });
          });
          const sorted = [...list].sort((a, b) => {
            const serialA = a.serial ?? 999;
            const serialB = b.serial ?? 999;
            if (serialA !== serialB) return serialA - serialB;
            return b.createdAt - a.createdAt;
          });
          callback(sorted);
        }, (error) => {
          console.warn('Firestore channels update failed, trying Supabase primary...', error);
          isFirestoreActive = false;
          startSupabaseFallback();
        });
      } catch (err) {
        console.warn('Firestore primary initialization failed, falling back to Supabase...', err);
        isFirestoreActive = false;
        startSupabaseFallback();
      }
    } else {
      startSupabaseFallback();
    }
  };

  startFirestorePrimary();

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (supabaseSub) supabase.removeChannel(supabaseSub);
  };
}

export function subscribeToSettings(callback: (settings: GlobalSettings) => void) {
  let unsubFirestore: (() => void) | null = null;
  let supabaseSub: any = null;
  let isFirestoreActive = false;
  let isSupabaseActive = false;

  const loadFallbackLocal = () => {
    const local = getLocalData<GlobalSettings>(LOCAL_STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
    cachedGlobalSettings = local;
    callback(local);
  };

  const startSupabaseFallback = async () => {
    if (isSupabaseActive) return;
    isSupabaseActive = true;
    console.log('🔄 S1 [Firebase] failed/down. Activating S2 [Supabase] for global settings.');

    try {
      const data = await fetchSettingsFromSupabase();
      cachedGlobalSettings = data;
      callback(data);
    } catch (e) {
      console.warn('Supabase settings query failed, falling back to local storage', e);
      loadFallbackLocal();
    }

    try {
      supabaseSub = supabase
        .channel('settings-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, async () => {
          try {
            const data = await fetchSettingsFromSupabase();
            cachedGlobalSettings = data;
            callback(data);
          } catch (err) {
            console.warn('Supabase real-time settings error, querying Firebase primary...', err);
            if (isFirebaseConfigured && db) {
              startFirestorePrimary();
            }
          }
        })
        .subscribe();
    } catch (errSub) {
      console.warn('Supabase subscription channel failed:', errSub);
    }
  };

  const startFirestorePrimary = () => {
    if (isFirebaseConfigured && db) {
      try {
        isFirestoreActive = true;
        const settingsDocRef = doc(db, 'settings', 'global');
        unsubFirestore = onSnapshot(settingsDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const config: GlobalSettings = {
              bannerAdEnabled: !!data.bannerAdEnabled,
              bannerAdCode: data.bannerAdCode || '',
              popunderAdEnabled: !!data.popunderAdEnabled,
              popunderAdCode: data.popunderAdCode || '',
              welcomeTitle: data.welcomeTitle || DEFAULT_SETTINGS.welcomeTitle,
              welcomeMessage: data.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
              telegramUrl: data.telegramUrl || DEFAULT_SETTINGS.telegramUrl,
              privacyPolicyUrl: data.privacyPolicyUrl || DEFAULT_SETTINGS.privacyPolicyUrl,
              termsUrl: data.termsUrl || DEFAULT_SETTINGS.termsUrl,
              trafficSimulationEnabled: data.trafficSimulationEnabled !== undefined ? !!data.trafficSimulationEnabled : false,
              simulatedBaselineTraffic: data.simulatedBaselineTraffic !== undefined ? Number(data.simulatedBaselineTraffic) : 0,
              totalVisits: data.totalVisits !== undefined ? Number(data.totalVisits) : 0
            };
            cachedGlobalSettings = config;
            setLocalData(LOCAL_STORAGE_KEY_SETTINGS, config);
            callback(config);
          } else {
            callback(DEFAULT_SETTINGS);
          }
        }, (error) => {
          console.warn('Firestore settings update failed, trying Supabase primary...', error);
          isFirestoreActive = false;
          startSupabaseFallback();
        });
      } catch (err) {
        console.warn('Firestore primary settings initialization failed, falling back to Supabase...', err);
        isFirestoreActive = false;
        startSupabaseFallback();
      }
    } else {
      startSupabaseFallback();
    }
  };

  startFirestorePrimary();

  return () => {
    if (unsubFirestore) unsubFirestore();
    if (supabaseSub) supabase.removeChannel(supabaseSub);
  };
}

// -----------------------------------------------------------------
// AUTHENTICATION WRAPPERS
// -----------------------------------------------------------------
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
    const handler = () => {
      const localUserStr = localStorage.getItem('livekhela_mock_user');
      if (localUserStr) {
        const u = JSON.parse(localUserStr);
        callback(u, true);
      } else {
        callback(null, false);
      }
    };
    window.addEventListener('livekhela_mock_auth_update', handler);
    handler();
    return () => window.removeEventListener('livekhela_mock_auth_update', handler);
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
        await signOut(auth);
        throw new Error(`Unauthorized. Only ${AUTHORIZED_ADMIN} is permitted to access the admin console.`);
      }
      return { user: result.user, isAdmin: true };
    } catch (e: any) {
      console.error('Authentication Error:', e);
      throw e;
    }
  } else {
    const mockUser = {
      uid: 'mock-admin-uid',
      displayName: 'LiveKhela Admin',
      email: AUTHORIZED_ADMIN,
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop'
    };
    localStorage.setItem('livekhela_mock_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('livekhela_mock_auth_update'));
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
    localStorage.removeItem('livekhela_mock_user');
    window.dispatchEvent(new Event('livekhela_mock_auth_update'));
  }
}

// -----------------------------------------------------------------
// SYMMETRICAL WRITE OPERATIONS (firebase & supabase dual-write syncing)
// -----------------------------------------------------------------

export async function addMatch(m: Omit<Match, 'id' | 'createdAt'>) {
  const matchId = 'match_' + Date.now().toString(36);
  const currentTime = Date.now();
  const serialVal = m.serial !== undefined && m.serial !== null ? Number(m.serial) : 999;
  
  const fullMatch: Match = {
    ...m,
    id: matchId,
    serial: serialVal,
    createdAt: currentTime
  };

  // 1. Write to Firebase
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'matches', matchId), fullMatch);
    } catch (e) {
      console.warn('Firestore match insert failed, relying on Supabase backup:', e);
    }
  }

  // 2. Write to Supabase
  try {
    const { error } = await supabase.from('matches').insert([fullMatch]);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase match insert failed (table might not exist yet):', e);
  }

  // 3. Keep LocalStorage synchronized
  const list = getLocalData<Match[]>(LOCAL_STORAGE_KEY_MATCHES, []);
  setLocalData(LOCAL_STORAGE_KEY_MATCHES, [fullMatch, ...list]);
}

export async function deleteMatch(id: string) {
  // 1. Delete from Firebase
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'matches', id));
    } catch (e) {
      console.warn('Firestore match delete failed:', e);
    }
  }

  // 2. Delete from Supabase
  try {
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase match delete failed:', e);
  }

  // 3. LocalStorage
  const list = getLocalData<Match[]>(LOCAL_STORAGE_KEY_MATCHES, []);
  setLocalData(LOCAL_STORAGE_KEY_MATCHES, list.filter(item => item.id !== id));
}

export async function updateMatch(id: string, m: Omit<Match, 'id' | 'createdAt'>) {
  const serialVal = m.serial !== undefined && m.serial !== null ? Number(m.serial) : 999;
  
  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'matches', id), {
        ...m,
        serial: serialVal
      });
    } catch (e) {
      console.warn('Firestore match update failed:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('matches').update({
      ...m,
      serial: serialVal
    }).eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase match update failed:', e);
  }

  // 3. LocalStorage
  const list = getLocalData<Match[]>(LOCAL_STORAGE_KEY_MATCHES, []);
  setLocalData(LOCAL_STORAGE_KEY_MATCHES, list.map(item => item.id === id ? { ...item, ...m, serial: serialVal } : item));
}

export async function addUpcomingMatch(um: Omit<UpcomingMatch, 'id' | 'createdAt'>) {
  const umId = 'upcoming_' + Date.now().toString(36);
  const currentTime = Date.now();
  const serialVal = um.serial !== undefined && um.serial !== null ? Number(um.serial) : 999;

  const fullUM: UpcomingMatch = {
    ...um,
    id: umId,
    serial: serialVal,
    createdAt: currentTime
  };

  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'upcoming', umId), fullUM);
    } catch (e) {
      console.warn('Firestore upcoming match insert failed:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('upcoming').insert([fullUM]);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase upcoming match insert failed:', e);
  }

  // 3. LocalStorage
  const list = getLocalData<UpcomingMatch[]>(LOCAL_STORAGE_KEY_UPCOMING, []);
  setLocalData(LOCAL_STORAGE_KEY_UPCOMING, [...list, fullUM]);
}

export async function deleteUpcomingMatch(id: string) {
  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'upcoming', id));
    } catch (e) {
      console.warn('Firestore upcoming match delete failed:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('upcoming').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase upcoming match delete failed:', e);
  }

  // 3. LocalStorage
  const list = getLocalData<UpcomingMatch[]>(LOCAL_STORAGE_KEY_UPCOMING, []);
  setLocalData(LOCAL_STORAGE_KEY_UPCOMING, list.filter(item => item.id !== id));
}

export async function updateUpcomingMatch(id: string, um: Omit<UpcomingMatch, 'id' | 'createdAt'>) {
  const serialVal = um.serial !== undefined && um.serial !== null ? Number(um.serial) : 999;

  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'upcoming', id), {
        ...um,
        serial: serialVal
      });
    } catch (e) {
      console.warn('Firestore upcoming match update failed:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('upcoming').update({
      ...um,
      serial: serialVal
    }).eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase upcoming match update failed:', e);
  }

  // 3. LocalStorage
  const list = getLocalData<UpcomingMatch[]>(LOCAL_STORAGE_KEY_UPCOMING, []);
  setLocalData(LOCAL_STORAGE_KEY_UPCOMING, list.map(item => item.id === id ? { ...item, ...um, serial: serialVal } : item));
}

export async function transitionMatchToLive(um: UpcomingMatch) {
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
    competition: um.competition,
    serial: um.serial
  });
  await deleteUpcomingMatch(um.id);
}

export async function addChannel(ch: Omit<Channel, 'id' | 'createdAt'>) {
  const chId = 'channel_' + Date.now().toString(36);
  const currentTime = Date.now();
  const serialVal = ch.serial !== undefined && ch.serial !== null ? Number(ch.serial) : 999;

  const fullCh: Channel = {
    ...ch,
    id: chId,
    serial: serialVal,
    createdAt: currentTime
  };

  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'channels', chId), fullCh);
    } catch (e) {
      console.warn('Firestore channel insert failed:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('channels').insert([fullCh]);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase channel insert failed (table might not exist yet):', e);
  }

  // 3. LocalStorage
  const list = getLocalData<Channel[]>(LOCAL_STORAGE_KEY_CHANNELS, []);
  setLocalData(LOCAL_STORAGE_KEY_CHANNELS, [fullCh, ...list]);
}

export async function deleteChannel(id: string) {
  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'channels', id));
    } catch (e) {
      console.warn('Firestore channel delete failed:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('channels').delete().eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase channel delete failed:', e);
  }

  // 3. LocalStorage
  const list = getLocalData<Channel[]>(LOCAL_STORAGE_KEY_CHANNELS, []);
  setLocalData(LOCAL_STORAGE_KEY_CHANNELS, list.filter(item => item.id !== id));
}

export async function updateChannel(id: string, ch: Omit<Channel, 'id' | 'createdAt'>) {
  const serialVal = ch.serial !== undefined && ch.serial !== null ? Number(ch.serial) : 999;

  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'channels', id), {
        ...ch,
        serial: serialVal
      });
    } catch (e) {
      console.warn('Firestore channel update failed:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('channels').update({
      ...ch,
      serial: serialVal
    }).eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase channel update failed:', e);
  }

  // 3. LocalStorage
  const list = getLocalData<Channel[]>(LOCAL_STORAGE_KEY_CHANNELS, []);
  setLocalData(LOCAL_STORAGE_KEY_CHANNELS, list.map(item => item.id === id ? { ...item, ...ch, serial: serialVal } : item));
}

export async function saveGlobalSettings(s: GlobalSettings) {
  const payload = {
    ...s,
    totalVisits: s.totalVisits !== undefined ? s.totalVisits : (cachedGlobalSettings.totalVisits || 0),
    trafficSimulationEnabled: s.trafficSimulationEnabled !== undefined ? !!s.trafficSimulationEnabled : false,
    simulatedBaselineTraffic: s.simulatedBaselineTraffic !== undefined ? Number(s.simulatedBaselineTraffic) : 0,
    updatedAt: Date.now()
  };

  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'settings', 'global'), payload);
    } catch (e) {
      console.warn('Firestore settings update failed:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('settings').upsert({
      id: 'global',
      ...payload
    });
    if (error) throw error;
  } catch (e) {
    console.warn('Supabase settings upsert failed:', e);
  }

  // Save in local module cache
  cachedGlobalSettings = payload;

  // 3. LocalStorage
  setLocalData(LOCAL_STORAGE_KEY_SETTINGS, payload);
}

// -----------------------------------------------------------------
// ACTIVE SESSIONS REAL-TIME ANALYTICS (DEGRADES GRACEFULLY)
// -----------------------------------------------------------------
export interface ActiveSession {
  id: string;
  lastActive: number;
  platform: 'Android App' | 'Website Browser';
  userAgent: string;
}

export async function registerUniqueDeviceVisit(isAndroidApp: boolean) {
  const alreadyRegistered = localStorage.getItem('livekhela_unique_device_registered');
  if (alreadyRegistered === 'true') return;

  const deviceId = 'visit_' + Math.floor(Math.random() * 10000000) + '_' + Date.now().toString(36);
  const payload = {
    id: deviceId,
    lastActive: Date.now(),
    platform: isAndroidApp ? 'Android App' : 'Website Browser' as const,
    userAgent: navigator.userAgent
  };

  // 1. Firebase write
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'active_sessions', deviceId), {
        lastActive: payload.lastActive,
        platform: payload.platform,
        userAgent: payload.userAgent,
        isUniqueVisit: true
      });
    } catch (e) {
      console.warn('Firestore register unique visit failed:', e);
    }
  }

  // 2. Supabase write
  try {
    await supabase.from('active_sessions').upsert([payload]);
  } catch (e) {
    console.warn('Supabase register unique visit failed:', e);
  }

  // Save registration token to prevent re-counting
  localStorage.setItem('livekhela_unique_device_registered', 'true');
}

export async function pingActiveSession(sessionId: string, isAndroidApp: boolean) {
  const payload = {
    id: sessionId,
    lastActive: Date.now(),
    platform: isAndroidApp ? 'Android App' : 'Website Browser' as const,
    userAgent: navigator.userAgent
  };

  // 1. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'active_sessions', sessionId), {
        lastActive: payload.lastActive,
        platform: payload.platform,
        userAgent: payload.userAgent
      });
    } catch (e) {
      console.warn('Real-time session ping omitted on Firebase:', e);
    }
  }

  // 2. Supabase
  try {
    const { error } = await supabase.from('active_sessions').upsert([payload]);
    if (error) throw error;
  } catch (e) {
    // Fail silently to avoid interrupting stream or analytics
  }

  // 3. Local Storage fallback update
  const locals = getLocalData<any[]>('livekhela_mock_sessions', []);
  const filtered = locals.filter(s => s.lastActive > Date.now() - 300000);
  const index = filtered.findIndex(s => s.id === sessionId);
  if (index >= 0) {
    filtered[index].lastActive = Date.now();
  } else {
    filtered.push(payload);
  }
  setLocalData('livekhela_mock_sessions', filtered);
}

export async function purgeStaleSessions() {
  const threshold = Date.now() - 1800000; // 30 minutes
  
  if (isFirebaseConfigured && db) {
    try {
      console.log('Purging stale database logs prior to:', new Date(threshold).toISOString());
    } catch (e) {
      console.error('Stale purge failure Firebase:', e);
    }
  }
  
  try {
    // We strictly preserve any lifelong 'visit_' logs so cumulative visitor metrics are NEVER lost!
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .lt('lastActive', threshold)
      .not('id', 'like', 'visit_%');
    if (error) throw error;
  } catch (e) {
    // Fail silently
  }
}

export function subscribeToActiveSessions(callback: (sessions: ActiveSession[]) => void) {
  let unsubFirestore: (() => void) | null = null;
  let isFirestoreActive = false;

  const publishList = (list: ActiveSession[]) => {
    // Filter out mock data completely
    const cleanList = list.filter(session => !session.id.includes('mock_') && !session.id.includes('visit_mock'));
    callback(cleanList);
  };

  const startFirestorePrimary = () => {
    if (isFirebaseConfigured && db) {
      try {
        isFirestoreActive = true;
        const q = collection(db, 'active_sessions');
        unsubFirestore = onSnapshot(q, (snapshot) => {
          const list: ActiveSession[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            const id = d.id;
            // Prevent mock/simulated traffic data
            if (!id.includes('mock_') && !id.includes('visit_mock')) {
              list.push({
                id: d.id,
                lastActive: data.lastActive || 0,
                platform: data.platform || 'Website Browser',
                userAgent: data.userAgent || ''
              });
            }
          });
          publishList(list);
        }, (error) => {
          console.warn('Active session subscription query failed, showing local storage fallback...', error);
          isFirestoreActive = false;
          fallbackLocal();
        });
      } catch (e) {
        console.warn('Primary active session failed, showing local fallback:', e);
        isFirestoreActive = false;
        fallbackLocal();
      }
    } else {
      fallbackLocal();
    }
  };

  const fallbackLocal = () => {
    const list = getLocalData<ActiveSession[]>('livekhela_mock_sessions', []);
    publishList(list);
  };

  startFirestorePrimary();

  // Listen for local updates to fallbacks if any
  const localUpdateHandler = () => {
    if (!isFirestoreActive) {
      fallbackLocal();
    }
  };
  window.addEventListener('livekhela_local_update', localUpdateHandler);

  return () => {
    if (unsubFirestore) unsubFirestore();
    window.removeEventListener('livekhela_local_update', localUpdateHandler);
  };
}

export async function incrementPageVisit() {
  const alreadyVisitedThisSession = sessionStorage.getItem('livekhela_visited_session');
  if (alreadyVisitedThisSession === 'true') return;
  sessionStorage.setItem('livekhela_visited_session', 'true');

  // 1. Firebase increment atomically using increment(1)
  if (isFirebaseConfigured && db) {
    try {
      const globDocRef = doc(db, 'settings', 'global');
      const globSnap = await getDoc(globDocRef);
      if (globSnap.exists()) {
        await updateDoc(globDocRef, {
          totalVisits: increment(1)
        });
      } else {
        await setDoc(globDocRef, {
          ...DEFAULT_SETTINGS,
          totalVisits: 1
        });
      }
    } catch (err) {
      console.warn('Failed to increment totalVisits in Firebase:', err);
    }
  }

  // 2. Supabase increment atomically or fetch and update
  try {
    const { data: dbData } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
    const supabaseVisits = Number(dbData?.totalVisits || 0);
    const nextVisits = supabaseVisits + 1;
    
    await supabase.from('settings').upsert({
      id: 'global',
      totalVisits: nextVisits
    });
  } catch (err) {
    console.warn('Failed to increment totalVisits in Supabase:', err);
  }

  // 3. Local storage increment as fallback
  try {
    const localSettings = getLocalData<GlobalSettings>(LOCAL_STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
    localSettings.totalVisits = Number(localSettings.totalVisits || 0) + 1;
    setLocalData(LOCAL_STORAGE_KEY_SETTINGS, localSettings);
  } catch (err) {
    console.warn('Failed to increment local storage visits:', err);
  }
}

