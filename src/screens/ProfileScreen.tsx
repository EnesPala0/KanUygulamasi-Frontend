import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Alert, Platform, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyApplications, getMyCreatedListings, getUserProfile, updateUserProfile, getVolunteers } from '../api/blood';
import { changePassword, deleteAccount } from '../api/auth';
import { getErrorMessage } from '../utils/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export default function ProfileScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'profile'|'listings'>('profile');
  const [listingSubTab, setListingSubTab] = useState<'applied'|'created'>('applied');

  const [userData, setUserData] = useState<any>(null);
  const [appliedListings, setAppliedListings] = useState<any[]>([]);
  const [createdListings, setCreatedListings] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Düzenleme Modalı State'leri
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editBloodType, setEditBloodType] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Şifre Değiştirme Modalı State'leri
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2-B: Telefon Numarası Formatlama (05XX XXX XX XX)
  const formatEditPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.startsWith('0')) {
      if (cleaned.length > 1) formatted = cleaned.substring(0, 4);
      if (cleaned.length > 4) formatted += ' ' + cleaned.substring(4, 7);
      if (cleaned.length > 7) formatted += ' ' + cleaned.substring(7, 9);
      if (cleaned.length > 9) formatted += ' ' + cleaned.substring(9, 11);
    } else if (cleaned.startsWith('5')) {
      const withZero = '0' + cleaned;
      if (withZero.length > 1) formatted = withZero.substring(0, 4);
      if (withZero.length > 4) formatted += ' ' + withZero.substring(4, 7);
      if (withZero.length > 7) formatted += ' ' + withZero.substring(7, 9);
      if (withZero.length > 9) formatted += ' ' + withZero.substring(9, 11);
    } else if (cleaned.length > 0) {
      if (cleaned.startsWith('905')) {
        const withZero = '0' + cleaned.substring(2);
        if (withZero.length > 1) formatted = withZero.substring(0, 4);
        if (withZero.length > 4) formatted += ' ' + withZero.substring(4, 7);
        if (withZero.length > 7) formatted += ' ' + withZero.substring(7, 9);
        if (withZero.length > 9) formatted += ' ' + withZero.substring(9, 11);
      } else {
        formatted = cleaned.substring(0, 11);
      }
    }
    setEditPhone(formatted);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [appData, createdData, profileData] = await Promise.all([
        getMyApplications().catch(() => []),
        getMyCreatedListings().catch(() => []),
        getUserProfile().catch(() => null)
      ]);

      if (profileData) {
        const userObj = profileData.data || profileData.user || profileData;
        setUserData({
          id: userObj.ID,
          firstName: userObj.first_name || 'Bilinmeyen',
          lastName: userObj.last_name || 'Kullanıcı',
          email: userObj.email || '-',
          phone: userObj.phone || '-',
          bloodType: userObj.blood_type || 'Bilinmiyor',
          city: userObj.city || 'Belirtilmemiş',
          totalDonations: userObj.total_donations || 0,
          savedLives: userObj.saved_lives || 0,
          streakYears: userObj.streak_years || 0
        });
      }

      const rawAppArray = Array.isArray(appData) ? appData : (appData?.data || appData?.applications || appData?.volunteers || []);
      const formattedApps = rawAppArray.map((item: any) => {
        const req = item.blood_request || {};
        const patientName = req.user ? `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'İhtiyaç Sahibi' : 'İhtiyaç Sahibi';
        const rawStatus = (item.status || item.Status || item.volunteer_status || item.state || '').toString().toLowerCase();
        const reqStatus = (req.status || req.Status || '').toString().toLowerCase();
        let statusTr = 'Beklemede';
        if (rawStatus === 'approved' || rawStatus === 'accepted' || rawStatus === 'onaylandı' || rawStatus === 'kabul' || rawStatus === 'active') {
          statusTr = reqStatus === 'completed' || reqStatus === 'tamamlandı' ? 'Onaylandı (Karşılandı)' : 'Onaylandı';
        } else if (rawStatus === 'rejected' || rawStatus === 'reddedildi' || rawStatus === 'red' || rawStatus === 'cancelled') {
          statusTr = 'Reddedildi';
        } else if (rawStatus === 'completed' || rawStatus === 'tamamlandı' || reqStatus === 'completed' || reqStatus === 'tamamlandı') {
          statusTr = 'Tamamlandı';
        }
        return {
          id: req.ID?.toString() || item.blood_request_id?.toString() || item.ID?.toString() || Math.random().toString(),
          applicationId: item.ID?.toString(),
          patientName: patientName,
          bloodType: req.required_blood_type || 'Bilinmiyor',
          hospital: req.hospital_name || 'Belirtilmemiş Hastane',
          location: req.district ? `${req.district}, ${req.city}` : (req.city || 'Belirtilmemiş Şehir'),
          unitsNeeded: req.required_units || 1,
          urgency: req.urgency_level || 'Acil',
          timeAgo: 'Başvuruldu', 
          medicalNote: req.medical_note || '',
          status: statusTr,
          isAlreadyVolunteered: true
        };
      });
      setAppliedListings(formattedApps);

      const rawCreatedArray = Array.isArray(createdData) ? createdData : (createdData?.data || createdData?.requests || createdData?.blood_requests || []);
      const formattedCreated = await Promise.all(
        rawCreatedArray.map(async (item: any) => {
          const id = item.ID?.toString() || Math.random().toString();
          let volArray = item.volunteers || [];
          try {
            const volRes = await getVolunteers(id);
            const fetchedVols = volRes?.data || volRes?.volunteers || volRes;
            if (Array.isArray(fetchedVols)) {
              volArray = fetchedVols;
            }
          } catch (e) {
            console.log("Volunteers çekilemedi:", e);
          }
          const rawStatus = (item.status || item.Status || '').toString().toLowerCase();
          let computedStatus = 'Aktif';
          if (rawStatus === 'resolved' || rawStatus === 'completed' || rawStatus === 'tamamlandı' || rawStatus === 'karşılandı' || rawStatus === 'closed') {
            computedStatus = 'Tamamlandı';
          } else if (rawStatus === 'approved' || rawStatus === 'accepted' || rawStatus === 'onaylandı' || rawStatus === 'kabul' || rawStatus === 'in_progress') {
            computedStatus = 'Onaylandı';
          } else if (rawStatus === 'cancelled' || rawStatus === 'iptal') {
            computedStatus = 'İptal Edildi';
          } else if (rawStatus === 'expired' || rawStatus === 'süresi doldu') {
            computedStatus = 'Süresi Doldu';
          }

          return {
            id,
            patientName: item.user ? `${item.user.first_name} ${item.user.last_name}` : "İhtiyaç Sahibi",
            bloodType: item.required_blood_type || "Bilinmiyor",
            hospital: item.hospital_name || "Belirtilmemiş Hastane",
            city: item.city || "",
            district: item.district || "",
            location: item.district ? `${item.district}, ${item.city}` : (item.city || "Belirtilmemiş Şehir"),
            unitsNeeded: item.required_units || 1,
            urgency: item.urgency_level || "Acil",
            timeAgo: "Yayında",
            status: computedStatus,
            medicalNote: item.medical_note || "",
            volunteers: volArray,
            isMine: true
          };
        })
      );
      setCreatedListings(formattedCreated);

    } catch (error: any) {
      console.log("Veriler çekilirken hata:", error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [{ text: 'İptal', style: 'cancel' }, { text: 'Çıkış Yap', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('userToken');
        const rootNav = navigation.getParent()?.getParent() || navigation;
        rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabınızı Silmek İstediğinize Emin Misiniz?',
      'Bu işlem geri alınamaz ve tüm verileriniz anonimleştirilir.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Hesabımı Sil', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteAccount();
              await AsyncStorage.removeItem('userToken');
              const rootNav = navigation.getParent()?.getParent() || navigation;
              rootNav.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (error: any) {
              const msg = getErrorMessage(error, "Hesabınız silinirken bir sorun oluştu.");
              Alert.alert("Hata", msg);
            }
          }
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!userData?.id) return;

    // --- 1. KAN GRUBU DOĞRULAMASI ---
    const formattedBloodType = editBloodType.trim().toUpperCase();
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-', 'O+', 'O-'];
    
    if (!validBloodTypes.includes(formattedBloodType)) {
      Alert.alert("Geçersiz Kan Grubu", "Lütfen geçerli bir kan grubu giriniz. (Örn: A+, B-, 0+)");
      return;
    }

    // --- 2. TELEFON NUMARASI DOĞRULAMASI ---
    const phoneDigits = editPhone.replace(/\D/g, '');
    if (!phoneDigits.startsWith('05') || phoneDigits.length !== 11) {
      Alert.alert("Geçersiz Telefon Numarası", "Lütfen geçerli bir cep telefonu numarası giriniz (Örn: 0555 123 45 67).");
      return;
    }

    try {
      setIsUpdating(true);
      
      const updateData = {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone,
        blood_type: formattedBloodType, // Kullanıcı küçük harf yazsa bile büyütüp yolluyoruz
        city: editCity.trim()
      };

      await updateUserProfile(userData.id, updateData);
      
      Alert.alert("Başarılı", "Profiliniz başarıyla güncellendi!");
      setEditModalVisible(false);
      await fetchAllData(); 
    } catch (error: any) {
      console.log("Güncelleme hatası:", error?.message || error);
      Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert("Uyarı", "Lütfen mevcut ve yeni şifrenizi giriniz.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Uyarı", "Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    try {
      setIsChangingPassword(true);
      const res = await changePassword(oldPassword, newPassword);
      Alert.alert("Başarılı", res.message || "Şifreniz başarıyla güncellendi.");
      setPasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      const msg = getErrorMessage(error, "Şifre değiştirilemedi.");
      Alert.alert("Hata", msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openEditModal = () => {
    setEditFirstName(userData?.first_name || userData?.firstName || '');
    setEditLastName(userData?.last_name || userData?.lastName || '');
    formatEditPhone(userData?.phone || '');
    setEditBloodType(userData?.bloodType || '');
    setEditCity(userData?.city || '');
    setEditModalVisible(true);
  };

  if (loading && !userData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  const safeUser = userData || { firstName: '-', lastName: '-', email: '-', phone: '-', bloodType: '-', city: '-', totalDonations: 0, savedLives: 0, streakYears: 0 };

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
        <InfoRow label="E-posta" value={safeUser.email} />
        <InfoRow label="Telefon" value={safeUser.phone} />
        <InfoRow label="Şehir" value={safeUser.city} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{safeUser.totalDonations}</Text>
          <Text style={styles.statLabel}>Bağış</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{safeUser.savedLives}</Text>
          <Text style={styles.statLabel}>Kurtarılan</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{safeUser.streakYears} Yıl</Text>
          <Text style={styles.statLabel}>Seri</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bağış Geçmişi</Text>
        <Text style={{color: '#888', fontStyle: 'italic', paddingVertical: 10}}>Geçmiş bağış kayıtlarınız burada listelenecektir.</Text>
      </View>

      <TouchableOpacity style={styles.changePasswordButton} onPress={() => setPasswordModalVisible(true)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="lock-closed-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.changePasswordButtonText}>Şifre Değiştir</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="log-out-outline" size={18} color="#E63946" style={{ marginRight: 6 }} />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="trash-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.deleteAccountButtonText}>Hesabımı Sil</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderListingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.subTabContainer}>
        <TouchableOpacity style={[styles.subTab, listingSubTab === 'applied' && styles.subTabActive]} onPress={() => setListingSubTab('applied')}>
          <Text style={[styles.subTabText, listingSubTab === 'applied' && styles.subTabTextActive]}>
            Başvurduklarım ({appliedListings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.subTab, listingSubTab === 'created' && styles.subTabActive]} onPress={() => setListingSubTab('created')}>
          <Text style={[styles.subTabText, listingSubTab === 'created' && styles.subTabTextActive]}>
            Açtıklarım ({createdListings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {listingSubTab === 'applied' ? (
        <View>
          {appliedListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-outline" size={40} color="#E63946" />
              </View>
              <Text style={styles.emptyTitle}>Henüz Başvurunuz Yok</Text>
              <Text style={styles.emptySubText}>
                Acil kan bağışı arayan hastaların hayatını kurtarmak için gönüllü olabilirsiniz.
              </Text>
              <TouchableOpacity 
                style={styles.emptyActionButton} 
                onPress={() => navigation.navigate('HomeTab')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="search-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyActionText}>Acil İlanlara Göz At</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            appliedListings.map((item, index) => {
              const statusColor = item.status === 'Beklemede' ? '#F4845F' : item.status === 'Onaylandı' ? '#2EC4B6' : '#999';
              return (
                <TouchableOpacity key={`app-${item.id}-${item.applicationId || index}`} style={styles.listingCard} onPress={() => navigation.navigate('ListingDetail', { listing: item })}>
                  <View style={styles.listingHeader}>
                    <Text style={styles.listingHospital}>{item.hospital}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}><Text style={styles.statusBadgeText}>{item.status}</Text></View>
                  </View>
                  <Text style={styles.listingPatient}>{item.patientName} - {item.bloodType}</Text>
                  <Text style={styles.listingTime}>{item.timeAgo}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : (
        <View>
          {createdListings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="megaphone-outline" size={40} color="#E63946" />
              </View>
              <Text style={styles.emptyTitle}>Açılmış İlanınız Yok</Text>
              <Text style={styles.emptySubText}>
                Kendiniz veya yakınlarınız için kan ihtiyacı olduğunda saniyeler içinde yeni ilan oluşturabilirsiniz.
              </Text>
              <TouchableOpacity 
                style={styles.emptyActionButton} 
                onPress={() => navigation.navigate('CreateListing')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="add-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyActionText}>İlk Kan Talebini Oluştur</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            createdListings.map((item, index) => {
              const isExpired = item.status === 'Süresi Doldu';
              return (
                <TouchableOpacity 
                  key={`created-${item.id}-${index}`} 
                  style={[styles.listingCard, isExpired && { opacity: 0.6, backgroundColor: '#F9F9F9' }]} 
                  onPress={() => navigation.navigate('MyListingDetail', { listing: item })}
                >
                  <View style={styles.listingHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.historyBadge, { backgroundColor: isExpired ? '#999' : getBloodTypeBgColor(item.bloodType), marginRight: 8, paddingHorizontal: 6, paddingVertical: 2 }]}>
                        <Text style={styles.historyBadgeText}>{item.bloodType}</Text>
                      </View>
                      <Text style={[styles.listingHospital, isExpired && { color: '#666' }]}>{item.hospital}</Text>
                    </View>
                    {isExpired ? (
                      <View style={[styles.volunteersBadge, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.volunteersBadgeText, { color: '#DC2626' }]}>Süresi Doldu</Text>
                      </View>
                    ) : (
                      <View style={styles.volunteersBadge}>
                        <Text style={styles.volunteersBadgeText}>{item.volunteers?.length || 0} Başvuru</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.listingLocation, isExpired && { color: '#999' }]}>{item.location} • {item.unitsNeeded} Ünite</Text>
                  <Text style={[styles.listingTime, isExpired && { color: '#999' }]}>{item.timeAgo} açıldı</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="create-outline" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.editButtonText}>Düzenle</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{safeUser.firstName[0]}{safeUser.lastName[0]}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{safeUser.firstName} {safeUser.lastName}</Text>
            <View style={styles.profileBadges}>
              <View style={[styles.profileBadge, { backgroundColor: getBloodTypeBgColor(safeUser.bloodType) }]}><Text style={styles.profileBadgeText}>{safeUser.bloodType}</Text></View>
              <View style={[styles.profileBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}><Text style={styles.profileBadgeText}>{safeUser.totalDonations} Bağış</Text></View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mainTabs}>
        <TouchableOpacity style={[styles.mainTab, activeTab === 'profile' && styles.mainTabActive]} onPress={() => setActiveTab('profile')}>
          <Text style={[styles.mainTabText, activeTab === 'profile' && styles.mainTabTextActive]}>Profilim</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mainTab, activeTab === 'listings' && styles.mainTabActive]} onPress={() => setActiveTab('listings')}>
          <Text style={[styles.mainTabText, activeTab === 'listings' && styles.mainTabTextActive]}>İlanlarım <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{appliedListings.length + createdListings.length}</Text></View></Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E63946']} tintColor="#E63946" />}>
        {activeTab === 'profile' ? renderProfileTab() : renderListingsTab()}
      </ScrollView>

      {/* PROFİL DÜZENLEME MODALI */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            
            <Text style={styles.inputLabel}>Ad</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editFirstName} 
              onChangeText={setEditFirstName}
              placeholder="Adınız"
            />

            <Text style={styles.inputLabel}>Soyad</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editLastName} 
              onChangeText={setEditLastName}
              placeholder="Soyadınız"
            />

            <Text style={styles.inputLabel}>Telefon Numarası</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editPhone} 
              onChangeText={formatEditPhone}
              keyboardType="phone-pad"
              maxLength={14}
              placeholder="0555 123 45 67"
            />

            <Text style={styles.inputLabel}>Kan Grubu</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editBloodType} 
              onChangeText={setEditBloodType}
              autoCapitalize="characters"
              maxLength={3} // AB+ en fazla 3 karakterdir
              placeholder="Örn: A+, 0-"
            />

            <Text style={styles.inputLabel}>Şehir</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editCity} 
              onChangeText={setEditCity}
              placeholder="Örn: Antalya"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)} disabled={isUpdating}>
                <Text style={styles.modalCancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateProfile} disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ŞİFRE DEĞİŞTİRME MODALI */}
      <Modal visible={isPasswordModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔐 Şifre Değiştir</Text>
            
            <Text style={styles.inputLabel}>Mevcut Şifre</Text>
            <TextInput 
              style={styles.modalInput} 
              value={oldPassword} 
              onChangeText={setOldPassword}
              secureTextEntry={true}
              placeholder="••••••••"
            />

            <Text style={styles.inputLabel}>Yeni Şifre</Text>
            <TextInput 
              style={styles.modalInput} 
              value={newPassword} 
              onChangeText={setNewPassword}
              secureTextEntry={true}
              placeholder="En az 6 karakter"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPasswordModalVisible(false)} disabled={isChangingPassword}>
                <Text style={styles.modalCancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Güncelle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#E63946', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16 },
  editButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#E63946' },
  profileDetails: { flex: 1 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  profileBadges: { flexDirection: 'row' },
  profileBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  profileBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  mainTabs: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  mainTab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  mainTabActive: { borderBottomColor: '#E63946' },
  mainTabText: { fontSize: 15, fontWeight: '600', color: '#666' },
  mainTabTextActive: { color: '#E63946' },
  tabBadge: { backgroundColor: '#E63946', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 },
  tabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  tabContent: { flex: 1 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#333' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#E0E0E0' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#E63946', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  changePasswordButton: { padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', marginTop: 8, marginBottom: 8 },
  changePasswordButtonText: { color: '#1F2937', fontSize: 16, fontWeight: '600' },
  logoutButton: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E63946', marginTop: 8, marginBottom: 8 },
  logoutButtonText: { color: '#E63946', fontSize: 16, fontWeight: '600' },
  deleteAccountButton: { padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#E63946', marginTop: 8, marginBottom: 24, shadowColor: '#E63946', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  deleteAccountButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  subTabContainer: { flexDirection: 'row', backgroundColor: '#E0E0E0', borderRadius: 8, padding: 4, marginBottom: 16 },
  subTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  subTabActive: { backgroundColor: '#FFF' },
  subTabText: { fontSize: 13, fontWeight: '500', color: '#666' },
  subTabTextActive: { color: '#333', fontWeight: '600' },
  listingCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  listingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  listingHospital: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  listingPatient: { fontSize: 14, color: '#555', marginBottom: 4 },
  listingLocation: { fontSize: 14, color: '#555', marginBottom: 4 },
  listingTime: { fontSize: 12, color: '#999' },
  volunteersBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  volunteersBadgeText: { fontSize: 10, fontWeight: '600', color: '#666' },
  historyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  historyBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  /* Modal Stilleri */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '600' },
  modalInput: { backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#333', marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#F0F0F0', marginRight: 8 },
  modalCancelBtnText: { color: '#666', fontWeight: 'bold', fontSize: 15 },
  modalSaveBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#E63946', marginLeft: 8 },
  modalSaveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  
  /* 2-A: Şık Boş Durum (Empty State) Stilleri */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginVertical: 16,
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