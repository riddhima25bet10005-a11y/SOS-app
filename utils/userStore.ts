import AsyncStorage from '@react-native-async-storage/async-storage';

export let userProfileData = {
  name: 'User',
  phone: '+91 XXXXX XXXXX',
  bloodGroup: 'O+',
  emergencyContact1: 'Mom: +91 99999 88888',
  emergencyContact2: 'Dad: +91 77777 66666',
  allergies: 'None',
  medicalConditions: 'None',
  address: '123 Safety Ave, Emergency City, 400001',
  locationSharing: false,
  notifications: true,
  theme: 'dark' as 'dark' | 'light',
  country: 'India 🇮🇳',
  language: 'English',
  isHelper: false,
  hasRegisteredAsHelper: false,
  helperStatus: 'offline' as 'available' | 'offline',
  currentRequestId: null as string | null,
  isLoggedIn: false,
};

// Simple obfuscation to prevent plain-text PII in localStorage
const encodeData = (data: string) => {
  try {
    if (typeof window !== 'undefined' && window.btoa) {
      const b64 = window.btoa(encodeURIComponent(data));
      return b64.split('').reverse().join('');
    }
  } catch (e) {}
  return data;
};

const decodeData = (data: string) => {
  try {
    if (typeof window !== 'undefined' && window.atob) {
      const reversed = data.split('').reverse().join('');
      return decodeURIComponent(window.atob(reversed));
    }
  } catch (e) {}
  return data;
};

export const loadProfile = async () => {
  try {
    const saved = await AsyncStorage.getItem('user_profile_secure');
    if (saved) {
      const decoded = decodeData(saved);
      userProfileData = { ...userProfileData, ...JSON.parse(decoded) };
    } else {
      // Fallback for migrating old plaintext data
      const oldSaved = await AsyncStorage.getItem('user_profile');
      if (oldSaved) {
        userProfileData = { ...userProfileData, ...JSON.parse(oldSaved) };
        updateProfile({}); // Resave securely
      }
    }
  } catch (e) {
    console.error('Failed to load profile', e);
  }
};

export const updateProfile = (data: Partial<typeof userProfileData>) => {
  userProfileData = { ...userProfileData, ...data };
  const encoded = encodeData(JSON.stringify(userProfileData));
  AsyncStorage.setItem('user_profile_secure', encoded).catch(e => console.error(e));
};

export let globalRequests: any[] = [];
export let globalMessages: Record<string, any[]> = {};

export const setGlobalRequests = (requests: any[]) => {
  globalRequests = requests;
};

export const addMessageGlobal = (reqId: string, message: any) => {
  if (!globalMessages[reqId]) {
    globalMessages[reqId] = [];
  }
  globalMessages[reqId] = [...globalMessages[reqId], message];
};
