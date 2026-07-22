import React, { useState } from 'react';
import { registerUser } from '../api/auth';
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
    Alert.alert('Süper!', 'Hesabın başarıyla oluşturuldu. Şimdi giriş yapabilirsin.');
    
    // İşlem başarılı, Login'e yolla
    navigation.navigate('Login');

  } catch (error) {
    console.error("Kayıt Hatası:", error);
    Alert.alert('Kayıt Başarısız', 'Bir sorun oluştu. Bilgileri kontrol edip tekrar deneyin.');
  }
};
  return (
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
              <TextInput style={styles.input} placeholder="Emre" placeholderTextColor="#A0A0A0" value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Soyad</Text>
              <TextInput style={styles.input} placeholder="Arslan" placeholderTextColor="#A0A0A0" value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <Text style={styles.label}>E-posta</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Şifre</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Telefon Numarası</Text>
          <TextInput
            style={styles.input}
            placeholder="0555 123 45 67"
            placeholderTextColor="#A0A0A0"
            keyboardType="phone-pad"
            maxLength={14}
            value={phone}
            onChangeText={formatPhoneNumber}
          />

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
              <TextInput style={styles.input} placeholder="İstanbul" placeholderTextColor="#A0A0A0" value={city} onChangeText={setCity} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>İlçe</Text>
              <TextInput style={styles.input} placeholder="Şişli" placeholderTextColor="#A0A0A0" value={district} onChangeText={setDistrict} />
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E63946',
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
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  label: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: '#333',
  },
  eyeButton: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
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
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  bloodTypeButtonSelected: {
    backgroundColor: '#E63946',
    borderColor: '#E63946',
  },
  bloodTypeText: {
    color: '#333',
    fontWeight: '600',
  },
  bloodTypeTextSelected: {
    color: '#FFF',
  },
  signupButton: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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