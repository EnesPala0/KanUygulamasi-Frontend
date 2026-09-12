import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LegalScreen({ route, navigation }: any) {
  const { type } = route.params || { type: 'privacy' };
  
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Gizlilik Politikası' : 'Kullanım Koşulları';
  
  // TODO: (Hukuki) Bu metinler yer tutucudur. Avukat veya hukuki danışman tarafından KVKK ve Apple/Google politikalarına uygun olarak doldurulmalıdır.
  const content = isPrivacy 
    ? `Gizlilik Politikası\n\nSon Güncelleme: [Tarih]\n\n1. Veri Toplama\nKanBağı uygulaması, kan bağışı eşleştirmesi yapabilmek için konum verilerinizi (arka plan dahil), kan grubunuzu ve iletişim bilgilerinizi toplar.\n\n2. Veri Kullanımı\nToplanan veriler sadece acil kan ihtiyaçlarını eşleştirmek amacıyla kullanılır. Üçüncü şahıslarla reklam amacıyla paylaşılmaz.\n\n3. Veri Güvenliği\nVerileriniz güvenli sunucularda şifrelenerek saklanmaktadır.\n\n4. Kullanıcı Hakları\nİstediğiniz zaman profilinizden hesabınızı ve tüm verilerinizi silebilirsiniz.`
    : `Kullanım Koşulları\n\nSon Güncelleme: [Tarih]\n\n1. Hizmetin Amacı\nKanBağı, gönüllü kan bağışçıları ile kana ihtiyacı olan kişileri bir araya getiren bir platformdur.\n\n2. Kullanıcı Sorumlulukları\nKullanıcılar uygulamaya doğru bilgiler girmekle yükümlüdür. Yanlış kan grubu veya asılsız acil ilan açılması hesabın kapatılmasına yol açar.\n\n3. Sorumluluk Reddi\nKanBağı uygulaması tıbbi bir kurum değildir. Bağış süreci ve tıbbi uygunluk tamamen ilgili hastanenin veya Kızılay'ın sorumluluğundadır.\n\n4. İletişim\nUygulama üzerinden yapılan iletişimlerde saygı kurallarına uyulması zorunludur.`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.content}>{content}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  content: {
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 24,
  },
});
