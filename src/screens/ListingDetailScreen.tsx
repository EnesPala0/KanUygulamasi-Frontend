import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, Alert, Share, Linking, Platform, ActivityIndicator } from 'react-native';
import { applyAsVolunteer, cancelVolunteerApplication, getBloodRequestById, getVolunteers, getUserProfile, getMyApplications } from '../api/blood';
import { getErrorMessage } from '../utils/errors';
import { Ionicons } from '@expo/vector-icons';

const getUrgencyColor = (urgency: string) => {
  if (urgency === 'Kritik') return '#E63946';
  if (urgency === 'Acil') return '#F4845F';
  if (urgency === 'Normal') return '#2EC4B6';
  return '#1A1A2E';
};

const getBloodTypeBgColor = (bloodType: string) => {
  if (bloodType.startsWith('A') && !bloodType.startsWith('AB')) return '#E63946';
  if (bloodType.startsWith('B')) return '#457B9D';
  if (bloodType.startsWith('AB')) return '#E9C46A';
  if (bloodType.startsWith('0') || bloodType.startsWith('O')) return '#264653';
  return '#1A1A2E';
};

const DetailRow = ({ iconName, label, value }: { iconName: any, label: string, value: string }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabelContainer}>
      <Ionicons name={iconName} size={18} color="#666" style={{ marginRight: 6 }} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const normalizeListingStatus = (raw: any): string => {
  const s = (raw || '').toString().toLowerCase();
  if (s === 'resolved' || s === 'completed' || s === 'tamamlandı' || s === 'karşılandı' || s === 'closed') return 'Tamamlandı';
  if (s === 'approved' || s === 'accepted' || s === 'onaylandı' || s === 'kabul' || s === 'in_progress') return 'Onaylandı';
  if (s === 'cancelled' || s === 'iptal' || s === 'iptal edildi') return 'İptal Edildi';
  return 'Aktif';
};

export default function ListingDetailScreen({ route, navigation }: any) {
  const { listing } = route.params;
  const [listingData, setListingData] = useState<any>(listing || {});
  const [currentStatus, setCurrentStatus] = useState<string>(normalizeListingStatus(listing?.status || 'Aktif'));
  const [isVolunteered, setIsVolunteered] = useState<boolean>(listing?.isAlreadyVolunteered || false);
  const [isMine, setIsMine] = useState<boolean>(listing?.isMine || false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(true);

  useEffect(() => {
    const fetchFreshListingDetails = async () => {
      try {
        setIsLoadingDetails(true);
        const [profileRes, reqRes, volRes, myAppsRes] = await Promise.all([
          getUserProfile().catch(() => null),
          getBloodRequestById(listing.id).catch(() => null),
          getVolunteers(listing.id).catch(() => []),
          getMyApplications().catch(() => [])
        ]);

        let userObj = profileRes?.data || profileRes?.user || profileRes || null;
        const currentId = userObj?.ID || userObj?.id || null;

        const freshReq = reqRes?.blood_request || (reqRes?.data && reqRes.data.blood_request) || reqRes?.data || reqRes || {};
        const volArray = Array.isArray(volRes) ? volRes : (volRes?.data || volRes?.volunteers || []);
        const myAppsArray = Array.isArray(myAppsRes) ? myAppsRes : (myAppsRes?.data || myAppsRes?.applications || []);

        // 1. Kendi ilanım mı?
        const ownerId = freshReq.user_id || freshReq.UserID || (freshReq.user && (freshReq.user.ID || freshReq.user.id)) || listing.userId || listing.ownerId;
        const checkMine = (currentId && ownerId && currentId === ownerId) || listing.isMine;
        setIsMine(!!checkMine);

        // 2. Ben bu ilana gönüllü müyüm?
        const myVolRecord = volArray.find((v: any) => {
          const vUserId = v.user_id || v.UserID || (v.user && (v.user.ID || v.user.id));
          return currentId && vUserId === currentId;
        });
        const myAppRecord = myAppsArray.find((app: any) => {
          const appId = app.blood_request_id || app.BloodRequestID || app.request_id || (app.blood_request && (app.blood_request.ID || app.blood_request.id));
          return appId && (appId.toString() === listing.id.toString() || appId.toString() === (freshReq.ID || freshReq.id)?.toString());
        });

        if (myVolRecord || myAppRecord || listing.isAlreadyVolunteered) {
          setIsVolunteered(true);
        }

        // 3. Gerçek zamanlı durum (Status) kontrolü
        const rawStatus = (freshReq.status || freshReq.Status || listing.status || '').toString().toLowerCase();
        const hasApprovedVol = volArray.some((v: any) => {
          const vs = (v.status || v.Status || '').toString().toLowerCase();
          return vs === 'approved' || vs === 'accepted' || vs === 'onaylandı' || vs === 'kabul' || vs === 'active';
        });

        let newStatus = 'Aktif';
        if (rawStatus === 'resolved' || rawStatus === 'completed' || rawStatus === 'tamamlandı' || rawStatus === 'karşılandı' || rawStatus === 'closed') {
          newStatus = 'Tamamlandı';
        } else if (hasApprovedVol || rawStatus === 'approved' || rawStatus === 'accepted' || rawStatus === 'onaylandı' || rawStatus === 'kabul' || rawStatus === 'in_progress') {
          newStatus = 'Onaylandı';
        } else if (rawStatus === 'cancelled' || rawStatus === 'iptal') {
          newStatus = 'İptal Edildi';
        }
        setCurrentStatus(newStatus);

        if (freshReq && (freshReq.ID || freshReq.id)) {
          setListingData((prev: any) => ({
            ...prev,
            unitsNeeded: freshReq.required_units || prev.unitsNeeded,
            urgency: freshReq.urgency_level || prev.urgency,
            medicalNote: freshReq.medical_note !== undefined ? freshReq.medical_note : prev.medicalNote,
            status: newStatus,
            isMine: !!checkMine
          }));
        }
      } catch (error) {
        console.log('Detaylar çekilemedi:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    if (listing?.id) {
      fetchFreshListingDetails();
    }
  }, [listing?.id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Acil Kan İhtiyacı! ${listingData.patientName} için ${listingData.hospital} (${listingData.location}) hastanesinde ${listingData.bloodType} kan grubuna ihtiyaç var. Lütfen BloodBridge uygulamasından başvurarak destek olun. Her bağış bir hayat kurtarır!`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleDirections = () => {
    const query = `${listingData.hospital}, ${listingData.location}, Türkiye`;
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${encodeURIComponent(query)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'Harita uygulaması açılamadı.');
    });
  };

  const handleVolunteer = () => {
    if (isSubmitting) return;

    if (isMine) {
      Alert.alert(
        'Kendi İlanınız', 
        'Kendi açtığınız kan ilanına gönüllü başvurusu yapamazsınız. Başvuran gönüllüleri incelemek ve onaylamak için aşağıdaki "İlanı Yönet ve Başvuruları İncele" butonunu kullanabilirsiniz.'
      );
      return;
    }

    if (!isVolunteered) {
      Alert.alert(
        'Gönüllü Ol',
        'Bu kan isteği için gönüllü olmak istediğinize emin misiniz? İletişim bilgileriniz hasta yakını ile paylaşılacaktır.',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Evet, Gönüllüyüm', 
            onPress: async () => {
              try {
                setIsSubmitting(true);
                await applyAsVolunteer(listingData.id || listing.id);
                setIsVolunteered(true);
                Alert.alert('Harika!', 'Başvurunuz başarıyla hastaya iletildi.');
              } catch (error: any) {
                console.log("Başvuru Hatası detay:", error?.response?.data || error?.message);
                const rawMsg = `${error?.response?.data?.error || ''} ${error?.response?.data?.details || ''} ${error?.response?.data?.message || ''} ${error?.message || ''}`.toString().toLowerCase();
                if (rawMsg.includes('own') || rawMsg.includes('kendi') || isMine) {
                  Alert.alert('Uyarı', 'Kendi açtığınız kan ilanına gönüllü başvurusu yapamazsınız. İlanı yönetmek için aşağıdan İlanı Yönet ekranına geçebilirsiniz.');
                } else if (rawMsg.includes('already') || rawMsg.includes('zaten')) {
                  setIsVolunteered(true);
                  Alert.alert('Bilgi', 'Bu ilana zaten başvuru yapmışsınız. Başvurunuz hastaya iletilmiş durumdadır.');
                } else {
                  const translated = getErrorMessage(error, 'Başvuru yapılamadı. Kendi ilanınıza başvurmaya çalışıyor veya zaten başvurmuş olabilirsiniz.');
                  Alert.alert('Uyarı', translated);
                }
              } finally {
                setIsSubmitting(false);
              }
            } 
          }
        ]
      );
    } else {
      Alert.alert(
        'Başvuruyu Geri Çek',
        'Başvurunuzu iptal etmek istediğinize emin misiniz?',
        [
          { text: 'Hayır', style: 'cancel' },
          { 
            text: 'Evet', 
            onPress: async () => {
              try {
                setIsSubmitting(true);
                await cancelVolunteerApplication(listingData.id || listing.id, listingData.applicationId || listing.applicationId);
                setIsVolunteered(false);
                Alert.alert('İptal Edildi', 'Gönüllü başvurunuz başarıyla geri çekildi.');
              } catch (error: any) {
                console.log("İptal Hatası:", error?.message || error);
                setIsVolunteered(false);
                Alert.alert('İptal Edildi', 'Gönüllü başvurunuz geri çekildi.');
              } finally {
                setIsSubmitting(false);
              }
            } 
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlan Detayı</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#E63946" />
          </TouchableOpacity>
          <View style={[styles.urgencyBadge, { borderColor: getUrgencyColor(listingData.urgency) }]}>
            <Text style={[styles.urgencyText, { color: getUrgencyColor(listingData.urgency) }]}>{listingData.urgency}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Kendi İlanım Banner */}
        {isMine && (
          <View style={[styles.infoBox, { backgroundColor: '#F3E5F5', borderColor: '#9C27B0', marginBottom: 15 }]}>
            <Ionicons name="person-circle-outline" size={32} color="#6A1B9A" style={{ marginRight: 10 }} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: '#6A1B9A' }]}>Bu İlan Size Ait</Text>
              <Text style={styles.infoDesc}>Kendi açtığınız ilana gönüllü olamazsınız. Başvuran gönüllüleri incelemek ve onaylamak için aşağıdaki "İlanı Yönet" butonunu kullanabilirsiniz.</Text>
            </View>
          </View>
        )}

        {/* Patient Card */}
        <View style={styles.patientCard}>
          <View style={[styles.bloodBadgeBig, { backgroundColor: getBloodTypeBgColor(listingData.bloodType) }]}>
            <Text style={styles.bloodBadgeTextBig}>{listingData.bloodType}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{listingData.patientName}</Text>
            <Text style={styles.patientLabel}>Hasta</Text>
          </View>
        </View>

        {/* Details Container */}
        <View style={styles.detailsContainer}>
          <DetailRow iconName="medkit-outline" label="HASTANE" value={listingData.hospital} />
          <View style={styles.divider} />
          <DetailRow iconName="location-outline" label="KONUM" value={listingData.location} />
          <View style={styles.divider} />
          <DetailRow iconName="water-outline" label="GEREKEN ÜNİTE" value={`${listingData.unitsNeeded} Ünite`} />
          <View style={styles.divider} />
          <DetailRow iconName="time-outline" label="YAYINLANMA" value={listingData.timeAgo || 'Yayında'} />
          
          <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
            <Ionicons name="compass-outline" size={20} color="#E63946" style={{ marginRight: 6 }} />
            <Text style={styles.directionsText}>Haritada Aç / Yol Tarifi Al</Text>
          </TouchableOpacity>
        </View>

        {/* Medical Note Card */}
        <View style={styles.medicalNoteCard}>
          <Text style={styles.medicalNoteTitle}>Tıbbi Not</Text>
          <Text style={styles.medicalNoteText}>{listingData.medicalNote || 'Tıbbi not belirtilmemiş.'}</Text>
        </View>

        {/* Info Box */}
        {isVolunteered ? (
          <View style={[
            styles.infoBox, 
            styles.infoBoxVolunteered,
            (currentStatus === 'Onaylandı' || currentStatus?.includes('Karşılandı')) && { backgroundColor: '#EBFBF9', borderColor: '#2EC4B6' },
            currentStatus === 'Reddedildi' && { backgroundColor: '#FFF2F2', borderColor: '#E63946' }
          ]}>
            <Ionicons 
              name={(currentStatus === 'Onaylandı' || currentStatus?.includes('Karşılandı')) ? 'ribbon-outline' : currentStatus === 'Reddedildi' ? 'close-circle-outline' : 'checkmark-circle-outline'} 
              size={32} 
              color={(currentStatus === 'Onaylandı' || currentStatus?.includes('Karşılandı')) ? '#2EC4B6' : currentStatus === 'Reddedildi' ? '#E63946' : '#2EC4B6'} 
              style={{ marginRight: 10 }} 
            />
            <View style={styles.infoTextContainer}>
              <Text style={[
                styles.infoTitle, 
                styles.infoTitleVolunteered,
                (currentStatus === 'Onaylandı' || currentStatus?.includes('Karşılandı')) && { color: '#2EC4B6' },
                currentStatus === 'Reddedildi' && { color: '#E63946' }
              ]}>
                {currentStatus === 'Onaylandı' || currentStatus?.includes('Onaylandı') 
                  ? 'Başvurunuz Onaylandı!' 
                  : currentStatus === 'Tamamlandı' || currentStatus?.includes('Karşılandı')
                  ? 'İhtiyaç Başarıyla Karşılandı!'
                  : currentStatus === 'Reddedildi'
                  ? 'Başvurunuz Kabul Edilemedi'
                  : 'Başvurunuz alındı!'}
              </Text>
              <Text style={styles.infoDesc}>
                {currentStatus === 'Onaylandı' || currentStatus?.includes('Onaylandı')
                  ? 'İlan sahibi sizinle iletişime geçecektir. Lütfen telefonunuzu açık tutun.'
                  : currentStatus === 'Tamamlandı' || currentStatus?.includes('Karşılandı')
                  ? 'Bu kan talebinde bağış süreci başarıyla tamamlanmıştır. Destekleriniz için teşekkür ederiz!'
                  : currentStatus === 'Reddedildi'
                  ? 'Bu ilan için başka bir gönüllü ile ilerlenmiş olabilir. İlginiz için çok teşekkür ederiz.'
                  : 'Hasta yakını sizinle iletişime geçecektir. Lütfen telefonunuzu açık tutun.'}
              </Text>
            </View>
          </View>
        ) : currentStatus === 'Tamamlandı' ? (
          <View style={[styles.infoBox, { backgroundColor: '#E8F8F5', borderColor: '#2EC4B6' }]}>
            <Ionicons name="flag-outline" size={32} color="#16A085" style={{ marginRight: 10 }} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: '#16A085' }]}>İhtiyaç Karşılandı</Text>
              <Text style={styles.infoDesc}>Bu kan talebi için gerekli bağış süreci tamamlanmıştır. Duyarlılığınız ve desteğiniz için teşekkür ederiz!</Text>
            </View>
          </View>
        ) : currentStatus === 'Onaylandı' ? (
          <View style={[styles.infoBox, { backgroundColor: '#EBF5FB', borderColor: '#3498DB' }]}>
            <Ionicons name="people-outline" size={32} color="#2980B9" style={{ marginRight: 10 }} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: '#2980B9' }]}>Gönüllü Bulundu / İşlemde</Text>
              <Text style={styles.infoDesc}>İlan sahibi şu an onaylanan bir gönüllü ile iletişim halinde. İhtiyacın devam etme ihtimaline karşı yedek gönüllü olarak başvurabilirsiniz.</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.infoBox, styles.infoBoxNotVolunteered]}>
            <Ionicons name="heart-outline" size={32} color="#E63946" style={{ marginRight: 10 }} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, styles.infoTitleNotVolunteered]}>Nasıl Yardımcı Olabilirsiniz?</Text>
              <Text style={styles.infoDesc}>Gönüllü olduğunuzda bilgileriniz hasta yakını ile paylaşılır ve sizinle iletişime geçmeleri sağlanır.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA Button */}
      <View style={styles.bottomContainer}>
        {isMine ? (
          <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: '#1A1A2E', borderColor: '#1A1A2E' }]} 
            onPress={() => navigation.navigate('MyListingDetail', { listing: listingData })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="settings-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={[styles.ctaButtonText, { color: '#FFF', fontWeight: 'bold' }]}>İlanı Yönet ve Başvuruları İncele</Text>
            </View>
          </TouchableOpacity>
        ) : isVolunteered ? (
          <TouchableOpacity 
            style={[
              styles.ctaButton, 
              styles.ctaButtonVolunteered,
              (currentStatus === 'Onaylandı' || currentStatus?.includes('Karşılandı')) && { backgroundColor: '#2EC4B6' },
              currentStatus === 'Reddedildi' && { backgroundColor: '#888' }
            ]} 
            onPress={handleVolunteer}
          >
            <Text style={[styles.ctaButtonText, styles.ctaButtonTextVolunteered, (currentStatus === 'Onaylandı' || currentStatus?.includes('Karşılandı')) && { color: '#FFF' }]}>
              {currentStatus === 'Onaylandı' || currentStatus?.includes('Karşılandı')
                ? 'Başvurunuz Onaylandı / Karşılandı'
                : currentStatus === 'Reddedildi'
                ? 'Başvuru Sonuçlandı'
                : 'Başvuruldu — Geri Çek'}
            </Text>
          </TouchableOpacity>
        ) : currentStatus === 'Tamamlandı' ? (
          <View style={[styles.ctaButton, { backgroundColor: '#95A5A6', borderColor: '#7F8C8D' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={[styles.ctaButtonText, { color: '#FFF', fontWeight: 'bold' }]}>İhtiyaç Karşılandı (Kapalı)</Text>
            </View>
          </View>
        ) : currentStatus === 'Onaylandı' ? (
          <TouchableOpacity style={[styles.ctaButton, { backgroundColor: '#3498DB', borderColor: '#2980B9' }]} onPress={handleVolunteer}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="heart-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={[styles.ctaButtonText, { color: '#FFF', fontWeight: 'bold' }]}>Yedek Gönüllü Ol</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.ctaButton, styles.ctaButtonNotVolunteered]} onPress={handleVolunteer}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="heart-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={[styles.ctaButtonText, styles.ctaButtonTextNotVolunteered]}>Gönüllü Ol</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
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
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    width: 36,
    height: 36,
    marginRight: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bloodBadgeBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bloodBadgeTextBig: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  patientLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F8FF',
    borderWidth: 1,
    borderColor: '#D0E4FF',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  directionsIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  directionsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066CC',
  },
  medicalNoteCard: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFE8CC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  medicalNoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D47E15',
    marginBottom: 8,
  },
  medicalNoteText: {
    fontSize: 15,
    color: '#5C3A21',
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoBoxNotVolunteered: {
    backgroundColor: '#FFF0F1',
  },
  infoBoxVolunteered: {
    backgroundColor: '#E8FFF5',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoTitleNotVolunteered: {
    color: '#E63946',
  },
  infoTitleVolunteered: {
    color: '#2EC4B6',
  },
  infoDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ctaButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  ctaButtonNotVolunteered: {
    backgroundColor: '#E63946',
  },
  ctaButtonVolunteered: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#2EC4B6',
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ctaButtonTextNotVolunteered: {
    color: '#FFF',
  },
  ctaButtonTextVolunteered: {
    color: '#2EC4B6',
  },
});