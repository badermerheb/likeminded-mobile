import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  get: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // silent fail
    }
  },
  remove: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // silent fail
    }
  },
};
