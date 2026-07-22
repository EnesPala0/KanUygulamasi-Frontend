import { createNavigationContainerRef } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const navigationRef = createNavigationContainerRef<any>();

export const logoutAndRedirect = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
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
