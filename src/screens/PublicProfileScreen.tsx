import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPublicProfile } from '../api/auth';

const getBloodTypeBgColor = (bloodType: string) => {
  if (!bloodType) return '#1A1A2E';
  if (bloodType.startsWith('A') && !bloodType.startsWith('AB')) return '#E63946';
  if (bloodType.startsWith('B')) return '#457B9D';
  if (bloodType.startsWith('AB')) return '#E9C46A';
  if (bloodType.startsWith('0') || bloodType.startsWith('O')) return '#264653';
  return '#1A1A2E';
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export default function PublicProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicProfile(userId);
      setUserData(data);
    } catch (e) {
      console.log('Public profile error:', e);
      setError('Kullanıcı bilgileri alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  if (error || !userData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#E63946" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 16, color: '#666' }}>{error || 'Kullanıcı bulunamadı.'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 12, backgroundColor: '#E63946', borderRadius: 8 }}>
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${userData.first_name} ${userData.last_name}`;
  const initial = userData.first_name ? userData.first_name.charAt(0).toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gönüllü Profili</Text>
          <View style={{ width: 32 }} /> 
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{fullName}</Text>
            <View style={styles.profileBadges}>
              <View style={[styles.profileBadge, { backgroundColor: getBloodTypeBgColor(userData.blood_type) }]}>
                <Text style={styles.profileBadgeText}>{userData.blood_type || 'Bilinmiyor'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="water" size={22} color="#DC2626" />
            </View>
            <Text style={styles.statValue}>{userData.total_donations || 0}</Text>
            <Text style={styles.statLabel}>Toplam Bağış</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="heart" size={22} color="#DB2777" />
            </View>
            <Text style={styles.statValue}>{userData.saved_lives || 0}</Text>
            <Text style={styles.statLabel}>Hayat Kurtardı</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="flame" size={22} color="#D97706" />
            </View>
            <Text style={styles.statValue}>{userData.streak_years || 0} Yıl</Text>
            <Text style={styles.statLabel}>Bağış Serisi</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Genel Bilgiler</Text>
          <InfoRow label="Şehir" value={userData.city || 'Belirtilmemiş'} />
          <InfoRow label="Kan Grubu" value={userData.blood_type || 'Bilinmiyor'} />
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#E63946', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#E63946' },
  profileDetails: { flex: 1 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  profileBadges: { flexDirection: 'row' },
  profileBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  profileBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  scrollContent: { padding: 16, marginTop: -20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    paddingVertical: 18, 
    paddingHorizontal: 8,
    alignItems: 'center', 
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#666', fontWeight: '600', textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#333' },
});
