import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { navigationRef } from './src/navigation/navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Uygulama açıkken (foreground) bildirimlerin ekranda pop-up (banner) olarak görünmesini sağlar
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ekranlar
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ListingDetailScreen from './src/screens/ListingDetailScreen';
import CreateListingScreen from './src/screens/CreateListingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MyListingDetailScreen from './src/screens/MyListingDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PublicProfileScreen from './src/screens/PublicProfileScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import LegalScreen from './src/screens/LegalScreen';

// Navigator'lar
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// ─── Home Tab Stack (Ana Sayfa → İlan Detay, Bildirimler) ───
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

// ─── Profil Tab Stack (Profil → Açtığım İlan Detayı) ───
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="MyListingDetail" component={MyListingDetailScreen} />
      <ProfileStack.Screen name="ListingDetail" component={ListingDetailScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Custom Tab Bar (ortada büyük + butonu) ───
function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={tabStyles.container}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const isCreateButton = route.name === 'CreateListing';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Ortadaki büyük + butonu
        if (isCreateButton) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={tabStyles.createWrapper}
              activeOpacity={0.8}
            >
              <View style={tabStyles.createButton}>
                <Ionicons name="add" size={32} color="#FFF" />
              </View>
            </TouchableOpacity>
          );
        }

        // Normal tab butonları
        let iconName: any = 'home-outline';
        let label = '';
        if (route.name === 'HomeTab') {
          iconName = isFocused ? 'home' : 'home-outline';
          label = 'Ana Sayfa';
        } else if (route.name === 'ProfileTab') {
          iconName = isFocused ? 'person' : 'person-outline';
          label = 'Profil';
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={tabStyles.tab}
            activeOpacity={0.7}
          >
            <Ionicons name={iconName} size={24} color={isFocused ? '#E63946' : '#999'} style={{ marginBottom: 2 }} />
            <Text style={[tabStyles.tabLabel, isFocused && tabStyles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Ana Tab Navigator ───
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} />
      <Tab.Screen
        name="CreateListing"
        component={CreateListingScreen}
        listeners={({ navigation }) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate('CreateListingModal');
          },
        })}
      />
      <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

// ─── Splash Screen (Otomatik Giriş Kontrolü) ───
function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (e) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    };
    checkAuth();
  }, [navigation]);

  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.logoCircle}>
        <Ionicons name="water" size={44} color="#E63946" />
      </View>
      <Text style={splashStyles.appName}>KanBağı</Text>
      <ActivityIndicator size="large" color="#FFF" style={{ marginTop: 25 }} />
    </View>
  );
}

// ─── Root Navigator ───
export default function App() {
  useEffect(() => {
    // Kullanıcı kapalı/arkaplandaki uygulamadan gelen bir bildirime tıkladığında çalışacak Listener
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Push Bildirimine Tıklandı, Gelen Data:', data);
      
      // Eğer backend'den gelen bildirimde 'blood_request_id' varsa, direkt o ilanın detayına yönlendir
      if (data && data.blood_request_id) {
        if (navigationRef.isReady()) {
          navigationRef.navigate('ListingDetail', { id: data.blood_request_id });
        }
      }
    });

    return () => {
      responseListener.remove();
    };
  }, []);

  const prefix = Linking.createURL('/');
  const linking = {
    prefixes: [prefix, 'kanbagi://'],
    config: {
      screens: {
        ListingDetail: 'ilan/:id',
      },
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          {/* Splash Check */}
          <Stack.Screen name="Splash" component={SplashScreen} />
          {/* Auth */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
          <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
          <Stack.Screen name="LegalScreen" component={LegalScreen} options={{ presentation: 'modal' }} />
          {/* Ana Uygulama */}
          <Stack.Screen name="Main" component={MainTabs} options={{ gestureEnabled: false }} />
          {/* Global Detay Ekranları */}
          <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
          <Stack.Screen name="MyListingDetail" component={MyListingDetailScreen} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
          {/* Yeni İlan Modal */}
          <Stack.Screen
            name="CreateListingModal"
            component={CreateListingScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// ─── Tab Bar Stilleri ───
const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingBottom: 25,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#E63946',
  },
  createWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E63946',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  createText: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '300',
    marginTop: -2,
  },
});

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E63946',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});