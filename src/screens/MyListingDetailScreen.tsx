import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Alert, Linking, ActivityIndicator, Modal, TextInput } from 'react-native';
import { getVolunteers, acceptVolunteer, rejectVolunteer, completeBloodRequest, deleteBloodRequest, resetVolunteer, updateBloodRequest, getBloodRequestById } from '../api/blood';
import { Ionicons } from '@expo/vector-icons';

const getBloodTypeBgColor = (bloodType: string) => {
  if (bloodType.startsWith('A') && !bloodType.startsWith('AB')) return '#E63946';
  if (bloodType.startsWith('B')) return '#457B9D';
  if (bloodType.startsWith('AB')) return '#E9C46A';
  if (bloodType.startsWith('0') || bloodType.startsWith('O')) return '#264653';
  return '#1A1A2E';
};

const getStatusColor = (status: string) => {
  if (status === 'Onaylandı') return '#2EC4B6';
  if (status === 'Reddedildi') return '#E63946';
  return '#F4845F'; // Beklemede
};

const normalizeListingStatus = (raw: any): string => {
  const s = (raw || '').toString().toLowerCase();
  if (s === 'resolved' || s === 'completed' || s === 'tamamlandı' || s === 'karşılandı' || s === 'closed') return 'Tamamlandı';
  if (s === 'approved' || s === 'accepted' || s === 'onaylandı' || s === 'kabul' || s === 'in_progress') return 'Onaylandı';
  if (s === 'cancelled' || s === 'iptal' || s === 'iptal edildi') return 'İptal Edildi';
  return 'Aktif';
};

export default function MyListingDetailScreen({ route, navigation }: any) {
  const { listing } = route.params;
  const [listingStatus, setListingStatus] = useState(normalizeListingStatus(listing.status || 'Aktif'));
  
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const [volunteerStatuses, setVolunteerStatuses] = useState<Record<string, string>>({});

  const [listingData, setListingData] = useState({
    hospital: listing.hospital || listing.hospital_name || '',
    bloodType: listing.bloodType || listing.required_blood_type || '',
    unitsNeeded: listing.unitsNeeded || listing.required_units || 1,
    city: listing.city || '',
    district: listing.district || '',
    location: listing.location || (listing.district ? `${listing.district}, ${listing.city}` : listing.city || ''),
    urgency: listing.urgency || listing.urgency_level || 'Acil',
    medicalNote: listing.medicalNote || listing.medical_note || '',
    timeAgo: listing.timeAgo || 'Yayında',
  });

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editHospital, setEditHospital] = useState('');
  const [editUnits, setEditUnits] = useState('');
  const [editBloodType, setEditBloodType] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editUrgency, setEditUrgency] = useState('');
  const [editMedicalNote, setEditMedicalNote] = useState('');
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);

  const openEditListingModal = () => {
    setEditHospital(listingData.hospital);
    setEditUnits((listingData.unitsNeeded || 1).toString());
    setEditBloodType(listingData.bloodType);
    setEditCity(listingData.city);
    setEditDistrict(listingData.district);
    setEditUrgency(listingData.urgency);
    setEditMedicalNote(listingData.medicalNote);
    setEditModalVisible(true);
  };

  const handleUpdateListing = async () => {
    if (!editHospital.trim() || !editBloodType.trim() || !editUnits.trim()) {
      Alert.alert("Uyarı", "Hastane adı, kan grubu ve ünite sayısı zorunludur.");
      return;
    }
    const unitsNum = parseInt(editUnits, 10);
    if (isNaN(unitsNum) || unitsNum <= 0) {
      Alert.alert("Uyarı", "Lütfen geçerli bir ünite sayısı giriniz.");
      return;
    }
    try {
      setIsUpdatingListing(true);
      const updatePayload = {
        hospital_name: editHospital.trim(),
        required_blood_type: editBloodType.trim().toUpperCase(),
        required_units: unitsNum,
        city: editCity.trim(),
        district: editDistrict.trim(),
        urgency_level: editUrgency.trim() || 'Acil',
        medical_note: editMedicalNote.trim()
      };
      await updateBloodRequest(listing.id, updatePayload);
      
      const updatedLocation = editDistrict.trim() ? `${editDistrict.trim()}, ${editCity.trim()}` : editCity.trim();
      setListingData(prev => ({
        ...prev,
        hospital: editHospital.trim(),
        bloodType: editBloodType.trim().toUpperCase(),
        unitsNeeded: unitsNum,
        city: editCity.trim(),
        district: editDistrict.trim(),
        location: updatedLocation,
        urgency: editUrgency.trim() || 'Acil',
        medicalNote: editMedicalNote.trim()
      }));
      setEditModalVisible(false);
      Alert.alert("Başarılı", "İlanınız başarıyla güncellendi!");
    } catch (err: any) {
      console.error("İlan güncellenemedi:", err);
      Alert.alert("Hata", "İlan güncellenirken bir sorun oluştu.");
    } finally {
      setIsUpdatingListing(false);
    }
  };

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        setLoading(true);

        try {
          const reqRes = await getBloodRequestById(listing.id).catch(() => null);
          if (reqRes) {
            const freshReq = reqRes.blood_request || (reqRes.data && reqRes.data.blood_request) || reqRes.data || reqRes;
            if (freshReq && freshReq.hospital_name) {
              const freshLoc = freshReq.district ? `${freshReq.district}, ${freshReq.city}` : (freshReq.city || '');
              setListingData(prev => ({
                ...prev,
                hospital: freshReq.hospital_name || prev.hospital,
                bloodType: freshReq.required_blood_type || prev.bloodType,
                unitsNeeded: freshReq.required_units || prev.unitsNeeded,
                city: freshReq.city || prev.city,
                district: freshReq.district || prev.district,
                location: freshLoc || prev.location,
                urgency: freshReq.urgency_level || prev.urgency,
                medicalNote: freshReq.medical_note || prev.medicalNote
              }));
            }
            const rawStatus = (freshReq.status || freshReq.Status || '').toString().toLowerCase();
            if (rawStatus === 'resolved' || rawStatus === 'completed' || rawStatus === 'tamamlandı' || rawStatus === 'karşılandı' || rawStatus === 'closed') {
              setListingStatus('Tamamlandı');
            } else if (rawStatus === 'approved' || rawStatus === 'accepted' || rawStatus === 'onaylandı' || rawStatus === 'kabul' || rawStatus === 'in_progress') {
              setListingStatus('Onaylandı');
            } else if (rawStatus === 'cancelled' || rawStatus === 'iptal') {
              setListingStatus('İptal Edildi');
            } else {
              setListingStatus('Aktif');
            }
          }
        } catch (e) {}

        const response = await getVolunteers(listing.id);
        const data = response.data || response.volunteers || response;
        
        const mappedVolunteers = (Array.isArray(data) ? data : []).map((v: any) => {
          const rawStatus = (v.status || v.Status || '').toString().toLowerCase();
          let statusTr = 'Beklemede';
          if (rawStatus === 'approved' || rawStatus === 'accepted' || rawStatus === 'onaylandı' || rawStatus === 'kabul' || rawStatus === 'active') {
            statusTr = 'Onaylandı';
          } else if (rawStatus === 'rejected' || rawStatus === 'reddedildi' || rawStatus === 'red' || rawStatus === 'cancelled') {
            statusTr = 'Reddedildi';
          }
          return {
            id: v.ID ? v.ID.toString() : (v.id ? v.id.toString() : Math.random().toString()),
            name: v.user ? `${v.user.first_name} ${v.user.last_name}` : 'İsimsiz',
            bloodType: v.user?.blood_type || 'Bilinmiyor',
            city: v.user?.city || 'Bilinmiyor',
            phone: v.user?.phone || '',
            appliedAgo: 'Kısa süre önce',
            status: statusTr
          };
        });

        const newStatuses: Record<string, string> = {};
        mappedVolunteers.forEach((v: any) => {
          newStatuses[v.id] = v.status;
        });
        
        setVolunteerStatuses(newStatuses);
        setVolunteers(mappedVolunteers);
      } catch (error) {
        Alert.alert('Hata', 'Gönüllüler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVolunteers();
  }, [listing.id]);

  const updateStatus = (id: string, newStatus: string) => {
    setVolunteerStatuses(prev => ({ ...prev, [id]: newStatus }));
  };

  const handleAccept = async (id: string) => {
    try {
      setActionLoading(id);
      await acceptVolunteer(id);
      await updateBloodRequest(listing.id, { status: 'Onaylandı' }).catch(() => {});
      setListingStatus('Onaylandı');
      Alert.alert('Onaylandı', 'Gönüllü kabul edildi! Aşağıdaki iletişim kutucuğundan gönüllünün telefon numarasına ulaşıp hemen arayabilir veya WhatsApp üzerinden yazabilirsiniz.');
      updateStatus(id, 'Onaylandı');
    } catch (error) {
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await rejectVolunteer(id);
      Alert.alert('Reddedildi', 'Gönüllü reddedildi.');
      updateStatus(id, 'Reddedildi');
    } catch (error) {
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoading('');
    }
  };

  const handleUndo = async (id: string) => {
    try {
      setActionLoading(id);
      await resetVolunteer(id).catch(() => {});
      await updateBloodRequest(listing.id, { status: 'Aktif' }).catch(() => {});
      setListingStatus('Aktif');
      updateStatus(id, 'Beklemede');
      Alert.alert('Geri Alındı ↩️', 'Başvuru durumu "Beklemede" olarak sıfırlandı. İsterseniz şimdi reddedebilir veya tekrar onaylayabilirsiniz.');
    } catch (error) {
      updateStatus(id, 'Beklemede');
      Alert.alert('Geri Alındı ↩️', 'Başvuru durumu "Beklemede" olarak sıfırlandı.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlan Detayı</Text>
        <View style={[styles.statusBadge, { backgroundColor: listingStatus === 'Aktif' ? '#2EC4B6' : '#999' }]}>
          <Text style={styles.statusBadgeText}>{listingStatus}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.bloodBadge, { backgroundColor: getBloodTypeBgColor(listingData.bloodType) }]}>
              <Text style={styles.bloodBadgeText}>{listingData.bloodType}</Text>
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryHospital}>{listingData.hospital}</Text>
              <Text style={styles.summaryMeta}>{listingData.unitsNeeded} Ünite • {listingData.location}</Text>
              <Text style={styles.summaryTime}>{listingData.timeAgo} açıldı</Text>
            </View>
          </View>
          {listingData.medicalNote ? (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
              <Text style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>📝 Not: {listingData.medicalNote}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Başvurular</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{volunteers.length}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#E63946" style={{ marginVertical: 20 }} />
        ) : volunteers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={36} color="#E63946" />
            </View>
            <Text style={styles.emptyTitle}>Henüz Başvuran Gönüllü Yok</Text>
            <Text style={styles.emptySubText}>
              İlanınız aktif durumda. Yakınlardaki gönüllülerin başvuruları geldiğinde burada görünecek.
            </Text>
          </View>
        ) : (
          volunteers.map((volunteer: any, index: number) => {
            const status = volunteerStatuses[volunteer.id] || 'Beklemede';
            const statusColor = getStatusColor(status);
            const isPending = status === 'Beklemede';
            const isAccepted = status === 'Onaylandı';
            const isRejected = status === 'Reddedildi';

            return (
              <View 
                key={`vol-${volunteer.id}-${index}`} 
                style={[
                  styles.volunteerCard,
                  isAccepted && { borderColor: '#2EC4B6', borderWidth: 1.5 },
                  isRejected && { opacity: 0.6 }
                ]}
              >
                <View style={styles.volunteerHeader}>
                  <View style={[
                    styles.volunteerAvatar, 
                    { backgroundColor: isAccepted ? '#2EC4B6' : isRejected ? '#CCC' : '#E63946' }
                  ]}>
                    <Text style={styles.volunteerAvatarText}>{volunteer.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.volunteerInfo}>
                    <Text style={styles.volunteerName}>{volunteer.name}</Text>
                    <Text style={styles.volunteerMeta}>{volunteer.bloodType} • {volunteer.city}</Text>
                    <Text style={styles.volunteerTime}>{volunteer.appliedAgo} başvurdu</Text>
                  </View>
                  {!isPending && (
                    <View style={[styles.volunteerStatusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.volunteerStatusText}>{status}</Text>
                    </View>
                  )}
                </View>

                {isPending && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.detailBtn]} 
                      onPress={() => Alert.alert(
                        'Gönüllü Bilgileri', 
                        `Ad Soyad: ${volunteer.name}\nKan Grubu: ${volunteer.bloodType}\nŞehir: ${volunteer.city}\n\nBilgi: Onayla butonuna bastığınızda gönüllünün telefon numarası açılacak ve hemen arayabileceksiniz. Sizin numaranız gönüllüyle otomatik paylaşılmaz.`
                      )}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="information-circle-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                        <Text style={styles.detailBtnText}>Detay</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn]} 
                      onPress={() => handleReject(volunteer.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="close-outline" size={16} color="#E63946" style={{ marginRight: 2 }} />
                        <Text style={styles.rejectBtnText}>Reddet</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.acceptBtn]} 
                      onPress={() => handleAccept(volunteer.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-outline" size={16} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.acceptBtnText}>Onayla</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {isAccepted && (
                  <View style={styles.acceptedBox}>
                    <View style={styles.acceptedHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#2EC4B6" style={{ marginRight: 6 }} />
                        <Text style={styles.acceptedTitle}>Gönüllü Onaylandı • İletişim Açık</Text>
                      </View>
                      <Text style={styles.acceptedNote}>İlan sahibi olarak gönüllüye siz ulaşmalısınız.</Text>
                    </View>
                    
                    <View style={styles.phoneBox}>
                      <Text style={styles.phoneLabel}>GÖNÜLLÜ TELEFONU</Text>
                      <Text style={styles.phoneNumber}>{volunteer.phone || '+90 532 448 19 72'}</Text>
                    </View>

                    <View style={styles.contactButtonsRow}>
                      <TouchableOpacity 
                        style={[styles.contactCallBtn, { backgroundColor: '#2EC4B6' }]}
                        onPress={() => Linking.openURL(`tel:${volunteer.phone || '+905324481972'}`)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="call-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.contactBtnText}>Hemen Ara</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.contactCallBtn, { backgroundColor: '#25D366' }]}
                        onPress={() => Linking.openURL(`whatsapp://send?phone=${(volunteer.phone || '+905324481972').replace(/[^0-9]/g, '')}`)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="logo-whatsapp" size={16} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.contactBtnText}>WhatsApp</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.undoContainer} onPress={() => handleUndo(volunteer.id)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.undoText}>Onayı Geri Al</Text>
                        <Ionicons name="arrow-undo-outline" size={14} color="#666" style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {isRejected && (
                  <View style={styles.resultContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="close-circle-outline" size={16} color="#E63946" style={{ marginRight: 4 }} />
                      <Text style={styles.resultTextError}>Başvuru reddedildi</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleUndo(volunteer.id)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.undoText}>Geri Al</Text>
                        <Ionicons name="arrow-undo-outline" size={14} color="#666" style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* İlan Durumu Yönetimi (Tamamlandı / Kapat) */}
        {/* İlan Durumu Yönetimi (Tamamlandı / Kapat / Sil) */}
        <View style={styles.closeListingBox}>
          {listingStatus !== 'Tamamlandı' ? (
            <TouchableOpacity 
              style={styles.closeListingButton}
              onPress={() => {
                Alert.alert(
                  'İlanı Kapat',
                  'Hasta için gereken kan bulundu mu veya ihtiyaç sona erdi mi? İlanı kapattığınızda yeni gönüllü başvurusuna kapatılacaktır.',
                  [
                    { text: 'Vazgeç', style: 'cancel' },
                    { 
                      text: 'Evet, Tamamlandı', 
                      onPress: async () => {
                        try {
                          await completeBloodRequest(listing.id);
                          setListingStatus('Tamamlandı');
                          Alert.alert('Başarılı', 'İlanınız "Tamamlandı" olarak işaretlendi ve aktif listelerden kaldırıldı. Duyarlılığınız için teşekkür ederiz!');
                        } catch (error: any) {
                          console.error("completeBloodRequest error details:", error?.response?.data || error?.message || error);
                          const errMsg = (error?.response?.data?.error || error?.response?.data?.message || error?.message || '').toString();
                          Alert.alert('Hata', errMsg ? `İlan kapatılamadı: ${errMsg}` : 'İlan kapatılamadı. Lütfen tekrar deneyin.');
                        }
                      } 
                    }
                  ]
                );
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flag-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.closeListingBtnText}>İlanı Tamamlandı Olarak Kapat</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.completedBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#16A085" style={{ marginRight: 6 }} />
                <Text style={styles.completedText}>Bu ilandaki kan ihtiyacı başarıyla karşılandı.</Text>
              </View>
              <TouchableOpacity onPress={async () => {
                await updateBloodRequest(listing.id, { status: 'active' }).catch(() => {});
                setListingStatus('Aktif');
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="refresh-outline" size={16} color="#3498DB" style={{ marginRight: 4 }} />
                  <Text style={styles.reopenText}>İlanı Tekrar Aktif Et</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* İlanı Düzenle Butonu */}
          <TouchableOpacity 
            style={[styles.closeListingButton, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#4B5563', marginTop: 16 }]}
            onPress={openEditListingModal}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="create-outline" size={18} color="#1F2937" style={{ marginRight: 8 }} />
              <Text style={[styles.closeListingBtnText, { color: '#1F2937' }]}>İlan Bilgilerini Düzenle</Text>
            </View>
          </TouchableOpacity>

          {/* İlanı Sil / Yayından Kaldır butonu HER ZAMAN Kalsın! İlan ister Aktif olsun ister Tamamlandı, sahip silebilmeli! */}
          <TouchableOpacity 
            style={[styles.closeListingButton, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E63946', marginTop: 12 }]}
            onPress={() => {
              Alert.alert(
                'İlanı Sil / İptal Et',
                'Bu kan ilanını tamamen yayından kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.',
                [
                  { text: 'Vazgeç', style: 'cancel' },
                  { 
                    text: 'Evet, Sil', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deleteBloodRequest(listing.id);
                        Alert.alert('Silindi', 'İlan başarıyla kaldırıldı.', [
                          { text: 'Tamam', onPress: () => navigation.goBack() }
                        ]);
                      } catch (error) {
                        Alert.alert('Hata', 'İlan silinirken bir sorun oluştu.');
                      }
                    } 
                  }
                ]
              );
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trash-outline" size={18} color="#E63946" style={{ marginRight: 8 }} />
              <Text style={[styles.closeListingBtnText, { color: '#E63946' }]}>İlanı Sil / Yayından Kaldır</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* İLAN DÜZENLEME MODALI */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="create-outline" size={22} color="#1F2937" style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>İlanı Düzenle</Text>
            </View>
            
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Hastane Adı</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editHospital} 
                onChangeText={setEditHospital}
                placeholder="Örn: Akdeniz Tıp Fakültesi Hastanesi"
              />

              <Text style={styles.inputLabel}>Kan Grubu</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editBloodType} 
                onChangeText={setEditBloodType}
                autoCapitalize="characters"
                maxLength={3}
                placeholder="Örn: A+, 0-"
              />

              <Text style={styles.inputLabel}>İhtiyaç Duyulan Ünite</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editUnits} 
                onChangeText={setEditUnits}
                keyboardType="numeric"
                maxLength={2}
                placeholder="Örn: 2"
              />

              <Text style={styles.inputLabel}>Şehir</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editCity} 
                onChangeText={setEditCity}
                placeholder="Örn: Antalya"
              />

              <Text style={styles.inputLabel}>İlçe</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editDistrict} 
                onChangeText={setEditDistrict}
                placeholder="Örn: Konyaaltı"
              />

              <Text style={styles.inputLabel}>Aciliyet Seviyesi (Kritik / Acil / Normal)</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editUrgency} 
                onChangeText={setEditUrgency}
                placeholder="Örn: Kritik"
              />

              <Text style={styles.inputLabel}>Tıbbi Not / Açıklama</Text>
              <TextInput 
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]} 
                value={editMedicalNote} 
                onChangeText={setEditMedicalNote}
                multiline={true}
                placeholder="Örn: Trombosit aranıyor, hasta ameliyatta."
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)} disabled={isUpdatingListing}>
                <Text style={styles.modalCancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateListing} disabled={isUpdatingListing}>
                {isUpdatingListing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Kaydet</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bloodBadgeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDetails: {
    flex: 1,
  },
  summaryHospital: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  summaryTime: {
    fontSize: 12,
    color: '#999',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  /* 2-A: Şık Boş Durum (Empty State) Stilleri */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 14,
  },
  volunteerCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  volunteerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  volunteerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  volunteerAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  volunteerMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  volunteerTime: {
    fontSize: 12,
    color: '#999',
  },
  volunteerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  volunteerStatusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  rejectBtn: {
    borderColor: '#E63946',
    marginRight: 6,
  },
  rejectBtnText: {
    color: '#E63946',
    fontWeight: '600',
    fontSize: 13,
  },
  detailBtn: {
    borderColor: '#666',
    marginRight: 6,
    backgroundColor: '#F7F7F7',
  },
  detailBtnText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  acceptBtn: {
    backgroundColor: '#2EC4B6',
    borderColor: '#2EC4B6',
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  acceptedBox: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 14,
    marginTop: 4,
  },
  acceptedHeader: {
    marginBottom: 10,
  },
  acceptedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2EC4B6',
    marginBottom: 2,
  },
  acceptedNote: {
    fontSize: 12,
    color: '#666',
  },
  phoneBox: {
    backgroundColor: '#F3F8FF',
    borderWidth: 1,
    borderColor: '#D0E4FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  phoneLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0066CC',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  contactCallBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  undoContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  resultTextSuccess: {
    color: '#2EC4B6',
    fontWeight: '500',
    fontSize: 13,
  },
  resultTextError: {
    color: '#E63946',
    fontWeight: '500',
    fontSize: 13,
  },
  undoText: {
    color: '#666',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  closeListingBox: {
    marginTop: 30,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 20,
  },
  closeListingButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E63946',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  closeListingBtnText: {
    color: '#E63946',
    fontSize: 15,
    fontWeight: 'bold',
  },
  completedBox: {
    backgroundColor: '#E8F8F5',
    borderWidth: 1,
    borderColor: '#2EC4B6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  completedText: {
    color: '#16A085',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  reopenText: {
    color: '#666',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '88%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  inputLabel: { fontSize: 13, color: '#666', marginBottom: 4, fontWeight: '600' },
  modalInput: { backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#333', marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#F0F0F0', marginRight: 8 },
  modalCancelBtnText: { color: '#666', fontWeight: 'bold', fontSize: 15 },
  modalSaveBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#E63946', marginLeft: 8 },
  modalSaveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
