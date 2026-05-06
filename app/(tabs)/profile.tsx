import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Platform, Modal, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { setAuth } from '../../utils/auth';
import { userProfileData, updateProfile } from '../../utils/userStore';
import { emergencyData } from '../../data/emergencyNumbers';
import { getLanguagesForCountry } from '../../data/countryLanguages';
import { useTheme, Shadows } from '../../utils/theme';
import { useLanguage } from '../../utils/languageContext';

import * as Location from 'expo-location';

export default function ProfileScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { t, setLanguage: setAppLanguage } = useLanguage();
  const styles = getStyles(colors);
  
  const router = useRouter();
  const [profileData, setProfileData] = useState(userProfileData);
  
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setProfileData({ ...userProfileData });
    }, [])
  );

  const handleLocationToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to enable sharing.');
        return;
      }
    }
    const newData = { ...profileData, locationSharing: value };
    setProfileData(newData);
    updateProfile(newData);
  };

  const handleNotificationToggle = (value: boolean) => {
    const newData = { ...profileData, notifications: value };
    setProfileData(newData);
    updateProfile(newData);
  };

  const handleThemeToggle = (value: boolean) => {
    const newTheme = value ? 'dark' : 'light';
    setTheme(newTheme);
    const newData = { ...profileData, theme: newTheme as 'dark' | 'light' };
    setProfileData(newData);
    updateProfile(newData);
  };

  const handleCountrySelect = (country: string) => {
    const newData = { ...profileData, country };
    setProfileData(newData);
    updateProfile(newData);
    setShowCountryModal(false);
  };

  const handleLanguageSelect = (language: string) => {
    const newData = { ...profileData, language };
    setProfileData(newData);
    updateProfile(newData);
    setAppLanguage(language); // Update app-wide language
    setShowLanguageModal(false);
  };

  const SelectModal = ({ visible, title, options, onSelect, onClose }: any) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000aa' }}>
        <ScrollView style={{ backgroundColor: colors.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>{title}</Text>
          {options.map((opt: string) => (
            <TouchableOpacity key={opt} style={{ paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => { onSelect(opt); onClose(); }}>
              <Text style={{ color: colors.text, fontSize: 16 }}>{opt}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={{ marginTop: 20, padding: 15, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center' }} onPress={onClose}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );

  const handleLogout = () => {
    const performLogout = () => {
      updateProfile({ isLoggedIn: false });
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        performLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  const openLink = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const SettingItem = ({
    icon, label, value, onPress, toggle, toggleValue, onToggle, color = '#fff',
  }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!!toggle}
      activeOpacity={toggle ? 1 : 0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: (color || '#E50000') + '15' }]}>
          <Ionicons name={icon} size={20} color={color || '#E50000'} />
        </View>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {value && <Text style={styles.settingValue}>{value}</Text>}
        </View>
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#333', true: '#E5000060' }}
          thumbColor={toggleValue ? '#E50000' : '#666'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#444" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={theme === 'dark' ? ['#0a0000', '#000'] : ['#F8F9FA', '#FFFFFF']} 
        style={styles.gradient} 
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <Text style={styles.headerLogo}>SOS!</Text>
          <Text style={styles.headerTitle}>{t('Profile')}</Text>
        </View>

        {/* User Card */}
        <TouchableOpacity 
          style={styles.userCard} 
          activeOpacity={0.8}
          onPress={() => router.push('/user-info')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{profileData.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{t(profileData.name)}</Text>
              <Text style={styles.userPhone}>{profileData.phone}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Helper Toggle */}
        <View style={styles.helperCard}>
          <LinearGradient
            colors={theme === 'dark' 
              ? (profileData.isHelper ? ['#E5000020', '#111'] : ['#111', '#111'])
              : (profileData.isHelper ? ['#FFE5E5', '#F8F9FA'] : ['#F8F9FA', '#F8F9FA'])}
            style={styles.helperCardInner}
          >
            <View style={styles.helperCardLeft}>
              <Ionicons name="hand-left" size={28} color={profileData.isHelper ? colors.primary : colors.textSecondary} />
              <View>
                <Text style={styles.helperCardTitle}>{t('Helper Mode')}</Text>
                <Text style={styles.helperCardSub}>
                  {profileData.isHelper ? t('You can receive help requests') : t('Toggle to become a helper')}
                </Text>
              </View>
            </View>
            <Switch
              value={profileData.isHelper}
              onValueChange={(val) => {
                if (val) {
                  if (profileData.hasRegisteredAsHelper) {
                    const newData = { ...profileData, isHelper: true };
                    setProfileData(newData);
                    updateProfile(newData);
                  } else {
                    router.push('/helper-register');
                  }
                } else {
                  const newData = { ...profileData, isHelper: false };
                  setProfileData(newData);
                  updateProfile(newData);
                }
              }}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={profileData.isHelper ? colors.primary : colors.textSecondary}
            />
          </LinearGradient>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Settings')}</Text>
          <SettingItem
            icon="moon"
            label={t('Dark Mode')}
            value={profileData.theme === 'dark' ? t('On') : t('Off')}
            toggle
            toggleValue={profileData.theme === 'dark'}
            onToggle={handleThemeToggle}
            color="#6B7280"
          />
          <SettingItem
            icon="location"
            label={t('Live Location Sharing')}
            value={profileData.locationSharing ? t('Enabled') : t('Disabled')}
            toggle
            toggleValue={profileData.locationSharing}
            onToggle={handleLocationToggle}
            color="#22C55E"
          />
          <SettingItem
            icon="notifications"
            label={t('Notifications')}
            value={profileData.notifications ? t('On') : t('Off')}
            toggle
            toggleValue={profileData.notifications}
            onToggle={handleNotificationToggle}
            color="#3B82F6"
          />
          <SettingItem
            icon="globe"
            label={t('Country')}
            value={profileData.country}
            color="#F97316"
            onPress={() => setShowCountryModal(true)}
          />
          <SettingItem
            icon="language"
            label={t('Language')}
            value={profileData.language}
            color="#8B5CF6"
            onPress={() => setShowLanguageModal(true)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('About')}</Text>
          <SettingItem icon="information-circle" label={t('About SOS!')} color="#3B82F6" onPress={() => router.push('/legal?type=about')} />
          <SettingItem icon="document-text" label={t('Terms of Service')} color="#22C55E" onPress={() => router.push('/legal?type=terms')} />
          <SettingItem icon="shield-checkmark" label={t('Privacy Policy')} color="#F97316" onPress={() => router.push('/legal?type=privacy')} />
          <SettingItem icon="star" label={t('Rate App')} color="#F59E0B" onPress={() => Linking.openURL('https://play.google.com/store')} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E50000" />
          <Text style={styles.logoutText}>{t('Logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SOS! v1.0.0</Text>
      </ScrollView>

      <SelectModal
        visible={showCountryModal}
        title="Select Country"
        options={emergencyData.map(c => `${c.country} ${c.flag}`)}
        onSelect={handleCountrySelect}
        onClose={() => setShowCountryModal(false)}
      />

      <SelectModal
        visible={showLanguageModal}
        title={`Languages in ${profileData.country.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}`}
        options={getLanguagesForCountry(profileData.country)}
        onSelect={handleLanguageSelect}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradient: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 },
  headerLogo: { fontSize: 28, fontWeight: '900', color: colors.primary, letterSpacing: 3 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16, padding: 18,
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  userAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  userName: { fontSize: 18, fontWeight: '700', color: colors.text },
  userPhone: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  helperCard: { marginHorizontal: 16, marginTop: 16 },
  helperCardInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    ...Shadows.medium,
  },
  helperCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  helperCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  helperCardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  section: { marginTop: 24, marginHorizontal: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  settingValue: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 32, padding: 16,
    borderRadius: 14, borderWidth: 1, borderColor: colors.primaryLight, backgroundColor: colors.primaryLight,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  version: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 20 },
});
