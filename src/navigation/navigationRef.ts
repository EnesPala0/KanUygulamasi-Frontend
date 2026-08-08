import { createNavigationContainerRef } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

export const navigationRef = createNavigationContainerRef<any>();

export const logoutAndRedirect = async () => {
  try {
    await SecureStore.deleteItemAsync('userToken');
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  } catch (e) {
    console.error('Logout error:', e);
  }
};
