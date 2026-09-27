import * as SecureStore from 'expo-secure-store';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const prerenderStorage = new Map<string, string>();
const storage: SupportedStorage = {
  getItem: async (key) => {
    if (Platform.OS !== 'web') return SecureStore.getItemAsync(key);
    if (typeof window !== 'undefined') return window.localStorage.getItem(key);
    return prerenderStorage.get(key) ?? null;
  },
  setItem: async (key, value) => {
    if (Platform.OS !== 'web') return SecureStore.setItemAsync(key, value);
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    else prerenderStorage.set(key, value);
  },
  removeItem: async (key) => {
    if (Platform.OS !== 'web') return SecureStore.deleteItemAsync(key);
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    else prerenderStorage.delete(key);
  },
};
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zwhgxgzhqchghfelnemq.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const supabase = createClient(url, key, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
