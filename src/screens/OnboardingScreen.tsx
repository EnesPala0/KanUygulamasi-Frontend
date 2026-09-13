import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  NativeSyntheticEvent, 
  NativeScrollEvent 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Kan Bağışı Hayat Kurtarır',
    description: 'Küçük bir fedakarlıkla büyük umutlar yaratabilirsiniz. Bir ünite kan, üç farklı hayatı kurtarabilir.',
    icon: 'logo',
  },
  {
    id: '2',
    title: 'Yakınındaki İhtiyaçları Bul',
    description: 'Bölgendeki acil kan ihtiyaçlarını anında gör, hızlıca harekete geçip gerçek bir kahraman ol.',
    icon: 'location-outline',
  },
  {
    id: '3',
    title: 'Güvenli ve Gizli',
    description: 'Kişisel verilerin tamamen güvende. Sadece gönüllü olduğun anlarda karşı tarafla güvenli iletişim kurarsın.',
    icon: 'shield-checkmark-outline',
  }
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const completeOnboarding = async () => {
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const nextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      completeOnboarding();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header for Skip Button */}
      <View style={styles.header}>
        {currentIndex < SLIDES.length - 1 ? (
          <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
            <Text style={styles.skipText}>Atla</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.imageContainer}>
              {slide.icon === 'logo' ? (
                <View style={styles.logoCircle}>
                  <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
                </View>
              ) : (
                <View style={styles.iconCircle}>
                  <Ionicons name={slide.icon as any} size={80} color="#E63946" />
                </View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer (Dots + CTA) */}
      <View style={styles.footer}>
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={nextSlide}
          activeOpacity={0.8}
        >
          <Text style={styles.mainButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Hemen Başla' : 'İleri'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Same background as LoginScreen
  },
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  skipPlaceholder: {
    height: 40,
  },
  slide: {
    width: width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingBottom: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FDE8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  textContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#E63946',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
  mainButton: {
    backgroundColor: '#EF4444',
    height: 55,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
