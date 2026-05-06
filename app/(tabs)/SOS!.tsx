import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Alert, Linking, Platform, Share
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { emergencyData, EmergencyNumber } from '../../data/emergencyNumbers';
import { getExtrasForCountry } from '../../data/countryExtras';
import { useTheme } from '../../utils/theme';
import { userProfileData, updateProfile } from '../../utils/userStore';
import { pushSOSRequest } from '../../utils/firebase';

const CATEGORIES = [
    { key: 'general', label: 'General', icon: 'warning', color: '#E50000' },
    { key: 'police', label: 'Police', icon: 'shield', color: '#3B82F6' },
    { key: 'fire', label: 'Fire', icon: 'flame', color: '#F97316' },
    { key: 'ambulance', label: 'Ambulance', icon: 'medkit', color: '#22C55E' },
];

export default function EmergencyScreen() {
    const { colors, theme } = useTheme();
    const styles = getStyles(colors, theme);
    
    const [search, setSearch] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<EmergencyNumber>(
        emergencyData.find((c) => c.code === 'IN')!
    );
    const [showCountryList, setShowCountryList] = useState(false);

    const filtered = useMemo(() => {
        if (!search) return emergencyData;
        const q = search.toLowerCase();
        return emergencyData.filter(
            (c) => c.country.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        );
    }, [search]);

    const dialNumber = (number: string, label: string) => {
        const url = `tel:${number}`;
        
        if (Platform.OS === 'web') {
            if (window.confirm(`Call ${label}: ${number}?`)) {
                window.open(url, '_self');
            }
        } else {
            Alert.alert(
                'Dial Emergency Number',
                `Call ${label}: ${number}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Call Now',
                        style: 'destructive',
                        onPress: () => {
                            Linking.openURL(url).catch(() =>
                                Alert.alert('Error', 'Unable to make the call')
                            );
                        },
                    },
                ]
            );
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
                const msg = `Your location has been shared with nearby helpers!\n\n📍 ${mapsLink}`;
                if (Platform.OS === 'web') {
                    window.alert(msg);
                } else {
                    Alert.alert('Request Sent', msg, [
                        { text: 'OK' },
                        { text: 'Open Map', onPress: () => Linking.openURL(mapsLink) },
                    ]);
                }
            } catch (err) {
                if (Platform.OS === 'web') {
                    window.alert('Failed to share location. Please try again.');
                } else {
                    Alert.alert('Error', 'Failed to share location. Please try again.');
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
                if (status !== 'granted') { await doShare(0, 0); return; }
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                await doShare(loc.coords.latitude, loc.coords.longitude);
            } catch {
                await doShare(0, 0);
            }
        }
    };

    if (showCountryList) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#0a0000', '#000']} style={styles.gradient} />
                <View style={styles.searchHeader}>
                    <TouchableOpacity onPress={() => { setShowCountryList(false); setSearch(''); }}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search country..."
                        placeholderTextColor="#666"
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
            <LinearGradient colors={theme === 'dark' ? ['#1a0000', '#000'] : ['#ffcccc', colors.background]} style={styles.gradient} />

            <FlatList
                ListHeaderComponent={
                    <>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerLogo}>SOS!</Text>
                            <Text style={styles.headerTitle}>Emergency Services</Text>
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
                                    <Text style={styles.countrySelectorHint}>Tap to change country</Text>
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
                                            <Text style={styles.quickDialLabel}>{cat.label}</Text>
                                            <Text style={[styles.quickDialNumber, { color: cat.color }]}>{number}</Text>
                                            <View style={[styles.callBadge, { backgroundColor: cat.color }]}>
                                                <Ionicons name="call" size={12} color="#fff" />
                                                <Text style={styles.callBadgeText}>DIAL</Text>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>



                        {/* Extra Numbers - Country Specific */}
                        {(() => { const extras = getExtrasForCountry(selectedCountry); return extras.length > 0 ? (
                            <View style={styles.extrasSection}>
                                <Text style={styles.extrasSectionTitle}>🏥 {selectedCountry.country} Helplines</Text>
                                {extras.map((extra, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.extraItem}
                                        onPress={() => dialNumber(extra.number, extra.name)}
                                    >
                                        <View style={styles.extraLeft}>
                                            <View style={styles.extraDot} />
                                            <View>
                                                <Text style={styles.extraName}>{extra.name}</Text>
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
                            <Text style={styles.tipsSectionTitle}>Quick Safety Tips</Text>
                            <View style={styles.tipCard}>
                                <Ionicons name="location" size={18} color="#E50000" />
                                <Text style={styles.tipText}>Share your live location with a trusted contact</Text>
                            </View>
                            <View style={styles.tipCard}>
                                <Ionicons name="mic" size={18} color="#E50000" />
                                <Text style={styles.tipText}>Stay calm and speak clearly when calling emergency</Text>
                            </View>
                            <View style={styles.tipCard}>
                                <Ionicons name="compass" size={18} color="#E50000" />
                                <Text style={styles.tipText}>Know your exact address or nearby landmarks</Text>
                            </View>
                        </View>
                    </>
                }
                data={[]}
                renderItem={null}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
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
    },
    countrySelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    countrySelectorFlag: { fontSize: 32 },
    countrySelectorName: { fontSize: 18, fontWeight: '700', color: colors.text },
    countrySelectorHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    quickDialGrid: {
        flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 16, gap: 8,
    },
    quickDialCard: { width: '48%', flexGrow: 1 },
    quickDialGradient: {
        padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
        alignItems: 'center', gap: 8,
    },
    quickDialIconBg: {
        width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    },
    quickDialLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 1 },
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
    },
    tipText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    searchHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12,
    },
    searchInput: {
        flex: 1, backgroundColor: colors.card, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 16,
        borderWidth: 1, borderColor: colors.border,
    },
    countryItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    countryItemActive: { backgroundColor: colors.primaryLight },
    countryFlag: { fontSize: 24 },
    countryName: { fontSize: 16, color: colors.text, flex: 1 },
    shareLocCard: { marginHorizontal: 16, marginTop: 16 },
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
});
