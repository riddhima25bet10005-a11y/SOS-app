import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme, Shadows } from '../../utils/theme';
import { useLanguage } from '../../utils/languageContext';
import { userProfileData, updateProfile } from '../../utils/userStore';
import {
  listenToSOSRequests,
  acceptSOSRequest,
  listenToRequest,
  SOSRequest,
  calcDistanceKm,
  listenToHelpers,
  HelperProfile,
  updateHelperStatus,
} from '../../utils/firebase';

export default function HelperScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors, theme);

  const [isHelper, setIsHelper] = useState(userProfileData.isHelper);
  const [helperStatus, setHelperStatus] = useState(userProfileData.helperStatus || 'offline');
  const [activeRequests, setActiveRequests] = useState<SOSRequest[]>([]);
  const [registeredHelpers, setRegisteredHelpers] = useState<HelperProfile[]>([]);
  const [hasRequested, setHasRequested] = useState(false);
  const [peopleHelped, setPeopleHelped] = useState(0);
  const [helperLocation, setHelperLocation] = useState<{ lat: number; lng: number } | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      setIsHelper(userProfileData.isHelper);
      setHelperStatus(userProfileData.helperStatus || 'offline');
    }, [])
  );

  // Get helper's own location for distance calculation
  useEffect(() => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setHelperLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // Subscribe to Firebase SOS requests when helper is online
  useEffect(() => {
    if (helperStatus === 'available') {
      unsubscribeRef.current = listenToSOSRequests((requests) => {
        setActiveRequests(requests);
      });
    } else {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setActiveRequests([]);
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [helperStatus]);

  // Subscribe to Firebase helpers when user is not a helper
  useEffect(() => {
    if (!isHelper) {
      const unsub = listenToHelpers((helpers) => {
        setRegisteredHelpers(helpers);
      });
      return unsub;
    }
  }, [isHelper]);

  // Watch for request acceptance (for the user side)
  useEffect(() => {
    if (!isHelper && userProfileData.currentRequestId) {
      const unsub = listenToRequest(userProfileData.currentRequestId, (req) => {
        if (req && req.status === 'accepted') {
          unsub();
          updateProfile({ currentRequestId: null });
          if (Platform.OS === 'web') {
            window.alert(`${req.acceptedBy} ${t('is on the way and ready to help!')}`);
          } else {
            Alert.alert(
              t('Request Accepted'),
              `${req.acceptedBy} ${t('is on the way and ready to help!')}`,
              [{ text: t('OK') }]
            );
          }
        }
      });
      return unsub;
    }
  }, [isHelper, userProfileData.currentRequestId]);

  const toggleStatus = (val: boolean) => {
    const newStatus = val ? 'available' : 'offline';
    setHelperStatus(newStatus);
    updateProfile({ helperStatus: newStatus });
    if (isHelper && userProfileData.phone) {
      const helperId = userProfileData.phone.replace(/[^a-zA-Z0-9]/g, '');
      updateHelperStatus(helperId, newStatus).catch(e => console.warn('Failed to update status', e));
    }
  };

  const handleAcceptRequest = async (req: SOSRequest) => {
    try {
      await acceptSOSRequest(req.id, userProfileData.name);
      setPeopleHelped((prev) => prev + 1);

      // Open Maps to navigate to the user
      if (Platform.OS === 'web') {
        window.open(req.mapsLink, '_blank');
      } else {
        Linking.openURL(req.mapsLink);
      }
    } catch (err) {
      console.error('Accept failed:', err);
    }
  };

  const openMapsLink = (req: SOSRequest) => {
    if (Platform.OS === 'web') {
      window.open(req.mapsLink, '_blank');
    } else {
      Linking.openURL(req.mapsLink);
    }
  };

  const handleRequestHelp = async () => {
    const doHelp = async (lat: number, lng: number) => {
      try {
        const { pushSOSRequest } = await import('../../utils/firebase');
        const id = await pushSOSRequest(
          userProfileData.phone || 'anonymous',
          userProfileData.name || 'Unknown',
          lat,
          lng,
          'General Emergency'
        );
        updateProfile({ currentRequestId: id });
        setHasRequested(true);
        setTimeout(() => setHasRequested(false), 5000);
      } catch {
        setHasRequested(true);
        setTimeout(() => setHasRequested(false), 5000);
      }
    };

    if (Platform.OS === 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doHelp(pos.coords.latitude, pos.coords.longitude),
        () => doHelp(0, 0)
      );
    } else {
      await doHelp(0, 0);
    }
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const formatDistance = (req: SOSRequest): string => {
    if (!helperLocation || (!req.latitude && !req.longitude)) return 'Nearby';
    const km = calcDistanceKm(helperLocation.lat, helperLocation.lng, req.latitude, req.longitude);
    return km < 1 ? `${Math.round(km * 1000)}m away` : `${km.toFixed(1)} km away`;
  };

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.headerLogo}>{t('SOS!')}</Text>
        <Text style={styles.headerTitle}>{t('Helper Dashboard')}</Text>
        <Text style={styles.headerSub}>{t('Manage your availability and incoming requests')}</Text>
      </View>

      {/* Status Toggle */}
      <View style={styles.statusCard}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: helperStatus === 'available' ? '#22C55E' : '#666' }]} />
          <View>
            <Text style={styles.statusTitle}>
              {helperStatus === 'available' ? t('Available to Help') : t('Offline')}
            </Text>
            <Text style={styles.statusSub}>
              {helperStatus === 'available' ? t('You will receive SOS requests') : t('You are currently offline')}
            </Text>
          </View>
        </View>
        <Switch
          value={helperStatus === 'available'}
          onValueChange={toggleStatus}
          trackColor={{ false: '#444', true: '#22C55E80' }}
          thumbColor={helperStatus === 'available' ? '#22C55E' : '#888'}
        />
      </View>

      {/* Live Indicator */}
      {helperStatus === 'available' && (
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t('Live — Listening for SOS requests')}</Text>
        </View>
      )}

      {/* Active Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('Active Requests Nearby')}</Text>
        {helperStatus === 'offline' ? (
          <View style={styles.emptyState}>
            <Ionicons name="moon" size={32} color="#666" style={{ marginBottom: 8 }} />
            <Text style={styles.emptySub}>{t('Go online to view active requests in your area.')}</Text>
          </View>
        ) : activeRequests.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: '#22C55E50', backgroundColor: '#22C55E05' }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#22C55E" style={{ marginBottom: 8 }} />
            <Text style={[styles.emptySub, { color: '#22C55E' }]}>{t('No active emergency requests near you right now. Thank you for being available!')}</Text>
          </View>
        ) : (
          activeRequests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestTop}>
                <View style={[styles.requestIconWrap, { backgroundColor: '#E5000020' }]}>
                  <Ionicons name="location" size={20} color="#E50000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestType}>{req.userName}</Text>
                  <View style={styles.requestMeta}>
                    <Ionicons name="location" size={12} color={colors.textSecondary} />
                    <Text style={styles.requestMetaText}>{formatDistance(req)}</Text>
                    <Text style={styles.requestMetaDot}>•</Text>
                    <Text style={styles.requestMetaText}>{formatTime(req.timestamp)}</Text>
                  </View>
                  <Text style={[styles.requestMetaText, { marginTop: 4, color: '#E50000' }]}>
                    {req.type}
                  </Text>
                </View>
              </View>

              {/* Maps Button */}
              <TouchableOpacity style={styles.mapsBtn} onPress={() => openMapsLink(req)}>
                <Ionicons name="navigate" size={16} color="#3B82F6" />
                <Text style={styles.mapsBtnText}>{t('View Location on Maps')}</Text>
              </TouchableOpacity>

              <View style={styles.requestActions}>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRequest(req)}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.acceptBtnText}>{t('Accept & Navigate')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('Your Impact')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{peopleHelped}</Text>
            <Text style={styles.statLabel}>{t('People Helped')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeRequests.length}</Text>
            <Text style={styles.statLabel}>{t('Active Requests')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderDefault = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.headerLogo}>{t('SOS!')}</Text>
        <Text style={styles.headerTitle}>{t('Community Helpers')}</Text>
        <Text style={styles.headerSub}>
          {t('Real people ready to help in emergencies')}
        </Text>
      </View>

      {/* AI Agent Card */}
      <View style={styles.aiCard}>
        <LinearGradient
          colors={theme === 'dark' ? ['#1a0505', '#111'] : ['#FFFFFF', '#F8F9FA']}
          style={styles.aiCardInner}
        >
          <View style={styles.aiTop}>
            <View style={styles.aiAvatarWrap}>
              <Text style={{ fontSize: 36 }}>🤖</Text>
              <View style={styles.onlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiName}>{t('SOS AI Voice Agent')}</Text>
              <Text style={styles.aiSub}>{t('24/7 Smart Emergency Guide')}</Text>
              <View style={styles.aiBadgeRow}>
                <View style={styles.aiBadge}>
                  <Ionicons name="flash" size={12} color="#22C55E" />
                  <Text style={styles.aiBadgeText}>{t('Instant')}</Text>
                </View>
                <View style={styles.aiBadge}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.aiBadgeText}>{t('AI Powered')}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.aiActions}>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push('/chat/ai')}
            >
              <Ionicons name="chatbubbles" size={18} color="#E50000" />
              <Text style={styles.chatBtnText}>{t('Chat')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Become a Helper CTA */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.registerBanner}
        onPress={() => router.push('/helper-register')}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          style={styles.registerBannerInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.registerIcon}>
            <Ionicons name="hand-left" size={24} color="#22C55E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.registerTitle}>{t('Become a Helper')}</Text>
            <Text style={styles.registerSub}>{t('Register to help people in emergencies')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {userProfileData.hasRegisteredAsHelper && (
        <View style={styles.helperProfileCard}>
          <View style={styles.helperProfileTop}>
            <View style={styles.helperAvatar}>
              <Text style={styles.helperAvatarText}>{userProfileData.name.charAt(0)}</Text>
              <View style={styles.onlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.helperName}>{userProfileData.name} {t('(You)')}</Text>
              <Text style={styles.helperSpecialty}>{t('Community Helper')} • {t('Online')}</Text>
              
              <TouchableOpacity 
                style={[styles.requestHelpBtn, hasRequested && { backgroundColor: '#666' }]}
                onPress={handleRequestHelp}
                disabled={hasRequested}
              >
                <Ionicons name={hasRequested ? "checkmark-circle" : "warning"} size={14} color="#fff" />
                <Text style={styles.requestHelpBtnText}>
                  {hasRequested ? t('Request Sent') : t('Request Help')}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {registeredHelpers.length > 0 ? (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>{t('Registered Helpers')}</Text>
          {registeredHelpers.filter(h => h.name !== userProfileData.name).map((helper) => (
            <View key={helper.id} style={styles.helperProfileCard}>
              <View style={styles.helperProfileTop}>
                <View style={styles.helperAvatar}>
                  <Text style={styles.helperAvatarText}>{helper.name.charAt(0)}</Text>
                  {helper.status === 'available' && <View style={styles.onlineDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helperName}>{helper.name}</Text>
                  <Text style={styles.helperSpecialty}>{helper.specialty} • {helper.status === 'available' ? t('Online') : t('Offline')}</Text>
                  
                  <TouchableOpacity 
                    style={[styles.requestHelpBtn, hasRequested && { backgroundColor: '#666' }, helper.status !== 'available' && { backgroundColor: '#666', opacity: 0.5 }]}
                    onPress={handleRequestHelp}
                    disabled={hasRequested || helper.status !== 'available'}
                  >
                    <Ionicons name={hasRequested ? "checkmark-circle" : "warning"} size={14} color="#fff" />
                    <Text style={styles.requestHelpBtnText}>
                      {hasRequested ? t('Request Sent') : t('Request Help')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.callBtn, helper.status !== 'available' && { backgroundColor: '#666' }]} disabled={helper.status !== 'available'}>
                  <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="people-outline" size={48} color="#333" />
          </View>
          <Text style={styles.emptyTitle}>{t('No Helpers Yet')}</Text>
          <Text style={styles.emptySub}>
            {t('When verified helpers register, they will appear here. You can chat or call them directly for real-time guidance.')}
          </Text>

          <View style={styles.emptyFeatures}>
            <View style={styles.emptyFeatureItem}>
              <Ionicons name="shield-checkmark" size={20} color="#E50000" />
              <Text style={styles.emptyFeatureText}>{t('Verified professionals')}</Text>
            </View>
            <View style={styles.emptyFeatureItem}>
              <Ionicons name="chatbubbles" size={20} color="#E50000" />
              <Text style={styles.emptyFeatureText}>{t('Real-time chat & calls')}</Text>
            </View>
            <View style={styles.emptyFeatureItem}>
              <Ionicons name="location" size={20} color="#E50000" />
              <Text style={styles.emptyFeatureText}>{t('Location-based matching')}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme === 'dark' ? ['#0a0000', '#000'] : ['#F8F9FA', '#FFFFFF']} style={styles.gradient} />
      {isHelper ? renderDashboard() : renderDefault()}
    </View>
  );
}

const getStyles = (colors: any, theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 4 },
  headerLogo: { fontSize: 28, fontWeight: '900', color: colors.primary, letterSpacing: 3 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  // Helper Dashboard Styles
  statusCard: {
    marginHorizontal: 16, marginTop: 20, padding: 16, borderRadius: 16,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  statusSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, marginLeft: 4 },
  
  requestCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  requestTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  requestType: { fontSize: 15, fontWeight: '700', color: colors.text },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  requestMetaText: { fontSize: 12, color: colors.textSecondary },
  requestMetaDot: { fontSize: 12, color: colors.textSecondary },
  requestActions: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  acceptBtn: { 
    backgroundColor: colors.success, paddingVertical: 10, borderRadius: 10, 
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3B82F610', borderWidth: 1, borderColor: '#3B82F640',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginTop: 12,
  },
  mapsBtnText: { color: '#3B82F6', fontWeight: '700', fontSize: 13 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 10,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E',
    // Pulse effect via shadow
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4, elevation: 4,
  },
  liveText: { fontSize: 12, color: '#22C55E', fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    ...Shadows.soft,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },

  // Default User View Styles
  aiCard: { marginHorizontal: 16, marginTop: 20 },
  aiCardInner: { 
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primaryLight,
    backgroundColor: colors.card, ...Shadows.medium 
  },
  aiTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  aiAvatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: -2, width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.success, borderWidth: 2, borderColor: colors.card,
  },
  aiName: { fontSize: 17, fontWeight: '800', color: colors.text },
  aiSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  aiBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  aiBadgeText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  aiActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  chatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primaryLight,
  },
  chatBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  
  registerBanner: { marginHorizontal: 16, marginTop: 20, ...Shadows.medium },
  registerBannerInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14 },
  registerIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  registerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  registerSub: { fontSize: 12, color: '#ffffffa0', marginTop: 2 },
  
  emptyState: {
    marginHorizontal: 16, marginTop: 20, padding: 24, backgroundColor: colors.card,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    ...Shadows.soft,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyFeatures: { marginTop: 24, gap: 14, width: '100%' },
  emptyFeatureItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  emptyFeatureText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  
  helperProfileCard: {
    marginHorizontal: 16, marginTop: 20, padding: 16, backgroundColor: colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    ...Shadows.medium,
  },
  helperProfileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  helperAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  helperAvatarText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  helperName: { fontSize: 16, fontWeight: '700', color: colors.text },
  helperSpecialty: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  requestHelpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, marginTop: 8, alignSelf: 'flex-start',
  },
  requestHelpBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
});
