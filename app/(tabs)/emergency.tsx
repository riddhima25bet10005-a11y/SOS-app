import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Linking, Platform, Share
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { emergencyData, EmergencyNumber } from '../../data/emergencyNumbers';
import { getExtrasForCountry } from '../../data/countryExtras';
import { useTheme, Shadows } from '../../utils/theme';
import { useLanguage } from '../../utils/languageContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { userProfileData, updateProfile } from '../../utils/userStore';
import { pushSOSRequest, listenToRequest } from '../../utils/firebase';

const CATEGORIES = [
  { key: 'general', label: 'General', icon: 'warning', color: '#E50000' },
  { key: 'police', label: 'Police', icon: 'shield', color: '#3B82F6' },
  { key: 'fire', label: 'Fire', icon: 'flame', color: '#F97316' },
  { key: 'ambulance', label: 'Ambulance', icon: 'medkit', color: '#22C55E' },
];

// Realistic iPhone Ringtone URL (Public Domain / High Quality)
const IPHONE_RINGTONE = 'https://assets.mixkit.co/active_storage/sfx/1355/1355-preview.mp3'; 
// Note: Using a high-quality phone ring sfx from a public library

const LANGUAGE_CODES: Record<string, string> = {
  'English': 'en-US',
  'Hindi': 'hi'
};

export default function EmergencyScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t, tAsync } = useLanguage();
  const styles = getStyles(colors, theme);
  
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<EmergencyNumber>(() => {
    const match = emergencyData.find(c => `${c.country} ${c.flag}` === userProfileData.country);
    return match || emergencyData.find((c) => c.code === 'IN')!;
  });
  const [showCountryList, setShowCountryList] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [preTranslatedLines, setPreTranslatedLines] = useState({
    announcement: 'Incoming Call from Family',
    line1: "Hey! Just wanted to say I'm almost there. I'll be waiting right at the entrance for you, okay?",
    line2: "Everything's ready to go. Don't worry, I'll see you in just a second!"
  });
  
  const sirenSound = useRef<Audio.Sound | null>(null);
  const ringtoneSound = useRef<Audio.Sound | null>(null);
  const audioCtx = useRef<any>(null);
  const oscillator = useRef<any>(null);
  const sirenInterval = useRef<any>(null);
  const fakeCallTimeouts = useRef<any[]>([]);
  const sirenAudioEl = useRef<any>(null);
  const isFakeCallActive = useRef(false);

  // Helper for robust Web Audio playback
  const playWebAudio = async (url: string, loop: boolean = false) => {
    if (Platform.OS !== 'web') return null;
    try {
      if (!audioCtx.current || audioCtx.current.state === 'closed') {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const context = audioCtx.current;
      if (context.state === 'suspended') await context.resume();
      
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = loop;
      source.connect(context.destination);
      source.start();
      return source;
    } catch (e) {
      console.warn('Web Audio playback error:', e);
      return null;
    }
  };

  // Generate a WAV audio blob in memory — no network needed, works everywhere
  const generateWavBlob = (durationSecs: number, freqFn: (t: number) => number, volume = 0.8) => {
    const sampleRate = 44100;
    const numSamples = Math.floor(durationSecs * sampleRate);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    w(8, 'WAVE');
    w(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    w(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    
    let phase = 0;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = freqFn(t);
      phase += (2 * Math.PI * freq) / sampleRate;
      const sample = Math.sin(phase) * volume;
      view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

  // Siren WAV: sweeps 600-1400Hz repeatedly
  const createSirenAudio = () => {
    const blob = generateWavBlob(4, (t) => {
      // Sweep between 600 and 1400 Hz with a 1-second period
      return 600 + 400 * (1 + Math.sin(2 * Math.PI * 1.0 * t));
    }, 0.9);
    const url = URL.createObjectURL(blob);
    const audio = new window.Audio(url);
    audio.loop = true;
    return audio;
  };

  // Ringtone WAV: classic ring-ring-pause pattern
  const createRingtoneAudio = () => {
    const blob = generateWavBlob(3, (t) => {
      // Ring for 0.4s, silence 0.2s, ring 0.4s, silence 2s
      const cycle = t % 3;
      if (cycle < 0.4 || (cycle > 0.6 && cycle < 1.0)) {
        return 440; // Ring tone
      }
      return 0; // Silence
    }, 0.6);
    const url = URL.createObjectURL(blob);
    const audio = new window.Audio(url);
    audio.loop = true;
    return audio;
  };

  // Manage Siren Sound
  const toggleSiren = () => {
    const newState = !isSirenActive;
    setIsSirenActive(newState);

    if (newState) {
      if (Platform.OS === 'web') {
        try {
          const audio = createSirenAudio();
          sirenAudioEl.current = audio;
          audio.play().catch((e: any) => console.warn('Siren play failed:', e));
        } catch (e) {
          console.warn('Web Siren failed:', e);
        }
      } else {
        // Native: use expo-av
        (async () => {
          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Ambulance_siren.mp3' },
              { isLooping: true, shouldPlay: true, volume: 1.0 }
            );
            sirenSound.current = sound;
          } catch (e) {
            console.warn('Siren audio failed to load:', e);
          }
        })();
      }
    } else {
      // Stop siren
      if (Platform.OS === 'web') {
        if (sirenAudioEl.current) {
          sirenAudioEl.current.pause();
          sirenAudioEl.current.currentTime = 0;
          if (sirenAudioEl.current.src.startsWith('blob:')) URL.revokeObjectURL(sirenAudioEl.current.src);
          sirenAudioEl.current = null;
        }
      } else if (sirenSound.current) {
        sirenSound.current.stopAsync().then(() => {
          sirenSound.current?.unloadAsync();
          sirenSound.current = null;
        });
      }
    }
  };

  // Phone Ringtone for Fake Call
  const playBasicRingtone = () => {
    if (Platform.OS !== 'web') return null;
    try {
      const audio = createRingtoneAudio();
      audio.play().catch((e: any) => console.warn('Ringtone play failed:', e));
      return { 
        stop: () => { 
          audio.pause(); 
          audio.currentTime = 0;
          if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
        } 
      };
    } catch (e) {
      console.warn('Ringtone failed:', e);
      return null;
    }
  };

  // Manage Fake Call Ringtone
  const triggerFakeCall = async () => {
    setShowFakeCall(true);
    isFakeCallActive.current = true;
    
    if (Platform.OS === 'web') {
      const ring = playBasicRingtone();
      if (typeof window !== 'undefined') (window as any)._fakeCallSource = ring;
    } else {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: IPHONE_RINGTONE },
          { isLooping: true, shouldPlay: true, volume: 1.0 }
        );
        ringtoneSound.current = sound;
      } catch (e) {
        console.warn('Ringtone audio failed to load:', e);
      }
    }
  };

  const handleAnswerCall = async () => {
    // Stop ringtone aggressively
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if ((window as any)._fakeCallSource) {
        try { (window as any)._fakeCallSource.stop(); } catch(e){}
        (window as any)._fakeCallSource = null;
      }
    } else if (ringtoneSound.current) {
      try {
        await ringtoneSound.current.stopAsync();
        await ringtoneSound.current.unloadAsync();
        ringtoneSound.current = null;
      } catch(e) {}
    }
    await Speech.stop();
    
    // Start Optimized Human-Like Conversation
    const isHindi = userProfileData.language?.toLowerCase().includes('hindi');
    const langCode = isHindi ? 'hi' : 'en-US';
    
    await Speech.stop();
    
    const t1 = setTimeout(async () => {
      if (isFakeCallActive.current) {
        Speech.speak(preTranslatedLines.line1, {
          language: langCode,
          rate: 0.95,
          pitch: 1.05,
        });
      }
    }, 500);

    const t2 = setTimeout(async () => {
      if (isFakeCallActive.current) {
        Speech.speak(preTranslatedLines.line2, {
          language: langCode,
          rate: 0.95,
          pitch: 1.05,
        });
      }
    }, 7500);

    fakeCallTimeouts.current = [t1, t2];
  };

  const stopFakeCall = async () => {
    setShowFakeCall(false);
    isFakeCallActive.current = false;
    fakeCallTimeouts.current.forEach(t => clearTimeout(t));
    fakeCallTimeouts.current = [];
    await Speech.stop();
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if ((window as any)._fakeCallSource) {
        try { (window as any)._fakeCallSource.stop(); } catch(e){}
        (window as any)._fakeCallSource = null;
      }
    } else if (ringtoneSound.current) {
      await ringtoneSound.current.stopAsync();
      await ringtoneSound.current.unloadAsync();
      ringtoneSound.current = null;
    }
  };



  useEffect(() => {
    return () => {
      if (sirenInterval.current) clearInterval(sirenInterval.current);
      if (sirenSound.current) sirenSound.current.unloadAsync();
      if (ringtoneSound.current) ringtoneSound.current.unloadAsync();
      if (audioCtx.current) try { audioCtx.current.close(); } catch(e) {}
    };
  }, []);

  useEffect(() => {
    const preTranslate = async () => {
      const ann = await tAsync('Incoming Call from Family');
      const l1 = await tAsync("Hey! Just wanted to say I'm almost there. I'll be waiting right at the entrance for you, okay?");
      const l2 = await tAsync("Everything's ready to go. Don't worry, I'll see you in just a second!");
      setPreTranslatedLines({ announcement: ann, line1: l1, line2: l2 });
    };
    preTranslate();
  }, [userProfileData.language, tAsync]);

  useFocusEffect(
    React.useCallback(() => {
      const match = emergencyData.find(c => `${c.country} ${c.flag}` === userProfileData.country);
      if (match) setSelectedCountry(match);
    }, [])
  );

  const filtered = useMemo(() => {
    if (!search) return emergencyData;
    const q = search.toLowerCase();
    return emergencyData.filter(
      (c) => c.country.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const dialNumber = async (number: string, label: string) => {
    const url = `tel:${number}`;
    
    if (Platform.OS === 'web') {
      // On web browsers, directly assign tel: URL to trigger the system dialer
      try {
        window.location.href = url;
      } catch (e) {
        // Fallback: open in new window
        window.open(url, '_blank');
      }
    } else {
      // On native mobile, use Linking API with CALL_PHONE permission
      try {
        await Linking.openURL(url);
      } catch (error) {
        console.warn('Dialing error:', error);
        Alert.alert(t('Error'), t('Could not initiate the call.'));
      }
    }
  };

  const shareMyLocation = async () => {
    const doShare = async (latitude: number, longitude: number) => {
      try {
        const requestId = await pushSOSRequest(
          userProfileData.phone || 'anonymous',
          userProfileData.name || 'Unknown User',
          latitude,
          longitude,
          'Location Share'
        );
        updateProfile({ currentRequestId: requestId });

        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const msg = `${t('Your location has been shared with nearby helpers!')}\n\n📍 ${mapsLink}`;

        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert(
            t('Request Sent'),
            msg,
            [
              { text: t('OK') },
              { text: t('Open Map'), onPress: () => Linking.openURL(mapsLink) },
            ]
          );
        }
      } catch (err) {
        console.error('Firebase push failed:', err);
        if (Platform.OS === 'web') {
          window.alert(t('Failed to share location. Please try again.'));
        } else {
          Alert.alert(t('Error'), t('Failed to share location. Please try again.'));
        }
      }
    };

    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        await doShare(0, 0);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => doShare(pos.coords.latitude, pos.coords.longitude),
        () => doShare(0, 0),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          await doShare(0, 0);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        await doShare(loc.coords.latitude, loc.coords.longitude);
      } catch (error) {
        await doShare(0, 0);
      }
    }
  };

  if (showCountryList) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={theme === 'dark' ? ['#0a0000', '#000'] : ['#F8F9FA', '#FFFFFF']} 
          style={styles.gradient} 
        />
        <View style={styles.searchHeader}>
          <TouchableOpacity onPress={() => { setShowCountryList(false); setSearch(''); }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search country...')}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.countryItem,
                item.code === selectedCountry.code && styles.countryItemActive,
              ]}
              onPress={() => {
                setSelectedCountry(item);
                setShowCountryList(false);
                setSearch('');
                updateProfile({ country: `${item.country} ${item.flag}` });
              }}
            >
              <Text style={styles.countryFlag}>{item.flag}</Text>
              <Text style={styles.countryName}>{item.country}</Text>
              {item.code === selectedCountry.code && (
                <Ionicons name="checkmark-circle" size={20} color="#E50000" />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={theme === 'dark' ? ['#0a0000', '#000'] : ['#F8F9FA', '#FFFFFF']} 
        style={styles.gradient} 
      />

      <FlatList
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerLogo}>SOS!</Text>
              <Text style={styles.headerTitle}>{t('Emergency Services')}</Text>
            </View>

            {/* Country Selector */}
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryList(true)}
            >
              <View style={styles.countrySelectorLeft}>
                <Text style={styles.countrySelectorFlag}>{selectedCountry.flag}</Text>
                <View>
                  <Text style={styles.countrySelectorName}>{selectedCountry.country}</Text>
                  <Text style={styles.countrySelectorHint}>{t('Tap to change country')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>

            {/* Quick Dial Cards */}
            <View style={styles.quickDialGrid}>
              {CATEGORIES.map((cat) => {
                const number = selectedCountry[cat.key as keyof EmergencyNumber] as string;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={styles.quickDialCard}
                    activeOpacity={0.7}
                    onPress={() => dialNumber(number, cat.label)}
                  >
                    <LinearGradient
                      colors={theme === 'dark' ? [cat.color + '20', '#11111180'] : [cat.color + '20', '#ffffff80']}
                      style={styles.quickDialGradient}
                    >
                      <View style={[styles.quickDialIconBg, { backgroundColor: cat.color + '25' }]}>
                        <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                      </View>
                      <Text style={styles.quickDialLabel}>{t(cat.label)}</Text>
                      <Text style={[styles.quickDialNumber, { color: cat.color }]}>{number}</Text>
                      <View style={[styles.callBadge, { backgroundColor: cat.color }]}>
                        <Ionicons name="call" size={12} color="#fff" />
                        <Text style={styles.callBadgeText}>{t('DIAL')}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>



            {/* Safety Toolkit */}
            <View style={styles.toolkitSection}>
              <Text style={styles.toolkitTitle}>{t('Safety Toolkit')}</Text>
              <View style={styles.toolkitGrid}>
                <TouchableOpacity 
                  style={[styles.toolCard, isSirenActive && styles.toolCardActive]} 
                  onPress={toggleSiren}
                >
                  <Ionicons name={isSirenActive ? "notifications" : "notifications-outline"} size={24} color={isSirenActive ? "#fff" : "#E50000"} />
                  <Text style={[styles.toolLabel, isSirenActive && { color: '#fff' }]}>{t('Siren')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolCard} 
                  onPress={triggerFakeCall}
                >
                  <Ionicons name="call-outline" size={24} color="#3B82F6" />
                  <Text style={styles.toolLabel}>{t('Fake Call')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Extra Numbers - Country Specific */}
            {(() => { const extras = getExtrasForCountry(selectedCountry); return extras.length > 0 ? (
              <View style={styles.extrasSection}>
                <Text style={styles.extrasSectionTitle}>🏥 {selectedCountry.country} {t('Helplines')}</Text>
                {extras.map((extra, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.extraItem}
                    onPress={() => dialNumber(extra.number, extra.name)}
                  >
                    <View style={styles.extraLeft}>
                      <View style={styles.extraDot} />
                      <View>
                        <Text style={styles.extraName}>{t(extra.name)}</Text>
                        <Text style={styles.extraNumber}>{extra.number}</Text>
                      </View>
                    </View>
                    <View style={styles.extraCallBtn}>
                      <Ionicons name="call" size={16} color="#E50000" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null; })()}

            {/* Safety Tips */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsSectionTitle}>{t('Quick Safety Tips')}</Text>
              <View style={styles.tipCard}>
                <Ionicons name="location" size={18} color="#E50000" />
                <Text style={styles.tipText}>{t('Share your live location with a trusted contact')}</Text>
              </View>
              <View style={styles.tipCard}>
                <Ionicons name="mic" size={18} color="#E50000" />
                <Text style={styles.tipText}>{t('Stay calm and speak clearly when calling emergency')}</Text>
              </View>
              <View style={styles.tipCard}>
                <Ionicons name="compass" size={18} color="#E50000" />
                <Text style={styles.tipText}>{t('Know your exact address or nearby landmarks')}</Text>
              </View>
            </View>
          </>
        }
        data={[]}
        renderItem={null}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      {/* Fake Call Overlay */}
      {showFakeCall && (
        <View style={styles.fakeCallOverlay}>
          <LinearGradient colors={['#0f0f0f', '#000']} style={StyleSheet.absoluteFillObject} />
          
          <View style={styles.fakeCallContent}>
            <View style={styles.fakeCallAvatar}>
              <Ionicons name="person" size={60} color="#666" />
            </View>
            <Text style={styles.fakeCallName}>{t('Incoming Call...')}</Text>
            <Text style={styles.fakeCallStatus}>{t('Ringing')}</Text>
          </View>

          <View style={styles.fakeCallNumberWrap}>
            <Text style={styles.fakeCallNumber}>{t('Private Number')}</Text>
          </View>
          
          <View style={styles.fakeCallActions}>
            <View style={styles.fakeCallBtnContainer}>
              <TouchableOpacity 
                style={[styles.fakeCallBtn, { backgroundColor: '#FF3B30' }]} 
                onPress={stopFakeCall}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.fakeCallBtnLabel}>{t('Decline')}</Text>
            </View>

            <View style={styles.fakeCallBtnContainer}>
              <TouchableOpacity 
                style={[styles.fakeCallBtn, { backgroundColor: '#4CD964' }]} 
                onPress={handleAnswerCall}
              >
                <Ionicons name="call" size={32} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.fakeCallBtnLabel}>{t('Accept')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* AI Assistant FAB */}
      <TouchableOpacity 
        style={styles.fabContainer} 
        onPress={() => router.push('/ai-assistant')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6D28D9']}
          style={styles.fabGradient}
        >
          <Ionicons name="hardware-chip" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: any, theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 },
  headerLogo: { fontSize: 28, fontWeight: '900', color: colors.primary, letterSpacing: 3 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16, padding: 16,
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  countrySelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countrySelectorFlag: { fontSize: 32 },
  countrySelectorName: { fontSize: 18, fontWeight: '700', color: colors.text },
  countrySelectorHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  quickDialGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 16, gap: 8,
  },
  quickDialCard: { width: '48%', flexGrow: 1, ...Shadows.soft },
  quickDialGradient: {
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', gap: 8,
  },
  quickDialIconBg: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
  },
  quickDialLabel: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },
  quickDialNumber: { fontSize: 28, fontWeight: '900' },
  callBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, gap: 4, marginTop: 4,
  },
  callBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  extrasSection: { marginHorizontal: 16, marginTop: 24 },
  extrasSectionTitle: {
    fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, letterSpacing: 0.5,
  },
  extraItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  extraLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  extraDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  extraName: { fontSize: 14, fontWeight: '600', color: colors.text },
  extraNumber: { fontSize: 16, fontWeight: '800', color: colors.primary, marginTop: 2 },
  extraCallBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  tipsSection: { marginHorizontal: 16, marginTop: 24 },
  tipsSectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  tipText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  searchHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12,
  },
  searchInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 16,
    borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  countryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  countryItemActive: { backgroundColor: colors.primaryLight },
  countryFlag: { fontSize: 24 },
  countryName: { fontSize: 16, color: colors.text, flex: 1 },
  shareLocCard: { marginHorizontal: 16, marginTop: 16, ...Shadows.medium },
  shareLocGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#22C55E40',
  },
  shareLocIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#22C55E20',
    alignItems: 'center', justifyContent: 'center',
  },
  shareLocTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  shareLocSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  toolkitSection: { marginHorizontal: 16, marginTop: 24 },
  toolkitTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  toolkitGrid: { flexDirection: 'row', gap: 10 },
  toolCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  toolCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toolLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  fakeCallOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 2000, paddingBottom: 80, justifyContent: 'space-between' },
  fakeCallContent: { alignItems: 'center', marginTop: 100 },
  fakeCallAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  fakeCallName: { fontSize: 32, fontWeight: '400', color: '#fff' },
  fakeCallStatus: { fontSize: 16, color: '#aaa', marginTop: 8 },
  fakeCallNumberWrap: { alignItems: 'center' },
  fakeCallNumber: { fontSize: 16, color: '#666' },
  fakeCallActions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  fakeCallBtnContainer: { alignItems: 'center', gap: 12 },
  fakeCallBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  fakeCallBtnLabel: { color: '#fff', fontSize: 13, fontWeight: '500' },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...Shadows.medium,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff40',
  },
});
