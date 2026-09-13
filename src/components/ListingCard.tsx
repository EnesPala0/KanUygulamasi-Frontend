import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getUrgencyColor = (urgency: string) => {
  if (urgency === 'Kritik') return '#E63946';
  if (urgency === 'Acil') return '#F4845F';
  return '#2A9D8F';
};

const getBloodTypeBgColor = (bloodType: string) => {
  if (bloodType.includes('-')) return '#E8F8F5'; // Negatifler için yeşilimsi açık ton
  return '#FDEDEC'; // Pozitifler için kırmızımsı açık ton
};

interface ListingCardProps {
  item: any;
  onPress: () => void;
}

const ListingCard = React.memo(({ item, onPress }: ListingCardProps) => {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
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
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bloodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  bloodBadgeText: {
    color: '#E63946',
    fontWeight: 'bold',
    fontSize: 16,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
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
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  statusBadgeHome: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '70%',
  },
  statusTextHome: {
    fontSize: 11,
  },
});

export default ListingCard;
