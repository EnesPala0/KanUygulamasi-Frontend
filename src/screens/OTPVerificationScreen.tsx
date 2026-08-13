import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verifyUserOTP } from '../api/auth';
import { getErrorMessage } from '../utils/errors';

export default function OTPVerificationScreen({ route, navigation }: any) {
  const { email } = route.params || {};
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for each input to manage focus
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (text: string, index: number) => {
    // Handle single character
    const newCode = [...code];
    newCode[index] = text.slice(-1); // Only take the last char if multiple pasted
    setCode(newCode);

    // Auto advance
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto submit if all filled and last char entered
    if (text && index === 5 && newCode.every(char => char !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const finalCode = fullCode || code.join('');
    if (finalCode.length < 6) {
      Alert.alert('Eksik Kod', 'Lütfen 6 haneli doğrulama kodunu eksiksiz girin.');
      return;
    }

    if (!email) {
      Alert.alert('Hata', 'E-posta adresi bulunamadı.');
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyUserOTP(email, finalCode);
      
      Alert.alert(
        'Hesap Doğrulandı', 
        'E-posta adresiniz başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      console.log('OTP Verification Error:', error);
      const msg = getErrorMessage(error, 'Doğrulama başarısız. Lütfen kodun doğru olduğundan emin olun.');
      Alert.alert('Doğrulama Hatası', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-unread-outline" size={48} color="#EF4444" />
          </View>
          
          <Text style={styles.title}>E-postanı Doğrula</Text>
          <Text style={styles.subtitle}>
            <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>{email}</Text> adresine gönderdiğimiz 6 haneli kodu aşağıya gir.
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  focusedIndex === index && styles.codeInputFocused,
                  digit ? styles.codeInputFilled : null
                ]}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.verifyButton, isSubmitting && { opacity: 0.7 }]} 
            onPress={() => handleVerify()}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.verifyButtonText}>Doğrula</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  codeInputFocused: {
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  codeInputFilled: {
    borderColor: '#D1D5DB',
  },
  verifyButton: {
    width: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
