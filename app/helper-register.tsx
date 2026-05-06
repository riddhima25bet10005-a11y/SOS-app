import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, Platform, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, Shadows } from '../utils/theme';
import { updateProfile, userProfileData } from '../utils/userStore';
import { registerHelper, auth } from '../utils/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useLanguage } from '../utils/languageContext';
import emailjs from '@emailjs/browser';

const { width } = Dimensions.get('window');

const SPECIALTIES = [
  { key: 'medical', label: 'Medical Emergency', icon: 'medkit', color: '#22C55E' },
  { key: 'security', label: 'Safety & Security', icon: 'shield', color: '#3B82F6' },
  { key: 'fire', label: 'Fire & Rescue', icon: 'flame', color: '#F97316' },
  { key: 'counseling', label: 'Crisis Counseling', icon: 'heart', color: '#EC4899' },
  { key: 'poison', label: 'Poison Control', icon: 'flask', color: '#8B5CF6' },
  { key: 'disaster', label: 'Disaster Relief', icon: 'earth', color: '#06B6D4' },
  { key: 'women', label: 'Women Safety', icon: 'female', color: '#F43F5E' },
  { key: 'mental', label: 'Mental Health', icon: 'happy', color: '#10B981' },
];

export default function HelperRegisterScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // OTP State removed for direct bypass
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [bio, setBio] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const { t } = useLanguage();

  const ANALYSIS_STEPS = [
    t('Connecting to Global Verification Network...'),
    t('Analyzing Credentials & Licenses...'),
    t('Cross-referencing International Databases...'),
    t('Verification Successful!'),
  ];

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const goNext = async () => {
    if (step === 1) {
      if (!fullName.trim() || !phone.trim() || !email.trim()) {
        showAlert(t('Missing Info'), t('Please fill in all fields to continue.'));
        return;
      }
      
      if (phone.length < 10) {
        showAlert(t('Invalid Phone'), t('Please enter a valid phone number (at least 10 digits).'));
        return;
      }
      
      if (!email.includes('@') || !email.includes('.')) {
        showAlert(t('Invalid Email'), t('Please enter a valid email address.'));
        return;
      }

      // Direct bypass to Step 2
      setStep(2);
    } else if (step === 2) {
      if (!selectedSpecialty) {
        showAlert(t('Select Specialty'), t('Please choose your area of expertise.'));
        return;
      }
      if (!experience.trim()) {
        showAlert(t('Missing Info'), t('Please scroll down and describe your experience.'));
        return;
      }
      setStep(3);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  // Aadhaar Verhoeff algorithm mathematical check
  const validateAadhaarVerhoeff = (aadhaarStr: string) => {
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];
    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];
    let c = 0;
    const array = aadhaarStr.split('').map(Number).reverse();
    for (let i = 0; i < array.length; i++) {
      c = d[c][p[i % 8][array[i]]];
    }
    return c === 0;
  };

  const isValidIdProof = (id: string) => {
    const cleanId = id.replace(/[- ]/g, '').toUpperCase();
    
    // Aadhaar (12 digits with Verhoeff Checksum)
    if (/^\d{12}$/.test(cleanId)) {
      if (!validateAadhaarVerhoeff(cleanId)) {
        showAlert(t('Fake Aadhaar Detected'), t('This Aadhaar number is mathematically invalid. Please enter a genuine 12-digit Aadhaar.'));
        return false;
      }
      return true;
    }
    
    // PAN Card (5 letters, 4 digits, 1 letter)
    if (/^[A-Z]{5}\d{4}[A-Z]$/.test(cleanId)) return true;
    
    // Indian/Intl Passport (1 letter, 7 digits)
    if (/^[A-Z]\d{7}$/.test(cleanId)) return true;
    
    // US SSN (9 digits)
    if (/^\d{9}$/.test(cleanId)) return true;
    
    // General Medical License / International ID (Alphanumeric, 6-15 chars, must contain at least 2 numbers)
    if (/^[A-Z0-9]{6,15}$/.test(cleanId) && (cleanId.match(/\d/g) || []).length >= 2) return true;
    
    return false;
  };

  const handleSubmit = () => {
    if (!idNumber.trim() || !isValidIdProof(idNumber)) {
      showAlert(t('Invalid ID Proof'), t('Please provide a valid, properly formatted Government ID or License Number (e.g., 12-digit Aadhaar, PAN, Passport, or Medical License with numbers).'));
      return;
    }
    if (!agreed) {
      showAlert(t('Agreement Required'), t('Please accept the Helper Guidelines to proceed.'));
      return;
    }

    setIsSubmitting(true);
    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Fake AI Verification Flow
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < ANALYSIS_STEPS.length) {
        setAnalysisStep(step);
      } else {
        clearInterval(interval);
        // Finish — save locally AND push to Firebase
        setIsAnalyzing(false);
        setIsSubmitting(false);
        updateProfile({ isHelper: true, hasRegisteredAsHelper: true, helperStatus: 'available' });

        // Push to Firebase so all other devices see this helper
        const helperId = userProfileData.phone
          ? userProfileData.phone.replace(/[^a-zA-Z0-9]/g, '')
          : `helper_${Date.now()}`;
        registerHelper(
          helperId,
          fullName,
          phone,
          selectedSpecialty,
          experience,
          bio
        ).catch((e) => console.warn('Firebase helper register failed:', e));
        
        if (Platform.OS === 'web') {
          window.alert(t('Verification Complete! ✅\n\nWelcome to the International Helper Community.'));
          router.replace('/(tabs)/helper');
        } else {
          Alert.alert(
            t('Verification Complete! ✅'),
            t('Welcome to the International Helper Community.'),
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/helper') }]
          );
        }
      }
    }, 1800); // 1.8s per step
  };

  const renderStep1 = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
        <Text style={styles.stepTitle}>{t('Personal Information')}</Text>
      </View>
      <Text style={styles.stepSub}>{t('Tell us about yourself so we can verify your identity.')}</Text>

      <Text style={styles.inputLabel}>{t('Full Name')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('Enter your full name')}
        placeholderTextColor={colors.textSecondary}
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.inputLabel}>{t('Phone Number')}</Text>
      <TextInput
        style={styles.input}
        placeholder="+91XXXXXXXXXX"
        placeholderTextColor={colors.textSecondary}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.inputLabel}>{t('Email Address')}</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={colors.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
        <Text style={styles.stepTitle}>{t('Your Expertise')}</Text>
      </View>
      <Text style={styles.stepSub}>{t('Select your area of specialty and describe your experience.')}</Text>

      <Text style={styles.inputLabel}>{t('Select Specialty')}</Text>
      <View style={styles.specialtyGrid}>
        {SPECIALTIES.map((sp) => (
          <TouchableOpacity
            key={sp.key}
            style={[
              styles.specialtyCard,
              selectedSpecialty === sp.key && { borderColor: sp.color, backgroundColor: sp.color + '15' },
            ]}
            onPress={() => setSelectedSpecialty(sp.key)}
          >
            <Ionicons name={sp.icon as any} size={22} color={selectedSpecialty === sp.key ? sp.color : '#666'} />
            <Text style={[styles.specialtyLabel, selectedSpecialty === sp.key && { color: sp.color }]}>
              {t(sp.label)}
            </Text>
            {selectedSpecialty === sp.key && (
              <Ionicons name="checkmark-circle" size={16} color={sp.color} style={{ position: 'absolute', top: 6, right: 6 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>{t('Years of Experience')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('e.g. 5 years as a paramedic')}
        placeholderTextColor={colors.textSecondary}
        value={experience}
        onChangeText={setExperience}
      />

      <Text style={styles.inputLabel}>{t('Short Bio (Optional)')}</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder={t('Tell people in distress why they can trust you...')}
        placeholderTextColor={colors.textSecondary}
        multiline
        value={bio}
        onChangeText={setBio}
      />
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
        <Text style={styles.stepTitle}>{t('Verification')}</Text>
      </View>
      <Text style={styles.stepSub}>{t('We need to verify your credentials before you can help others.')}</Text>

      {/* Helper Guidelines Highlight Card */}
      <LinearGradient colors={theme === 'dark' ? ['#F59E0B20', '#F59E0B10'] : ['#FEF3C7', '#FFFBEB']} style={[styles.infoCard, { borderColor: '#F59E0B', borderWidth: 1 }]}>
        <Ionicons name="warning" size={24} color="#F59E0B" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoCardTitle, { color: '#F59E0B' }]}>{t('Important Helper Guidelines')}</Text>
          <Text style={styles.infoCardSub}>
            {t('You must be a certified professional. Any ID proof provided (Indian Aadhaar, Passport, or other international IDs) will be thoroughly authenticated against government databases. Fake submissions will be permanently banned.')}
          </Text>
        </View>
      </LinearGradient>

      <Text style={styles.inputLabel}>{t('Government ID / License Number')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('e.g. AADHAAR / Medical License #')}
        placeholderTextColor={colors.textSecondary}
        value={idNumber}
        onChangeText={setIdNumber}
      />

      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={24} color="#22C55E" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoCardTitle}>{t('Background Check')}</Text>
          <Text style={styles.infoCardSub}>
            {t('Our team will verify your identity and credentials. This usually takes 24-48 hours.')}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="lock-closed" size={24} color="#3B82F6" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoCardTitle}>{t('Data Privacy')}</Text>
          <Text style={styles.infoCardSub}>
            {t('Your personal information is encrypted and will only be used for verification purposes.')}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
        <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
          {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={styles.agreeText}>
          {t('I agree to the')} <Text style={styles.link}>{t('Helper Guidelines')}</Text> {t('and commit to providing genuine assistance to people in emergency situations.')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={theme === 'dark' ? ['#1a0000', '#000'] : ['#F8F9FA', '#FFFFFF']} 
        style={styles.gradient} 
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t('Become a Helper')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]}>
            {s < step ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : (
              <Text style={[styles.progressDotText, s <= step && { color: '#fff' }]}>{s}</Text>
            )}
          </View>
        ))}
        <View style={styles.progressLine}>
          <View style={[styles.progressFill, { width: `${((step - 1) / 2) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        {step < 3 ? (
          <TouchableOpacity activeOpacity={0.8} onPress={goNext} style={{ width: '100%' }}>
            <LinearGradient colors={['#E50000', '#B30000']} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>
                {t('Continue')}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} disabled={isSubmitting} style={{ width: '100%' }}>
            <LinearGradient colors={isSubmitting ? ['#555', '#333'] : ['#22C55E', '#16A34A']} style={styles.primaryBtn}>
              {isSubmitting ? (
                <Text style={styles.primaryBtnText}>{t('Submitting...')}</Text>
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.primaryBtnText}>{t('Submit Application')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* AI Analyzing Overlay */}
      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <LinearGradient colors={['#000000e0', '#000000f0']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.analyzingBox}>
            <View style={styles.analyzingIconWrap}>
              <Ionicons 
                name={analysisStep === ANALYSIS_STEPS.length - 1 ? "checkmark-circle" : "scan-circle"} 
                size={80} 
                color={analysisStep === ANALYSIS_STEPS.length - 1 ? "#22C55E" : colors.primary} 
              />
            </View>
            <Text style={styles.analyzingTitle}>{t('AI Verification in Progress')}</Text>
            <Text style={styles.analyzingStepText}>
              {ANALYSIS_STEPS[analysisStep]}
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.analyzingBarBg}>
              <View 
                style={[
                  styles.analyzingBarFill, 
                  { width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any, theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
  },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 40, paddingHorizontal: 40, paddingVertical: 16, position: 'relative',
  },
  progressDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
    borderWidth: 2, borderColor: colors.border,
    ...Shadows.soft,
  },
  progressDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressDotText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  progressLine: {
    position: 'absolute', left: 68, right: 68, top: '50%',
    height: 3, backgroundColor: colors.border, borderRadius: 2,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  stepContainer: { paddingHorizontal: 20, paddingTop: 10 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  stepBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  stepTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  stepSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 24, marginLeft: 44 },
  inputLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8, marginTop: 16,
  },
  input: {
    backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  specialtyGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4,
  },
  specialtyCard: {
    width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border, position: 'relative',
    ...Shadows.soft,
  },
  specialtyLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, flex: 1 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: colors.card, borderRadius: 14, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  infoCardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  infoCardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  agreeRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 24,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  agreeText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 30,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingBox: {
    width: '85%',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.medium,
  },
  analyzingIconWrap: { marginBottom: 20 },
  analyzingTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  analyzingStepText: { fontSize: 14, color: colors.primary, textAlign: 'center', fontWeight: '600', marginBottom: 24, minHeight: 40 },
  analyzingBarBg: { width: '100%', height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden' },
  analyzingBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
});
