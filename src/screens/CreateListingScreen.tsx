import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { createBloodRequest } from '../api/blood';
import { TURKEY_CITIES } from '../constants/cities';
import { Ionicons } from '@expo/vector-icons';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];
const URGENCY_LEVELS = ['Normal', 'Acil', 'Kritik'];

const getUrgencyColor = (urgency: string) => {
  if (urgency === 'Kritik') return '#E63946';
  if (urgency === 'Acil') return '#F4845F';
  if (urgency === 'Normal') return '#2EC4B6';
  return '#999';
};

export default function CreateListingScreen({ navigation }: any) {
  const [bloodType, setBloodType] = useState('');
  const [hospital, setHospital] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState('');
  const [urgency, setUrgency] = useState('');
  const [medicalNote, setMedicalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCityModalVisible, setCityModalVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const filteredCities = TURKEY_CITIES.filter(c => 
    c.toLowerCase().includes(citySearchQuery.toLowerCase().trim())
  );

  const handleSubmit = async () => {
    if (!bloodType || !hospital || !city || !district || !unitsNeeded || !urgency) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBloodRequest({
        required_blood_type: bloodType,
        hospital_name: hospital,
        city: city,
        district: district,
        required_units: parseInt(unitsNeeded, 10),
        urgency_level: urgency,
        medical_note: medicalNote,
      });

      Alert.alert(
        'Başarılı', 
        'İlanınız başarıyla oluşturuldu! Profil > İlanlarım (Açtıklarım) sekmesinden gelen gönüllü başvurularını anlık takip edip onaylayabilirsiniz.', 
        [
          { 
            text: 'Tamam', 
            onPress: () => {
              setPatientName('');
              setBloodType('');
              setHospital('');
              setCity('');
              setDistrict('');
              setUnitsNeeded('');
              setUrgency('');
              setMedicalNote('');
              navigation.goBack();
            } 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Hata', 'İlan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close-outline" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni İlan</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Kan Grubu*</Text>
            <View style={styles.pillContainer}>
              {BLOOD_TYPES.map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.pill, bloodType === type && styles.pillActive]}
                  onPress={() => setBloodType(type)}
                >
                  <Text style={[styles.pillText, bloodType === type && styles.pillTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Hastane*</Text>
            <TextInput 
              style={styles.input} 
              value={hospital}
              onChangeText={setHospital}
              placeholder="Hastane adını girin"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>İl*</Text>
              <TouchableOpacity 
                style={[styles.input, { justifyContent: 'center' }]} 
                onPress={() => setCityModalVisible(true)}
              >
                <Text style={{ color: city ? '#1A1A2E' : '#999', fontSize: 15 }}>
                  {city || 'Şehir Seçin ▾'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>İlçe*</Text>
              <TextInput 
                style={styles.input} 
                value={district}
                onChangeText={setDistrict}
                placeholder="Örn: Kadıköy"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gereken Ünite*</Text>
            <TextInput 
              style={styles.input} 
              value={unitsNeeded}
              onChangeText={setUnitsNeeded}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Aciliyet Seviyesi*</Text>
            <View style={styles.urgencyContainer}>
              {URGENCY_LEVELS.map(level => {
                const color = getUrgencyColor(level);
                const isActive = urgency === level;
                return (
                  <TouchableOpacity 
                    key={level} 
                    style={[
                      styles.urgencyPill, 
                      isActive && { backgroundColor: color, borderColor: color }
                    ]}
                    onPress={() => setUrgency(level)}
                  >
                    <Text style={[
                      styles.urgencyPillText, 
                      isActive && { color: '#FFF', fontWeight: 'bold' }
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tıbbi Not</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={medicalNote}
              onChangeText={setMedicalNote}
              placeholder="Eklemek istediğiniz notlar (opsiyonel)"
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>İlan Oluştur</Text>
          )}
        </TouchableOpacity>
      </View>

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
              <Text style={styles.modalTitle}>Şehir Seçin</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)} style={{ padding: 6 }}>
                <Ionicons name="close-outline" size={26} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Şehir ara (Örn: İstanbul)..."
              placeholderTextColor="#999"
              value={citySearchQuery}
              onChangeText={setCitySearchQuery}
              autoFocus={false}
            />
            <FlatList
              data={filteredCities}
              keyExtractor={item => item}
              style={{ maxHeight: 260 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cityItem, city === item && styles.cityItemActive]}
                  onPress={() => {
                    setCity(item);
                    setCityModalVisible(false);
                    setCitySearchQuery('');
                  }}
                >
                  <Text style={[styles.cityItemText, city === item && styles.cityItemTextActive]}>
                    {item}
                  </Text>
                  {city === item && <Text style={styles.cityCheck}>✓</Text>}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  pill: {
    width: '21%',
    margin: '2%',
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#E63946',
    borderColor: '#E63946',
  },
  pillText: {
    color: '#666',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urgencyPill: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  urgencyPillText: {
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#E63946',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
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
});
