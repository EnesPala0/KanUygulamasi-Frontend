import React, { useState } from 'react';
import { loginUser, forgotPassword } from '../api/auth';
import { getErrorMessage } from '../utils/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  ActivityIndicator
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
         await AsyncStorage.setItem('userToken', data.token);
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
      setForgotEmail('');
      Alert.alert('Talimat Gönderildi', res.message || 'Şifre sıfırlama talimatları e-posta adresinize iletildi.');
    } catch (error: any) {
      console.log('Forgot password error:', error);
      const msg = getErrorMessage(error, 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.');
      Alert.alert('Hata', msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Üst Kırmızı Alan (Header) */}
        <View style={styles.headerContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="water" size={40} color="#E63946" />
          </View>
          <Text style={styles.appName}>BloodBridge</Text>
          <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
          <Text style={styles.subText}>Her bağış bir hayat kurtarır.</Text>
        </View>

        {/* Form Alanı */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>E-posta</Text>
          <TextInput 
            style={styles.input}
            placeholder="ornek@email.com"
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
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="#888" />
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
        </View>
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
    flex: 0.4,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#E63946',
  },
  logoCircle: {
    width: 50,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
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
    flex: 0.6,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  label: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
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
  loginButton: {
    backgroundColor: '#E63946',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
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