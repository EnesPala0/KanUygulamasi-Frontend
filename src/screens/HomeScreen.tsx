import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, StatusBar, RefreshControl, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllBloodRequests, getNotifications, getUserProfile, getMyApplications, syncLocationAndToken } from '../api/blood';
import { TURKEY_CITIES } from '../constants/cities';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import ListingCard from '../components/ListingCard';

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
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCityModalVisible, setCityModalVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const urgencyFilters = ['Tümü', 'Normal', 'Acil', 'Kritik'];
  const bloodTypeFilters = ['Tümü', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

  const filteredCitiesForModal = ['Tümü', ...TURKEY_CITIES].filter(c => 
    c === 'Tümü' || c.toLowerCase().includes(citySearchQuery.toLowerCase().trim())
  );

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const hasPrompted = await SecureStore.getItemAsync('hasPromptedPermissions');
      
      // Daha önce sorulmadıysa, modalı göster
      if (hasPrompted !== 'true') {
        setShowPermissionModal(true);
      } else {
        // Zaten sorulduysa arka planda izinleri kontrol et ve token al (sessizce)
        getLocationAndToken();
      }
    } catch (error) {
      console.error('İzin kontrol hatası:', error);
    }
  };

  const handleGrantPermissions = async () => {
    setShowPermissionModal(false);
    await SecureStore.setItemAsync('hasPromptedPermissions', 'true');
    getLocationAndToken();
  };

  const handleDeclinePermissions = async () => {
    setShowPermissionModal(false);
    await SecureStore.setItemAsync('hasPromptedPermissions', 'true');
  };

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
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#FAFAFA');
      }
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
      if (error?.message === 'Network Error' || !error?.response) {
        Alert.alert('Bağlantı Sorunu', 'Şu anda sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edip sayfayı aşağı çekerek tekrar yenileyin.');
      } else {
        Alert.alert('Küçük Bir Aksilik', 'İlanları güncellerken bir sorun oluştu. Lütfen birazdan tekrar deneyin.');
      }
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
    const matchCity = activeCities.length === 0 || 
      (item.city && activeCities.some(c => item.city.toLowerCase() === c.toLowerCase())) || 
      (item.location && activeCities.some(c => item.location.toLowerCase().includes(c.toLowerCase())));
    return matchUrgency && matchBlood && matchCity;
  });

  const renderItem = useCallback(({ item }: any) => {
    return (
      <ListingCard 
        item={item} 
        onPress={() => navigation.navigate('ListingDetail', { listing: item })} 
      />
    );
  }, [navigation]);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

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
            style={[styles.cityChipButton, activeCities.length > 0 && styles.cityChipButtonActive]}
            onPress={() => setCityModalVisible(true)}
          >
            <Text style={[styles.cityChipText, activeCities.length > 0 && styles.cityChipTextActive]}>
              {activeCities.length === 0 ? 'Tüm Şehirler (Seç ▾)' : (activeCities.length === 1 ? activeCities[0] : `${activeCities.length} Şehir Seçili`)}
            </Text>
            {activeCities.length > 0 && (
              <TouchableOpacity 
                style={styles.cityChipClear} 
                onPress={() => setActiveCities([])}
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
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="water-outline" size={40} color="#E63946" />
              </View>
              <Text style={styles.emptyTitle}>
                {(activeFilter !== 'Tümü' || activeBloodType !== 'Tümü' || activeCities.length > 0) 
                  ? 'Seçilen Filtreye Uygun İlan Yok' 
                  : 'Şu An İçin Hiç Kan İlanı Bulunmuyor'}
              </Text>
              <Text style={styles.emptySubText}>
                {(activeFilter !== 'Tümü' || activeBloodType !== 'Tümü' || activeCities.length > 0)
                  ? 'Filtreleri sıfırlayarak diğer şehir veya kan gruplarındaki acil ihtiyaçlara göz atabilirsiniz.'
                  : 'Sistemde henüz aktif bir kan talebi yok. Yeni bir talep olduğunda burada görünecektir.'}
              </Text>
              {(activeFilter !== 'Tümü' || activeBloodType !== 'Tümü' || activeCities.length > 0) ? (
                <TouchableOpacity 
                  style={styles.emptyActionButton} 
                  onPress={() => {
                    setActiveFilter('Tümü');
                    setActiveBloodType('Tümü');
                    setActiveCities([]);
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
              renderItem={({ item }) => {
                const isSelected = activeCities.includes(item);
                return (
                  <TouchableOpacity
                    style={[styles.cityItem, isSelected && styles.cityItemActive]}
                    onPress={() => {
                      if (item === 'Tümü') {
                        setActiveCities([]);
                        setCityModalVisible(false);
                        setCitySearchQuery('');
                      } else {
                        if (isSelected) {
                          setActiveCities(activeCities.filter(c => c !== item));
                        } else {
                          setActiveCities([...activeCities, item]);
                        }
                      }
                    }}
                  >
                    <Text style={[styles.cityItemText, isSelected && styles.cityItemTextActive]}>
                      {item === 'Tümü' ? '🌍 Tüm Şehirler (Filtreyi Temizle)' : item}
                    </Text>
                    {isSelected && <Text style={styles.cityCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => setCityModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Filtreyi Uygula</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* İzinler Soft Prompt Modalı */}
      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDeclinePermissions}
      >
        <View style={styles.permissionModalOverlay}>
          <View style={styles.permissionModalContent}>
            <View style={styles.permissionIconCircle}>
              <Ionicons name="location" size={40} color="#E63946" />
            </View>
            <Text style={styles.permissionModalTitle}>Sana Nasıl Ulaşalım?</Text>
            
            <View style={styles.permissionFeatureRow}>
              <View style={styles.permissionFeatureIcon}>
                <Ionicons name="map-outline" size={20} color="#E63946" />
              </View>
              <Text style={styles.permissionFeatureText}>
                Sana en yakın hastanedeki acil kan ihtiyaçlarını bulabilmemiz için <Text style={{fontWeight: 'bold'}}>konumuna</Text> ihtiyacımız var.
              </Text>
            </View>

            <View style={styles.permissionFeatureRow}>
              <View style={styles.permissionFeatureIcon}>
                <Ionicons name="notifications-outline" size={20} color="#E63946" />
              </View>
              <Text style={styles.permissionFeatureText}>
                Bölgende biri kan aradığında, o kişinin hayatını kurtarabilmen için sana <Text style={{fontWeight: 'bold'}}>bildirim</Text> göndereceğiz.
              </Text>
            </View>

            <Text style={styles.permissionPrivacyText}>
              Verilerin KVKK kapsamında şifrelenerek korunur. Sadece uygulama açıkken (veya arka planda gerekli durumlarda) kullanılır.
            </Text>

            <TouchableOpacity style={styles.permissionAllowButton} onPress={handleGrantPermissions}>
              <Text style={styles.permissionAllowButtonText}>İzin Ver (Önerilen)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.permissionDeclineButton} onPress={handleDeclinePermissions}>
              <Text style={styles.permissionDeclineButtonText}>Daha Sonra</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  applyButton: {
    backgroundColor: '#E63946',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  permissionModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDE8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
  permissionModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 25,
    textAlign: 'center',
  },
  permissionFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 10,
  },
  permissionFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  permissionFeatureText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  permissionPrivacyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  permissionAllowButton: {
    backgroundColor: '#E63946',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  permissionAllowButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionDeclineButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionDeclineButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
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