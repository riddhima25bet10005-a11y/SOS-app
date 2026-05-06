import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { setAuth } from '../utils/auth';
import { useTheme, Shadows } from '../utils/theme';
import { useLanguage } from '../utils/languageContext';
import { auth } from '../utils/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import emailjs from '@emailjs/browser';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [isLoading, setIsLoading] = useState(false);
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);
  
  // OTP State removed for direct login bypass
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Set up visible recaptcha on mount
  useEffect(() => {
    // Empty
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    
    if (loginMethod === 'phone') {
      if (phoneNumber.length < 10) {
        Alert.alert('Invalid Number', 'Please enter a valid phone number (at least 10 digits).');
        setIsLoading(false);
        return;
      }
      
      // Direct Login Bypass
      setTimeout(() => {
        setIsLoading(false);
        const { updateProfile } = require('../utils/userStore');
        updateProfile({ isLoggedIn: true, phone: `${countryCode} ${phoneNumber}` });
        router.replace('/(tabs)/emergency');
      }, 800);
      
    } else {
      // Email Method
      if (!emailAddress.includes('@') || !emailAddress.includes('.')) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        setIsLoading(false);
        return;
      }
      
      // Direct Login Bypass
      setTimeout(() => {
        setIsLoading(false);
        const { updateProfile } = require('../utils/userStore');
        // Save email as a contact or just log them in
        updateProfile({ isLoggedIn: true }); 
        router.replace('/(tabs)/emergency');
      }, 800);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={theme === 'dark' ? ['#1a0000', '#000'] : ['#ffcccc', colors.background]} 
        style={styles.gradient} 
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>SOS!</Text>
              <Text style={styles.headerTitle}>Welcome</Text>
              <Text style={styles.headerSubtitle}>
                Sign in to access emergency services worldwide
              </Text>
            </View>

            {/* Method Toggle */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' }}>
              <TouchableOpacity 
                style={[styles.toggleBtn, loginMethod === 'phone' && styles.toggleBtnActive]} 
                onPress={() => setLoginMethod('phone')}
              >
                <Ionicons name="call" size={16} color={loginMethod === 'phone' ? '#fff' : colors.textSecondary} />
                <Text style={[styles.toggleBtnText, loginMethod === 'phone' && { color: '#fff' }]}>Phone</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, loginMethod === 'email' && styles.toggleBtnActive]} 
                onPress={() => setLoginMethod('email')}
              >
                <Ionicons name="mail" size={16} color={loginMethod === 'email' ? '#fff' : colors.textSecondary} />
                <Text style={[styles.toggleBtnText, loginMethod === 'email' && { color: '#fff' }]}>Email</Text>
              </TouchableOpacity>
            </View>

            {/* Input Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>{loginMethod === 'phone' ? t('Phone Number') : t('Email Address')}</Text>
              
              {loginMethod === 'phone' ? (
                <View style={styles.phoneRow}>
                  <TouchableOpacity style={styles.countryCodeBtn}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={t('Enter your number')}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              ) : (
                <TextInput
                  style={[styles.phoneInput, { marginBottom: 16 }]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                />
              )}

              <TouchableOpacity activeOpacity={0.8} onPress={handleLogin} disabled={isLoading}>
                <LinearGradient
                  colors={isLoading ? ['#8B0000', '#550000'] : [colors.primary, '#B30000']}
                  style={styles.continueBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.continueBtnText}>{t('Login')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            {/* Terms */}
            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Emergency Access Button */}
            <TouchableOpacity 
              style={styles.emergencyAccessBtn}
              onPress={() => setShowMedicalInfo(true)}
            >
              <Ionicons name="medical" size={20} color="#E50000" />
              <Text style={styles.emergencyAccessText}>Emergency Medical ID</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Medical ID Overlay */}
      {showMedicalInfo && (
        <View style={styles.overlay}>
          <LinearGradient colors={theme === 'dark' ? ['#1a0000', '#000'] : [colors.background, colors.background]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.overlayContent}>
            <View style={styles.overlayHeader}>
              <View style={styles.medicalIconWrap}>
                <Ionicons name="medical" size={30} color="#fff" />
              </View>
              <Text style={styles.overlayTitle}>{t('Medical ID')}</Text>
              <TouchableOpacity onPress={() => setShowMedicalInfo(false)}>
                <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.medicalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.medicalCard}>
                <Text style={styles.medicalLabel}>{t('Full Name')}</Text>
                <Text style={styles.medicalValue}>{require('../utils/userStore').userProfileData.name}</Text>
                
                <View style={styles.medicalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicalLabel}>{t('Blood Group')}</Text>
                    <Text style={styles.medicalValue}>{require('../utils/userStore').userProfileData.bloodGroup}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicalLabel}>{t('Age')}</Text>
                    <Text style={styles.medicalValue}>24</Text>
                  </View>
                </View>

                <Text style={styles.medicalLabel}>{t('Medical Conditions')}</Text>
                <Text style={styles.medicalValue}>{require('../utils/userStore').userProfileData.medicalConditions || t('Not provided')}</Text>

                <View style={[styles.dividerLine, { backgroundColor: colors.border, marginVertical: 15 }]} />

                <Text style={styles.medicalLabel}>{t('Emergency Contacts')}</Text>
                <Text style={styles.medicalValue}>{require('../utils/userStore').userProfileData.emergencyContact1 || t('Not provided')}</Text>
                <Text style={styles.medicalValue}>{require('../utils/userStore').userProfileData.emergencyContact2}</Text>
              </View>
              
              <Text style={styles.disclaimer}>
                {t('This information is provided for emergency use by medical professionals and first responders.')}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  content: { alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 4,
    textShadowColor: colors.primaryLight,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.medium,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleBtnText: { color: colors.textSecondary, fontWeight: '700' },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryCodeText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...Shadows.medium,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    ...Shadows.soft,
  },
  socialBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  emergencyAccessBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40,
    backgroundColor: colors.primaryLight, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30, borderWidth: 1, borderColor: colors.primary + '30',
  },
  emergencyAccessText: { color: colors.primary, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, paddingTop: 60 },
  overlayContent: { flex: 1, padding: 24 },
  overlayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  medicalIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  overlayTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  medicalScroll: { flex: 1 },
  medicalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, ...Shadows.medium },
  medicalLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 },
  medicalValue: { fontSize: 18, color: colors.text, fontWeight: '600', marginBottom: 20 },
  medicalRow: { flexDirection: 'row', gap: 20 },
  disclaimer: { color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 24, fontStyle: 'italic', opacity: 0.6 },
});
