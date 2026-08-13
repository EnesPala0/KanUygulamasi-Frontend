import React, { useState } from 'react';
import { registerUser } from '../api/auth';
import { getErrorMessage } from '../utils/errors';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';

export default function SignupScreen({ navigation }: any) {
  // Go Backend modelimize (User struct) uygun state'ler
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');

  // Kan grupları dizisi (Modern seçim arayüzü için)
  const bloodTypesList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

  // 2-B: Telefon Numarası Maskeleme / Formatlama (05XX XXX XX XX)
  const formatPhoneNumber = (text: string) => {
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
    setPhone(formatted);
  };

  const handleSignup = async () => {
  // Modelindeki gorm:"not null" kurallarına göre tüm alanların doluluğunu kontrol ediyoruz
  if (!firstName || !lastName || !email || !password || !phone || !bloodType || !city || !district) {
    Alert.alert('Hata', 'Lütfen tüm alanları eksiksiz doldurun.');
    return;
  }

  // Şifre Güvenlik Kontrolü: En az 8 karakter, 1 büyük harf, 1 rakam
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    Alert.alert(
      'Zayıf Şifre', 
      'Şifreniz en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf ile bir rakam içermelidir.'
    );
    return;
  }

  // 2-B: Telefon numarasının 05 ile başlamasını ve tam 11 hane olmasını kontrol et
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone.startsWith('05') || cleanPhone.length !== 11) {
    Alert.alert('Geçersiz Telefon Numarası', 'Lütfen geçerli bir cep telefonu numarası girin (Örn: 0555 123 45 67).');
    return;
  }

  try {
    // Tüm verileri sırasıyla Go'ya fırlatıyoruz (Örn: Enes, Pala, A+, Antalya vb.)
    const data = await registerUser(
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      bloodType, 
      city, 
      district
    );
    
    console.log("Go'dan Gelen Başarı Yanıtı:", data);
    Alert.alert('Neredeyse Bitti!', 'Hesabınız oluşturuldu. Lütfen e-posta adresinize gönderdiğimiz 6 haneli doğrulama kodunu girin.');
    
    // İşlem başarılı, OTP Doğrulama ekranına yolla
    navigation.navigate('OTPVerification', { email: email.trim() });

  } catch (error: any) {
    console.log("Kayıt Hatası detay:", error?.response?.data || error?.message);
    const backendMsg = getErrorMessage(error, 'Kayıt olunamadı. Lütfen girdiğiniz bilgilerin doğruluğunu kontrol edip tekrar deneyiniz.');
    Alert.alert('Kayıt Başarısız', backendMsg);
  }
};
  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#E63946' }} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Gönüllü Ol</Text>
            <Text style={styles.headerSub}>Kan ver, hayat kurtar. Ailemize katıl.</Text>
          </View>

          {/* Uzun form olduğu için ScrollView kullanıyoruz */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Ad</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.inputText} placeholder="Emre" placeholderTextColor="#9CA3AF" value={firstName} onChangeText={setFirstName} />
              </View>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Soyad</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.inputText} placeholder="Arslan" placeholderTextColor="#9CA3AF" value={lastName} onChangeText={setLastName} />
              </View>
            </View>
          </View>

          <Text style={styles.label}>E-posta</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              placeholder="ornek@mail.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>Şifre</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Şifre Güvenlik Kriterleri */}
          <View style={styles.passwordCriteriaContainer}>
            <View style={styles.criteriaRow}>
              <Ionicons name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} size={14} color={password.length >= 8 ? "#10B981" : "#9CA3AF"} />
              <Text style={[styles.criteriaText, password.length >= 8 && styles.criteriaTextValid]}>En az 8 karakter</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Ionicons name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} size={14} color={/[A-Z]/.test(password) ? "#10B981" : "#9CA3AF"} />
              <Text style={[styles.criteriaText, /[A-Z]/.test(password) && styles.criteriaTextValid]}>En az 1 büyük harf</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Ionicons name={/[0-9]/.test(password) ? "checkmark-circle" : "ellipse-outline"} size={14} color={/[0-9]/.test(password) ? "#10B981" : "#9CA3AF"} />
              <Text style={[styles.criteriaText, /[0-9]/.test(password) && styles.criteriaTextValid]}>En az 1 rakam</Text>
            </View>
          </View>

          <Text style={styles.label}>Telefon Numarası</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={18} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.inputText}
              placeholder="0555 123 45 67"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={14}
              value={phone}
              onChangeText={formatPhoneNumber}
            />
          </View>

          {/* Şık Kan Grubu Seçici (Pill UI) */}
          <Text style={styles.label}>Kan Grubu</Text>
          <View style={styles.bloodTypeContainer}>
            {bloodTypesList.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.bloodTypeButton,
                  bloodType === type && styles.bloodTypeButtonSelected
                ]}
                onPress={() => setBloodType(type)}
              >
                <Text style={[
                  styles.bloodTypeText,
                  bloodType === type && styles.bloodTypeTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>İl</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.inputText} placeholder="İstanbul" placeholderTextColor="#9CA3AF" value={city} onChangeText={setCity} />
              </View>
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>İlçe</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="map-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.inputText} placeholder="Şişli" placeholderTextColor="#9CA3AF" value={district} onChangeText={setDistrict} />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Kayıt Ol</Text>
          </TouchableOpacity>

          {/* Login'e Git */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 30,
    backgroundColor: '#E63946',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
    marginTop: -30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    height: '100%',
  },
  eyeButton: {
    paddingLeft: 10,
    height: '100%',
    justifyContent: 'center',
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 10,
  },
  bloodTypeButton: {
    width: '23%',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bloodTypeButtonSelected: {
    backgroundColor: '#EF4444',
  },
  bloodTypeText: {
    color: '#374151',
    fontWeight: '600',
  },
  bloodTypeTextSelected: {
    color: '#FFF',
  },
  passwordCriteriaContainer: {
    marginTop: -10,
    marginBottom: 20,
    paddingHorizontal: 4,
    gap: 4,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criteriaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  criteriaTextValid: {
    color: '#10B981',
  },
  signupButton: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  signupButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#E63946',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerSpacer: {
    height: 50,
  },
});