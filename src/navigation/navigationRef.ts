import { createNavigationContainerRef } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export const navigationRef = createNavigationContainerRef<any>();

let isLoggingOut = false;

export const logoutAndRedirect = async () => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    await SecureStore.deleteItemAsync('userToken');
    
    Alert.alert(
      'Oturum Süresi Doldu',
      'Güvenliğiniz için oturumunuz sonlandırıldı. Lütfen hesabınıza tekrar giriş yapın.',
      [
        {
          text: 'Giriş Yap',
          onPress: () => {
            if (navigationRef.isReady()) {
              navigationRef.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
            isLoggingOut = false;
          }
        }
      ],
      { cancelable: false }
    );
  } catch (e) {
    console.error('Logout error:', e);
    isLoggingOut = false;
  }
};
