import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OfflineNotice() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Expo ve RN'de bazen initial state false/null gelebilir, asıl değer network değişiminde gelir.
      if (state.isConnected !== null) {
        setIsConnected(state.isConnected && state.isInternetReachable !== false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top : 40 }]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.offlineText}>İnternet Bağlantısı Yok. Lütfen ağ ayarlarınızı kontrol edin.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E63946',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 9999,
    elevation: 9999, // Android z-index fix
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  offlineText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  }
});
