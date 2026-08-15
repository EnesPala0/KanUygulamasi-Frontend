import React, { useState } from 'react';
import { loginUser, forgotPassword } from '../api/auth';
import { getErrorMessage } from '../utils/errors';
import * as SecureStore from 'expo-secure-store';
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
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Şifremi unuttum modal states
  const [isForgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }

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
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
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
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput 
                style={styles.inputText}
                placeholder="ornek@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
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
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

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
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>

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
            
            <TextInput
              style={styles.modalInput}
              placeholder="E-posta adresiniz"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={forgotEmail}
              onChangeText={setForgotEmail}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setForgotModalVisible(false)}
                disabled={forgotLoading}
              >
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalSubmitButton}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Sıfırla</Text>
                )}
              </TouchableOpacity>
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
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: '100%',
  },
  eyeButton: {
    paddingLeft: 10,
    height: '100%',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
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
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSubmitButton: {
    flex: 1.2,
    backgroundColor: '#E63946',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});