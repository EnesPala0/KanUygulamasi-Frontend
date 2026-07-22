import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { getNotifications, markNotificationAsRead, getMyBloodRequests } from '../api/blood';
import { Ionicons } from '@expo/vector-icons';

const getIconForType = (type: string) => {
  switch (type) {
    case 'volunteer_applied': return 'person-add-outline';
    case 'application_approved': return 'checkmark-circle-outline';
    case 'application_rejected': return 'close-circle-outline';
    case 'urgent_need': return 'alert-circle-outline';
    case 'reminder': return 'water-outline';
    case 'thank_you': return 'heart-outline';
    default: return 'notifications-outline';
  }
};

const translateNotification = (type: string, title: string, message: string) => {
  let trTitle = title || 'Bildirim';
  let trMessage = message || '';
  const lowerTitle = (title || '').toLowerCase();
  const lowerMsg = (message || '').toLowerCase();
  const lowerType = (type || '').toLowerCase();

  if (lowerType.includes('approved') || lowerTitle.includes('approved') || lowerTitle.includes('accepted') || lowerTitle.includes('onay') || lowerMsg.includes('approved') || lowerMsg.includes('accepted')) {
    trTitle = 'Başvurunuz Onaylandı!';
    trMessage = 'Gönüllü başvurunuz ilan sahibi tarafından onaylandı. Sizinle iletişime geçecekler.';
  } else if (lowerType.includes('rejected') || lowerTitle.includes('rejected') || lowerTitle.includes('red') || lowerMsg.includes('rejected')) {
    trTitle = 'Başvurunuz Sonuçlandı';
    trMessage = 'Bu ilan için başka bir gönüllü ile ilerlenmiş olabilir. İlginiz için çok teşekkür ederiz.';
  } else if (lowerType.includes('volunteer_applied') || lowerTitle.includes('new volunteer') || lowerTitle.includes('yeni gönüllü') || lowerMsg.includes('you have a new volunteer') || lowerMsg.includes('someone applied')) {
    trTitle = 'Yeni Gönüllü Başvurusu!';
    trMessage = 'İlanınıza yeni bir gönüllü başvurdu. İletişim bilgilerini görmek ve onaylamak için dokunun.';
  } else if (lowerType.includes('urgent') || lowerTitle.includes('urgent') || lowerTitle.includes('acil')) {
    trTitle = 'Acil Kan İhtiyacı!';
    trMessage = 'Bölgenizde acil kan ihtiyacı olan bir hasta var. Destek olmak için dokunun.';
  } else if (lowerType.includes('completed') || lowerTitle.includes('completed') || lowerTitle.includes('tamamlandı')) {
    trTitle = 'Kan İhtiyacı Karşılandı';
    trMessage = 'Destek olduğunuz kan talebi başarıyla tamamlandı.';
  }

  return { title: trTitle, message: trMessage };
};

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      const data = response.data || response.notifications || response;
      const formatted = Array.isArray(data) ? data.map((item: any) => {
        const { title: trTitle, message: trMessage } = translateNotification(item.type, item.title, item.message);
        return {
          id: item.id || item.ID,
          type: item.type,
          title: trTitle,
          message: trMessage,
          isRead: item.is_read || item.isRead,
          timeAgo: 'Yeni',
          icon: getIconForType(item.type),
          rawItem: item,
          bloodRequestId: item.blood_request_id || item.BloodRequestID || item.request_id || item.RequestID || item.related_id || item.RelatedID || item.listing_id || item.ListingID || item.blood_request?.ID || item.blood_request?.id || item.data?.blood_request_id || item.data?.request_id,
        };
      }) : [];
      setNotifications(formatted);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Hata', 'Bildirimler yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.isRead) return;

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    markAsRead(notification.id);

    const reqId = notification.bloodRequestId 
      || notification.rawItem?.blood_request_id 
      || notification.rawItem?.BloodRequestID 
      || notification.rawItem?.request_id 
      || notification.rawItem?.RequestID 
      || notification.rawItem?.related_id 
      || notification.rawItem?.RelatedID 
      || notification.rawItem?.listing_id 
      || notification.rawItem?.ListingID 
      || notification.rawItem?.blood_request?.ID 
      || notification.rawItem?.blood_request?.id
      || notification.rawItem?.data?.blood_request_id
      || notification.rawItem?.data?.request_id;

    const titleStr = (notification.title || '').toLowerCase();
    const typeStr = (notification.type || '').toLowerCase();
    const msgStr = (notification.message || '').toLowerCase();

    const isVolunteerApplication = typeStr.includes('volunteer') || titleStr.includes('volunteer') || titleStr.includes('gönüllü') || titleStr.includes('başvur') || msgStr.includes('gönüllü') || msgStr.includes('volunteer');
    const isStatusUpdate = typeStr.includes('approved') || typeStr.includes('rejected') || typeStr.includes('urgent') || titleStr.includes('onay') || titleStr.includes('red') || titleStr.includes('karşılandı');

    if (isVolunteerApplication) {
      if (reqId && reqId !== '0') {
        navigation.navigate('MyListingDetail', {
          listing: {
            id: reqId.toString(),
            bloodType: 'Kan Talebi',
            hospital: 'İlan Detayları Yükleniyor...',
            location: 'Türkiye',
            unitsNeeded: 1,
            urgency: 'Acil',
            timeAgo: 'Az önce',
            status: 'Aktif'
          }
        });
        return;
      } else {
        try {
          const myLists = await getMyBloodRequests();
          const listArray = Array.isArray(myLists) ? myLists : (myLists?.data || myLists?.requests || []);
          const activeList = listArray.find((l: any) => (l.status || '').toLowerCase() !== 'completed') || listArray[0];
          if (activeList && (activeList.ID || activeList.id)) {
            navigation.navigate('MyListingDetail', {
              listing: {
                id: (activeList.ID || activeList.id).toString(),
                bloodType: activeList.required_blood_type || 'Kan Talebi',
                hospital: activeList.hospital_name || 'Hastane Detayı',
                location: activeList.city || 'Türkiye',
                unitsNeeded: activeList.required_units || 1,
                urgency: activeList.urgency_level || 'Acil',
                timeAgo: 'Az önce',
                status: activeList.status === 'completed' ? 'Tamamlandı' : 'Aktif'
              }
            });
            return;
          }
        } catch (e) {
          console.log("İlanlar alınamadı:", e);
        }
        navigation.navigate('ProfileTab');
        return;
      }
    }

    if (isStatusUpdate && reqId && reqId !== '0') {
      navigation.navigate('ListingDetail', {
        listing: {
          id: reqId.toString(),
          patientName: 'İhtiyaç Sahibi',
          bloodType: 'Kan İhtiyacı',
          hospital: 'Hastane',
          location: 'Konum',
          unitsNeeded: 1,
          urgency: 'Acil',
          timeAgo: 'Yeni',
          medicalNote: '',
          status: typeStr.includes('approved') || titleStr.includes('onay') ? 'Onaylandı' : typeStr.includes('rejected') || titleStr.includes('red') ? 'Reddedildi' : 'Aktif',
          isAlreadyVolunteered: typeStr.includes('approved') || typeStr.includes('rejected') || titleStr.includes('onay') || titleStr.includes('red')
        }
      });
      return;
    }

    Alert.alert(
      notification.title || 'Bildirim Detayı',
      notification.message || 'Bildirim içeriği',
      [
        { text: 'Kapat', style: 'cancel' },
        { text: 'İlanlarıma Git', onPress: () => navigation.navigate('ProfileTab') }
      ]
    );
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );

    try {
      await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'volunteer_applied': return '#457B9D';
      case 'application_approved': return '#2EC4B6';
      case 'application_rejected': return '#E63946';
      case 'urgent_need': return '#E63946';
      case 'reminder': return '#F4845F';
      case 'thank_you': return '#E9C46A';
      default: return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Tümünü Oku</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E63946" />
        }
      >
        {loading && notifications.length === 0 ? (
          <ActivityIndicator size="large" color="#E63946" style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-outline" size={40} color="#E63946" />
            </View>
            <Text style={styles.emptyTitle}>Henüz Yeni Bildirim Yok</Text>
            <Text style={styles.emptySubText}>
              Gönüllü başvuruları, onaylar veya acil kan talepleri olduğunda burada anlık bildirim alırsınız.
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionButton} 
              onPress={() => navigation.navigate('HomeTab')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="home-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionText}>Aktif İlanlara Göz At</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          notifications.map((notification, index) => (
            <TouchableOpacity
              key={`notif-${notification.id}-${index}`}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.notificationCardUnread,
              ]}
              activeOpacity={0.7}
              onPress={() => handleNotificationClick(notification)}
            >
              {/* Unread indicator */}
              {!notification.isRead && <View style={styles.unreadDot} />}

              <View style={[styles.iconContainer, { backgroundColor: getTypeColor(notification.type) + '18' }]}>
                <Ionicons name={notification.icon || 'notifications-outline'} size={24} color={getTypeColor(notification.type)} />
              </View>

              <View style={styles.notificationContent}>
                <Text style={[
                  styles.notificationTitle,
                  !notification.isRead && styles.notificationTitleUnread,
                ]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>{notification.timeAgo}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: -2,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  headerBadge: {
    backgroundColor: '#E63946',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  headerBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 10,
  },
  markAllText: {
    color: '#E63946',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  /* 2-A: Şık Boş Durum (Empty State) Stilleri */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginVertical: 30,
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
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  notificationCardUnread: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFE0E0',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E63946',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 6,
  },
  iconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: '800',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#888',
    lineHeight: 19,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: '#BBB',
  },
});
