import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';

export default function LegalScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const styles = getStyles(colors, theme);

  let title = '';
  let content = [];

  switch (type) {
    case 'about':
      title = 'About SOS!';
      content = [
        'Welcome to SOS!, your ultimate global emergency companion.',
        'Our mission is to provide immediate, localized access to life-saving emergency services anywhere in the world. With support for over 200 countries, intelligent regional routing, and instant text-to-action capabilities, SOS! is designed to be the fastest way to get help when you need it most.',
        'Version: 1.0.0\nDeveloped with ❤️ for global safety.'
      ];
      break;
    case 'terms':
      title = 'Terms of Service';
      content = [
        'Last Updated: April 2026',
        '1. Acceptance of Terms\nBy accessing and using the SOS! application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.',
        '2. Description of Service\nSOS! provides a directory of emergency contact numbers and intelligent routing for emergency assistance. We do not guarantee the response time or availability of the emergency services dialed.',
        '3. User Responsibilities\nYou agree to use SOS! responsibly and only in genuine emergency situations. Prank calling or misuse of emergency services is a criminal offense in many jurisdictions.',
        '4. Disclaimer of Liability\nThe developers of SOS! are not liable for any damages, injuries, or losses resulting from the use or inability to use this application.'
      ];
      break;
    case 'privacy':
      title = 'Privacy Policy';
      content = [
        'Last Updated: April 2026',
        '1. Information We Collect\nWe collect minimal information required for the app to function. When you enable Live Location, your location data is processed locally to find the nearest responders.',
        '2. Data Usage\nYour personal profile data (Medical ID, Emergency Contacts) is stored strictly locally on your device. We do not upload, sell, or share your personal data with third-party advertisers.',
        '3. Third-Party Services\nWe rely on secure third-party infrastructure for fetching updated regional emergency numbers. These requests do not contain personally identifiable information.',
        '4. Your Consent\nBy using SOS!, you consent to our privacy policy. Any future changes will be reflected in this document.'
      ];
      break;
    default:
      title = 'Information';
      content = ['Content not found.'];
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={theme === 'dark' ? ['#1a0000', '#000'] : ['#ffcccc', colors.background]} style={styles.gradient} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {content.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  backBtn: { padding: 8, marginLeft: -8, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  scrollContent: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paragraph: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
});
