import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, StatusBar, RefreshControl, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllBloodRequests, getNotifications, getUserProfile, getMyApplications, syncLocationAndToken } from '../api/blood';
import { TURKEY_CITIES } from '../constants/cities';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';


const getUrgencyColor = (urgency: string) => {
  if (urgency === 'Kritik') return '#E63946';
  if (urgency === 'Acil') return '#F4845F';
  if (urgency === 'Normal') return '#2EC4B6';
  return '#1A1A2E';
};

const getBloodTypeBgColor = (bloodType: string) => {
  if (!bloodType) return '#1A1A2E';
  if (bloodType.startsWith('A') && !bloodType.startsWith('AB')) return '#E63946';
  if (bloodType.startsWith('B')) return '#457B9D';
  if (bloodType.startsWith('AB')) return '#E9C46A';
  if (bloodType.startsWith('0') || bloodType.startsWith('O')) return '#264653';
  return '#1A1A2E';
};

export default function HomeScreen({ navigation }: any) {
  // GERÇEK VERİLER İÇİN STATE'LER
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [activeBloodType, setActiveBloodType] = useState('Tümü');
  const [activeCity, setActiveCity] = useState('Tümü');
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCityModalVisible, setCityModalVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const urgencyFilters = ['Tümü', 'Normal', 'Acil', 'Kritik'];
  const bloodTypeFilters = ['Tümü', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

  const filteredCitiesForModal = ['Tümü', ...TURKEY_CITIES].filter(c => 
    c === 'Tümü' || c.toLowerCase().includes(citySearchQuery.toLowerCase().trim())
  );

  useEffect(() => {
    const getLocationAndToken = async () => {
      try {
        let pushToken = "";
        let lat = 0;
        let lon = 0;

        // 1. BİLDİRİM İZNİ VE TOKEN ALMA
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          
          if (finalStatus === 'granted') {
            const Constants = require('expo-constants');
            const projectId = Constants.default.expoConfig?.extra?.eas?.projectId || Constants.default.easConfig?.projectId;

            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });
            pushToken = tokenData.data;
          }
        }

        // 2. KONUM İZNİ VE KOORDİNATLARI ALMA
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          lat = location.coords.latitude;
          lon = location.coords.longitude;
        }

        // 3. EĞER VERİLER ALINDIysa KONSOLA YAZ VE GO'YA GÖNDER
        if (pushToken !== "" || (lat !== 0 && lon !== 0)) {
          console.log("🔥 ALINAN VERİLER -> Token:", pushToken, "| Lat:", lat, "| Lon:", lon);
          
          try {
            // Verileri Go'ya yolluyoruz
            await syncLocationAndToken({
              latitude: lat,
              longitude: lon,
              expo_push_token: pushToken
            });
            console.log("✅ İstihbarat Go'ya başarıyla ulaştı!");
          } catch (err) {
            console.log("❌ Go'ya gönderirken hata çıktı:", err);
          }
        }

      } catch (error) {
        console.error("İzinler alınırken hata:", error);
      }
    };

    getLocationAndToken();
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const data = await getNotifications();
      const rawArray = Array.isArray(data) ? data : (data?.data || data?.notifications || []);
      const unread = rawArray.filter((item: any) => !item.is_read && !item.isRead).length;
      setUnreadCount(unread);
    } catch (e) {
      console.log('Bildirim sayısı alınamadı:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchListings();
      fetchUnreadNotifications();
    }, [])
  );

  // GO BACKEND'İNDEN VERİ ÇEKME VE ADAPTASYON (Senin Go Modeline Göre)
  const fetchListings = async () => {
    try {
      setLoading(true);
      const [data, profileRes, myAppsRes] = await Promise.all([
        getAllBloodRequests(),
        getUserProfile().catch(() => null),
        getMyApplications().catch(() => [])
      ]);
      console.log("Go'dan Gelen Ham İlan Verisi:", data);

      let userObj = profileRes?.data || profileRes?.user || profileRes || null;
      const currentUserId = userObj?.ID || userObj?.id || null;

      const rawArray = Array.isArray(data) ? data : (data.blood_requests || data.data || data.requests || []);
      const myAppsArray = Array.isArray(myAppsRes) ? myAppsRes : (myAppsRes?.data || myAppsRes?.applications || []);

      const formattedListings = rawArray
        .filter((item: any) => {
          const s = (item.status || item.Status || '').toString().toLowerCase();
          return s !== 'expired' && s !== 'süresi doldu';
        })
        .map((item: any) => {
          const rawStatus = (item.status || item.Status || '').toString().toLowerCase();
        const volArray = Array.isArray(item.volunteers) ? item.volunteers : [];
        const hasApprovedVolunteer = volArray.some((v: any) => {
          const vs = (v.status || v.Status || '').toString().toLowerCase();
          return vs === 'approved' || vs === 'accepted' || vs === 'onaylandı' || vs === 'kabul' || vs === 'active';
        });

        const ownerId = item.user_id || item.UserID || (item.user && (item.user.ID || item.user.id));
        const checkMine = currentUserId && ownerId && currentUserId === ownerId;

        const itemId = item.ID || item.id;
        const myAppRecord = myAppsArray.find((app: any) => {
          const appId = app.blood_request_id || app.BloodRequestID || app.request_id || (app.blood_request && (app.blood_request.ID || app.blood_request.id));
          return appId && itemId && appId.toString() === itemId.toString();
        });

        let computedStatus = 'Aktif';
        let displayStatusText = 'Yayında';

        if (rawStatus === 'resolved' || rawStatus === 'completed' || rawStatus === 'tamamlandı' || rawStatus === 'karşılandı' || rawStatus === 'closed') {
          computedStatus = 'Tamamlandı';
          displayStatusText = 'İhtiyaç Karşılandı';
        } else if (hasApprovedVolunteer || rawStatus === 'approved' || rawStatus === 'accepted' || rawStatus === 'onaylandı' || rawStatus === 'kabul' || rawStatus === 'in_progress') {
          computedStatus = 'Onaylandı';
          displayStatusText = 'Gönüllü Bulundu';
        } else if (rawStatus === 'cancelled' || rawStatus === 'iptal') {
          computedStatus = 'İptal Edildi';
          displayStatusText = 'İptal Edildi';
        }

        return {
          id: item.ID?.toString() || Math.random().toString(),
          patientName: item.user ? `${item.user.first_name} ${item.user.last_name}` : "İhtiyaç Sahibi",
          bloodType: item.required_blood_type || "Bilinmiyor",
          hospital: item.hospital_name || "Belirtilmemiş Hastane",
          city: item.city || "",
          district: item.district || "",
          location: item.district && item.city ? `${item.district}, ${item.city}` : (item.city || item.district || "Belirtilmemiş Şehir"),
          unitsNeeded: item.required_units || 1,
          urgency: item.urgency_level || "Acil",
          timeAgo: displayStatusText,
          status: computedStatus,
          medicalNote: item.medical_note || "",
          volunteers: volArray,
          isMine: !!checkMine,
          isAlreadyVolunteered: !!myAppRecord,
          userId: ownerId
        };
      });

      setListings(formattedListings);
    } catch (error: any) {
      console.log("İlanlar çekilirken hata:", error?.message || error);
      Alert.alert('Hata', 'İlanlar sunucudan alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Gerçek yenileme işlemi
    Promise.all([fetchListings(), fetchUnreadNotifications()]).then(() => setRefreshing(false));
  };



  // MOCK_LISTINGS YERİNE ARTIK GERÇEK 'listings' FİLTRELENİYOR
  const filteredListings = listings.filter(item => {
    const matchUrgency = activeFilter === 'Tümü' || (item.urgency && item.urgency.toLowerCase() === activeFilter.toLowerCase());
    const matchBlood = activeBloodType === 'Tümü' || item.bloodType === activeBloodType;
    const matchCity = activeCity === 'Tümü' || (item.city && item.city.toLowerCase() === activeCity.toLowerCase()) || (item.location && item.location.toLowerCase().includes(activeCity.toLowerCase()));
    return matchUrgency && matchBlood && matchCity;
  });

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('ListingDetail', { listing: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.patientInfo}>
          <View style={[styles.bloodBadge, { backgroundColor: getBloodTypeBgColor(item.bloodType) }]}>
            <Text style={styles.bloodBadgeText}>{item.bloodType}</Text>
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.patientName} numberOfLines={1}>{item.patientName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Ionicons name="location-outline" size={13} color="#666" style={{ marginRight: 3, flexShrink: 0 }} />
              <Text style={styles.hospital} numberOfLines={1} ellipsizeMode="tail">{item.hospital}, {item.location}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.urgencyBadge, { borderColor: getUrgencyColor(item.urgency) }]}>
          <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(item.urgency) }]} />
          <Text style={[styles.urgencyText, { color: getUrgencyColor(item.urgency) }]}>{item.urgency}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
          <Ionicons name="water-outline" size={15} color="#E63946" style={{ marginRight: 4 }} />
          <Text style={styles.footerText}>{item.unitsNeeded} Ünite</Text>
        </View>
        <View style={[
          styles.statusBadgeHome,
          item.status === 'Tamamlandı' ? { backgroundColor: '#E8F8F5', borderColor: '#2EC4B6' } :
          item.status === 'Onaylandı' ? { backgroundColor: '#EBF5FB', borderColor: '#3498DB' } :
          item.status === 'İptal Edildi' ? { backgroundColor: '#FDEDEC', borderColor: '#E63946' } :
          { backgroundColor: '#F4F6F7', borderColor: '#D5D8DC' },
          { flexShrink: 1, marginLeft: 8 }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
            <Ionicons 
              name={
                item.status === 'Tamamlandı' ? 'checkmark-circle-outline' :
                item.status === 'Onaylandı' ? 'people-outline' :
                item.status === 'İptal Edildi' ? 'close-circle-outline' :
                'pulse-outline'
              } 
              size={13} 
              color={
                item.status === 'Tamamlandı' ? '#16A085' :
                item.status === 'Onaylandı' ? '#2980B9' :
                item.status === 'İptal Edildi' ? '#C0392B' :
                '#5D6D7E'
              } 
              style={{ marginRight: 4 }} 
            />
            <Text 
              numberOfLines={1} 
              ellipsizeMode="tail"
              style={[
              styles.statusTextHome,
              item.status === 'Tamamlandı' ? { color: '#16A085', fontWeight: 'bold' } :
              item.status === 'Onaylandı' ? { color: '#2980B9', fontWeight: 'bold' } :
              item.status === 'İptal Edildi' ? { color: '#C0392B', fontWeight: 'bold' } :
              { color: '#5D6D7E', fontWeight: '600' },
              { flexShrink: 1 }
            ]}>
              {item.status === 'Tamamlandı' ? 'İhtiyaç Karşılandı' :
               item.status === 'Onaylandı' ? 'Gönüllü Bulundu' :
               item.status === 'İptal Edildi' ? 'İptal Edildi' :
               'Yayında (Aktif)'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kan İstekleri</Text>
          <Text style={styles.subtitle}>{filteredListings.length} aktif ilan</Text>
        </View>
        <TouchableOpacity 
          style={styles.bellButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>



      <View style={styles.filtersContainerAll}>
        {/* Akıllı Şehir/Konum Seçici Bar */}
        <View style={styles.cityFilterRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6 }}>
            <Ionicons name="location-outline" size={16} color="#444" style={{ marginRight: 3 }} />
            <Text style={styles.cityFilterLabel}>Şehir:</Text>
          </View>
          <TouchableOpacity 
            style={[styles.cityChipButton, activeCity !== 'Tümü' && styles.cityChipButtonActive]}
            onPress={() => setCityModalVisible(true)}
          >
            <Text style={[styles.cityChipText, activeCity !== 'Tümü' && styles.cityChipTextActive]}>
              {activeCity === 'Tümü' ? 'Tüm Şehirler (Seç ▾)' : activeCity}
            </Text>
            {activeCity !== 'Tümü' && (
              <TouchableOpacity 
                style={styles.cityChipClear} 
                onPress={() => setActiveCity('Tümü')}
              >
                <Ionicons name="close-circle" size={16} color="#FFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Aciliyet Filtresi */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Aciliyet</Text>
          <FlatList 
            data={urgencyFilters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => 'u-' + item}
            contentContainerStyle={styles.filtersContainer}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.filterPill, activeFilter === item && styles.activeFilterPill]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[styles.filterText, activeFilter === item && styles.activeFilterText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Kan Grubu Filtresi */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Kan Grubu</Text>
          <FlatList 
            data={bloodTypeFilters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => 'b-' + item}
            contentContainerStyle={styles.filtersContainer}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.filterPill, activeBloodType === item && styles.activeFilterPillBlood]}
                onPress={() => setActiveBloodType(item)}
              >
                <Text style={[styles.filterText, activeBloodType === item && styles.activeFilterText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/* Yüklenme Durumu ve Gerçek Liste */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#E63946" />
        </View>
      ) : (
        <FlatList 
          data={filteredListings}
          keyExtractor={(item, index) => `home-${item.id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="water-outline" size={40} color="#E63946" />
              </View>
              <Text style={styles.emptyTitle}>
                {(activeFilter !== 'Tümü' || activeBloodType !== 'Tümü' || activeCity !== 'Tümü') 
                  ? 'Seçilen Filtreye Uygun İlan Yok' 
                  : 'Şu An İçin Hiç Kan İlanı Bulunmuyor'}
              </Text>
              <Text style={styles.emptySubText}>
                {(activeFilter !== 'Tümü' || activeBloodType !== 'Tümü' || activeCity !== 'Tümü')
                  ? 'Filtreleri sıfırlayarak diğer şehir veya kan gruplarındaki acil ihtiyaçlara göz atabilirsiniz.'
                  : 'Sistemde henüz aktif bir kan talebi yok. Yeni bir talep olduğunda burada görünecektir.'}
              </Text>
              {(activeFilter !== 'Tümü' || activeBloodType !== 'Tümü' || activeCity !== 'Tümü') ? (
                <TouchableOpacity 
                  style={styles.emptyActionButton} 
                  onPress={() => {
                    setActiveFilter('Tümü');
                    setActiveBloodType('Tümü');
                    setActiveCity('Tümü');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="refresh-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyActionText}>Filtreleri Sıfırla</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.emptyActionButton} 
                  onPress={() => navigation.navigate('CreateListing')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="megaphone-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyActionText}>İlk Kan Talebini Oluştur</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#E63946']}
              tintColor="#E63946"
            />
          }
        />
      )}

      {/* Şehir Seçici Modal */}
      <Modal
        visible={isCityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtre için Şehir Seçin</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)} style={{ padding: 6 }}>
                <Ionicons name="close-outline" size={26} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Şehir ara (Örn: Ankara, İzmir)..."
              placeholderTextColor="#999"
              value={citySearchQuery}
              onChangeText={setCitySearchQuery}
              autoFocus={false}
            />
            <FlatList
              data={filteredCitiesForModal}
              keyExtractor={item => 'cm-' + item}
              style={{ maxHeight: 280 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cityItem, activeCity === item && styles.cityItemActive]}
                  onPress={() => {
                    setActiveCity(item);
                    setCityModalVisible(false);
                    setCitySearchQuery('');
                  }}
                >
                  <Text style={[styles.cityItemText, activeCity === item && styles.cityItemTextActive]}>
                    {item === 'Tümü' ? '🌍 Tüm Şehirler (Filtresiz)' : item}
                  </Text>
                  {activeCity === item && <Text style={styles.cityCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E63946',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  filtersContainerAll: {
    marginBottom: 10,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginLeft: 20,
    marginBottom: 4,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
    marginRight: 6,
  },
  activeFilterPill: {
    backgroundColor: '#1A1A2E',
  },
  activeFilterPillBlood: {
    backgroundColor: '#E63946',
  },
  activeFilterPillCity: {
    backgroundColor: '#457B9D',
  },
  filterText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },
  activeFilterText: {
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bloodBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bloodBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  hospital: {
    fontSize: 13,
    color: '#666',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statusBadgeHome: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusTextHome: {
    fontSize: 12,
  },
  cityFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  cityFilterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginRight: 8,
  },
  cityChipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cityChipButtonActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#E63946',
  },
  cityChipText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#E63946',
    fontWeight: 'bold',
  },
  cityChipClear: {
    marginLeft: 8,
    backgroundColor: '#E63946',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityChipClearText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  modalClose: {
    fontSize: 22,
    color: '#666',
    padding: 4,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cityItemActive: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
  },
  cityItemText: {
    fontSize: 16,
    color: '#333',
  },
  cityItemTextActive: {
    color: '#E63946',
    fontWeight: 'bold',
  },
  cityCheck: {
    color: '#E63946',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  /* 2-A: Şık Boş Durum (Empty State) Stilleri */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginVertical: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 34,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});