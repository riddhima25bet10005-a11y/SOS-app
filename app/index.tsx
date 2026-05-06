import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth } from '../utils/auth';
import { useTheme, Shadows } from '../utils/theme';
import { useLanguage } from '../utils/languageContext';

const { width, height } = Dimensions.get('window');

export default function IntroScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslate = useRef(new Animated.Value(50)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Pulse rings
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    createPulse(pulseAnim1, 0).start();
    createPulse(pulseAnim2, 800).start();
    createPulse(pulseAnim3, 1600).start();

    // Glow pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // SOS title entrance
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Tagline
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Load persisted data and navigate
    const init = async () => {
      const { loadProfile, userProfileData } = require('../utils/userStore');
      await loadProfile();
      
      setTimeout(() => {
        if (userProfileData.isLoggedIn) {
          router.replace('/(tabs)/emergency');
        } else {
          router.replace('/login');
        }
      }, 3000);
    };

    init();
  }, [router]);

  const renderPulseRing = (anim: Animated.Value, size: number) => {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1.5],
    });
    const opacity = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    });
    return (
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={theme === 'dark' ? ['#1a0000', '#000'] : ['#F8F9FA', '#FFFFFF']} 
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative red streaks */}
      <View style={styles.streakContainer}>
        <LinearGradient
          colors={['transparent', '#E5000030', 'transparent']}
          style={[styles.streak, { top: '15%', transform: [{ rotate: '-25deg' }] }]}
        />
        <LinearGradient
          colors={['transparent', '#E5000020', 'transparent']}
          style={[styles.streak, { top: '70%', transform: [{ rotate: '15deg' }] }]}
        />
      </View>

      {/* Pulse rings behind SOS */}
      <View style={styles.pulseContainer}>
        {renderPulseRing(pulseAnim1, 300)}
        {renderPulseRing(pulseAnim2, 250)}
        {renderPulseRing(pulseAnim3, 200)}
      </View>

      {/* Glow behind text */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* SOS! Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ scale: titleScale }],
          },
        ]}
      >
        SOS!
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslate }],
          },
        ]}
      >
        {t('We are there')}
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslate }],
          },
        ]}
      >
        {t('Emergency help at your fingertips')}{'\n'}{t('100+ countries covered')}
      </Animated.Text>

      {/* Navigation happens automatically, so no button is needed */}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  streakContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  streak: {
    position: 'absolute',
    width: width * 2,
    height: 2,
    left: -width * 0.5,
  },
  pulseContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
    elevation: 20,
  },
  title: {
    fontSize: 120,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 8,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
    zIndex: 10,
  },
  tagline: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.text,
    letterSpacing: 12,
    textTransform: 'uppercase',
    marginTop: 10,
    zIndex: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
    letterSpacing: 1,
    zIndex: 10,
  },
});
