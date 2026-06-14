import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Prilagođeno skladište koje sprečava "window is not defined" grešku tokom SSR renderovanja
const customAsyncStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null; // Ako je SSR (server), preskoči
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customAsyncStorage, // Koristimo naš bezbedni omotač umesto direktnog AsyncStorage-a
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});