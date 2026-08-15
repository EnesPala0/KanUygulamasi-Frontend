import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../api/auth';
import { getErrorMessage } from '../utils/errors';

const PRIMARY_COLOR = '#E53E3E';

export default function ResetPasswordScreen({ route, navigation }: any) {
  // route.params'dan email bilgisini alıyoruz, yoksa fallback kullanıyoruz
  const email = route?.params?.email || 'email@adresiniz.com';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Şifre kuralları
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  const handleSaveNewPassword = async () => {
    if (!code.trim()) {
      Alert.alert('Hata', 'Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }
    if (code.length !== 6) {
      Alert.alert('Hata', 'Doğrulama kodu 6 haneli olmalıdır.');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Hata', 'Lütfen yeni şifrenizi girin.');
      return;
    }

    // Şifre kuralları kontrolü
    if (!hasMinLength || !hasUppercase || !hasNumber) {
      Alert.alert(
        'Geçersiz Şifre',
        'Şifreniz belirlenen güvenlik kurallarını (en az 8 karakter, 1 büyük harf ve 1 rakam) sağlamalıdır.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email, code, newPassword);

      Alert.alert(
        'Başarılı',
        'Şifreniz başarıyla değiştirildi.',
        [
          {
            text: 'Giriş Yap',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      console.log('Reset password error:', error);
      const errMsg = getErrorMessage(error, 'Şifre sıfırlanamadı. Lütfen kodunuzu kontrol edip tekrar deneyin.');
      Alert.alert('Hata', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Yeni Şifre Belirle</Text>
            <Text style={styles.subtitle}>
              Lütfen <Text style={styles.emailText}>{email}</Text> adresine gönderilen 6 haneli kodu girin.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Doğrulama Kodu</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="keypad-outline" size={20} color="#666" style={styles.icon} />
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="000000"
                placeholderTextColor="#999"
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <Text style={styles.inputLabel}>Yeni Şifre</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Dinamik Şifre Kuralları Listesi */}
            <View style={styles.rulesContainer}>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={16} color={hasMinLength ? '#10B981' : '#D1D5DB'} />
                <Text style={[styles.ruleText, hasMinLength && styles.ruleTextValid]}>En az 8 karakter</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={16} color={hasUppercase ? '#10B981' : '#D1D5DB'} />
                <Text style={[styles.ruleText, hasUppercase && styles.ruleTextValid]}>En az 1 büyük harf</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={16} color={hasNumber ? '#10B981' : '#D1D5DB'} />
                <Text style={[styles.ruleText, hasNumber && styles.ruleTextValid]}>En az 1 rakam</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSaveNewPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Yeni Şifreyi Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  backButton: {
    padding: 16,
    alignSelf: 'flex-start',
  },
  headerContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333333',
  },
  codeInput: {
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rulesContainer: {
    marginTop: -15,
    marginBottom: 20,
    marginLeft: 4,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ruleText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  ruleTextValid: {
    color: '#10B981',
  },
});
