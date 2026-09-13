import React, { useState } from 'react';
import { loginUser, forgotPassword } from '../api/auth';
import { getErrorMessage } from '../utils/errors';
import { isValidEmail } from '../utils/validators';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  Image,
  ActivityIndicator
} from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Şifremi unuttum modal states
  const [isForgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await loginUser(email, password);
      console.log("Sunucudan Gelen Veri:", data);
      
      if (data.token) {
         await SecureStore.setItemAsync('userToken', data.token);
      }
      
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] }); 

    } catch (error: any) {
      console.log("Giriş Başarısız:", error?.response?.data || error?.message);
      const errMsg = getErrorMessage(error, 'E-posta adresiniz veya şifreniz hatalı. Lütfen kontrol edip tekrar deneyiniz.');
      Alert.alert('Giriş Başarısız', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail || !isValidEmail(forgotEmail)) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await forgotPassword(forgotEmail.trim());
      setForgotModalVisible(false);
      Alert.alert(
        'Talimat Gönderildi', 
        res.message || 'Şifre sıfırlama kodu e-posta adresinize iletildi.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              navigation.navigate('ResetPasswordScreen', { email: forgotEmail.trim() });
              setForgotEmail('');
            }
          }
        ]
      );
    } catch (error: any) {
      console.log('Forgot password error:', error);
      const msg = getErrorMessage(error, 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.');
      Alert.alert('Hata', msg);
    } finally {
      setForgotLoading(false);
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
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Üst Kırmızı Alan (Header) */}
            <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Image source={require('../../assets/icon.png')} style={{width: 48, height: 48, borderRadius: 24}} />
            </View>
            <Text style={styles.appName}>KanBağı</Text>
            <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
            <Text style={styles.subText}>Her bağış bir hayat kurtarır.</Text>
          </View>

          {/* Form Alanı */}
          <View style={styles.formContainer}>
            <CustomInput
              label="E-posta"
              icon="mail-outline"
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <CustomInput
              label="Şifre"
              icon="lock-closed-outline"
              placeholder="••••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

          {/* Şifremi Unuttum Linki */}
          <TouchableOpacity 
            style={styles.forgotContainer} 
            onPress={() => {
              setForgotEmail(email);
              setForgotModalVisible(true);
            }}
          >
            <Text style={styles.forgotText}>Şifremi Unuttum?</Text>
          </TouchableOpacity>

          {/* Login Butonu */}
          <CustomButton 
            text="Giriş Yap"
            onPress={handleLogin}
            isLoading={isSubmitting}
            containerStyle={{ marginTop: 10 }}
          />

          {/* Signup'a Git */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 20 }} />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Şifremi Unuttum Modalı */}
      <Modal
        visible={isForgotModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="key-outline" size={22} color="#1A1A2E" style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Şifremi Unuttum</Text>
            </View>
            <Text style={styles.modalSubText}>
              Hesabınıza bağlı e-posta adresini girin. Size şifre sıfırlama talimatlarını gönderelim.
            </Text>
            
            <CustomInput
              icon="mail-outline"
              placeholder="E-posta adresiniz"
              keyboardType="email-address"
              autoCapitalize="none"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              containerStyle={{ marginBottom: 15 }}
            />

            <View style={styles.modalButtons}>
              <CustomButton 
                text="Vazgeç"
                variant="secondary"
                onPress={() => setForgotModalVisible(false)}
                disabled={forgotLoading}
                containerStyle={{ flex: 1, marginRight: 10, height: 45 }}
                textStyle={{ fontSize: 16 }}
              />
              <CustomButton 
                text="Sıfırla"
                onPress={handleForgotPassword}
                isLoading={forgotLoading}
                containerStyle={{ flex: 1, height: 45 }}
                textStyle={{ fontSize: 16 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 30,
    paddingBottom: 60,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#E63946',
  },
  logoCircle: {
    width: 54,
    height: 54,
    backgroundColor: '#FFF',
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  appName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  welcomeText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    marginTop: -30,
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
  signupText: {
    color: '#E63946',
    fontSize: 14,
    fontWeight: 'bold',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginTop: -5,
  },
  forgotText: {
    color: '#457B9D',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  modalSubText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});