import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { userProfileData, updateProfile } from '../utils/userStore';
import { useTheme, Shadows } from '../utils/theme';
import { useLanguage } from '../utils/languageContext';

const InputField = ({ label, value, isEditing, placeholder, onChangeText, styles, isPhone, t, colors }: any) => {
  const handleCall = () => {
    if (value) {
      const phoneRegex = /\+?\d+/g;
      const numbers = value.match(phoneRegex);
      if (numbers && numbers.length > 0) {
        Linking.openURL(`tel:${numbers.join('')}`);
      } else {
        Linking.openURL(`tel:${value}`);
      }
    }
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.value, { flex: 1 }]}>{value || t('Not provided')}</Text>
          {isPhone && value && (
            <TouchableOpacity onPress={handleCall} style={styles.callBtnSmall}>
              <Ionicons name="call" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default function UserInfoScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors, theme);
  const [isEditing, setIsEditing] = useState(false);
  
  const [userData, setUserData] = useState(userProfileData);

  const handleSave = () => {
    if (isEditing) {
      updateProfile(userData);
    }
    setIsEditing(!isEditing);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme === 'dark' ? ['#1a0000', '#000'] : ['#F8F9FA', '#FFFFFF']} style={styles.gradient} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Personal Information')}</Text>
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={handleSave}
        >
          <Text style={styles.editBtnText}>{isEditing ? t('Save') : t('Edit')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Profile Header Card */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{userData.name.charAt(0)}</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.nameInput]}
                value={userData.name}
                onChangeText={(text) => setUserData({ ...userData, name: text })}
                placeholder={t('Full Name')}
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.nameText}>{t(userData.name)}</Text>
            )}
            <Text style={styles.phoneText}>{userData.phone}</Text>
          </View>

          {/* Details Section */}
          <Text style={styles.sectionTitle}>{t('Basic Info')}</Text>
          <View style={styles.card}>
            <InputField 
              label={t('Full Name')} 
              value={userData.name} 
              isEditing={isEditing} 
              placeholder={t('Full Name')}
              onChangeText={(text: string) => setUserData({ ...userData, name: text })} 
              styles={styles}
              t={t}
              colors={colors}
            />
            <View style={styles.divider} />
            <InputField 
              label={t('Phone Number')} 
              value={userData.phone} 
              isEditing={isEditing} 
              onChangeText={(text: string) => setUserData({ ...userData, phone: text })} 
              placeholder={t('Enter phone number')}
              styles={styles}
              isPhone
              t={t}
              colors={colors}
            />
          </View>

          {/* Medical ID Section */}
          <Text style={styles.sectionTitle}>{t('Medical ID')}</Text>
          <View style={styles.card}>
            <InputField 
              label={t('Blood Group')} 
              value={userData.bloodGroup} 
              isEditing={isEditing} 
              placeholder={t('e.g. A+')}
              onChangeText={(text: string) => setUserData({ ...userData, bloodGroup: text })} 
              styles={styles}
              t={t}
              colors={colors}
            />
            <View style={styles.divider} />
            <InputField 
              label={t('Medical Conditions')} 
              value={userData.medicalConditions} 
              isEditing={isEditing} 
              placeholder={t('e.g. Diabetes, Asthma')}
              onChangeText={(text: string) => setUserData({ ...userData, medicalConditions: text })} 
              styles={styles}
              t={t}
              colors={colors}
            />
          </View>

          {/* Emergency Contact Section */}
          <Text style={styles.sectionTitle}>{t('Emergency Contact')}</Text>
          <View style={styles.card}>
            <InputField 
              label={t('Contact 1')} 
              value={userData.emergencyContact1} 
              isEditing={isEditing} 
              onChangeText={(text: string) => setUserData({ ...userData, emergencyContact1: text })} 
              placeholder={t('e.g. Mom: +91 99999 88888')}
              styles={styles}
              isPhone
              t={t}
              colors={colors}
            />
            <View style={styles.divider} />
            <InputField 
              label={t('Contact 2')} 
              value={userData.emergencyContact2} 
              isEditing={isEditing} 
              onChangeText={(text: string) => setUserData({ ...userData, emergencyContact2: text })} 
              placeholder={t('e.g. Dad: +91 77777 66666')}
              styles={styles}
              isPhone
              t={t}
              colors={colors}
            />
          </View>

          {/* Address Section */}
          <Text style={styles.sectionTitle}>{t('Home Address')}</Text>
          <View style={styles.card}>
            <InputField 
              label={t('Full Address')} 
              value={userData.address} 
              isEditing={isEditing} 
              onChangeText={(text: string) => setUserData({ ...userData, address: text })} 
              placeholder={t('Enter your full address')} 
              styles={styles} 
              t={t}
              colors={colors}
            />
          </View>

          {isEditing && (
            <Text style={styles.helperText}>
              {t('This information is saved locally and can be quickly shared with emergency responders if needed.')}
            </Text>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: any, theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  editBtn: { padding: 8, marginRight: -8 },
  editBtnText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 16,
    ...Shadows.medium,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: colors.primary },
  nameText: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  nameInput: { fontSize: 20, textAlign: 'center', width: '80%', marginBottom: 8, color: colors.text },
  phoneText: { fontSize: 16, color: colors.textSecondary },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 24,
    ...Shadows.soft,
  },
  inputContainer: {
    padding: 16,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  callBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
