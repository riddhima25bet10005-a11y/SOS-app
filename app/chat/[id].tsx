import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useLanguage } from '../../utils/languageContext';
import { translateText } from '../../utils/translate';
import { userProfileData, globalRequests, globalMessages, addMessageGlobal } from '../../utils/userStore';
import { useTheme, Shadows } from '../../utils/theme';
import { getAIResponse } from '../../utils/aiEngine';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'helper';
  timestamp: Date;
  type?: 'text' | 'location';
}

const INITIAL_TEXT = '🤖 SOS AI Agent — Online & Ready\n\nI am your 24/7 emergency guide, trained in medical first aid, fire safety, disaster response, crime reporting, mental health crisis support, and more.\n\nTell me what is happening and I will give you exact step-by-step instructions.';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { colors, theme } = useTheme();
  const { language, t, tAsync, translatedStrings } = useLanguage();
  const styles = getStyles(colors, theme);

  const request = globalRequests.find(r => r.id === id);
  const isHumanHelper = request && request.status === 'accepted';
  const helperName = isHumanHelper ? request.acceptedBy : t('SOS AI Agent');
  const isCurrentUserHelper = userProfileData.isHelper;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const contextRef = useRef({
    history: [] as string[],
    detectedCategory: null as string | null,
    severity: 'low' as 'low' | 'medium' | 'high' | 'critical',
    followUpCount: 0,
  });

  // Sync with global messages
  useEffect(() => {
    const sync = () => {
      const globalMsgs = globalMessages[id as string] || [];
      // Only sync if there are NEW messages to avoid overwriting current translations
      if (globalMsgs.length > messages.length) {
        setMessages(globalMsgs);
      } else if (globalMsgs.length === 0 && messages.length === 0) {
        // Initial message
        const initialText = isHumanHelper 
          ? `${t('Connected with')} ${helperName}. ${t('They are on their way to help you.')}`
          : t(INITIAL_TEXT);
        const initialMsg: Message = { id: '1', text: initialText, sender: 'helper', timestamp: new Date(), type: 'text' };
        setMessages([initialMsg]);
        addMessageGlobal(id as string, initialMsg);
      }
    };

    sync();
    const interval = setInterval(sync, 1000);
    return () => clearInterval(interval);
  }, [id, isHumanHelper, messages.length]);

  // The initial message is now handled via t(INITIAL_TEXT) in the sync logic above.
  // We just need to make sure we re-render if the translation cache updates.
  useEffect(() => {
    // Force first message refresh when language or translations change
    const newText = isHumanHelper 
      ? `${t('Connected with')} ${helperName}. ${t('They are on their way to help you.')}`
      : t(INITIAL_TEXT);

    setMessages((prev) => {
      if (prev.length > 0 && prev[0].id === '1') {
        const updated = [...prev];
        updated[0] = { ...updated[0], text: newText };
        
        // Also update the GLOBAL store so it doesn't revert
        if (globalMessages[id as string] && globalMessages[id as string][0]) {
          globalMessages[id as string][0].text = newText;
        }
        
        return updated;
      }
      return prev;
    });
  }, [language, translatedStrings]);

  // Send message with translation pipeline
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input.trim();

    const newMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: isCurrentUserHelper ? 'helper' : 'user',
      timestamp: new Date(),
      type: 'text',
    };
    addMessageGlobal(id as string, newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInput('');

    // Translate user input → English for AI engine
    let englishInput = userText;
    if (language !== 'English') {
      try {
        englishInput = await translateText(userText, 'English', language);
      } catch {
        englishInput = userText;
      }
    }

    // If it's a human helper, we don't automatically trigger AI response 
    // In a real app, this would be handled by a backend socket
    if (isHumanHelper) return;

    // Get AI response then translate back
    setIsTyping(true);
    setTimeout(async () => {
      const ctx = contextRef.current;
      ctx.history.push(englishInput);

      const result = getAIResponse(englishInput, ctx);

      if (ctx.detectedCategory === result.category) {
        ctx.followUpCount++;
      } else {
        ctx.detectedCategory = result.category;
        ctx.followUpCount = 0;
      }
      ctx.severity = result.severity as 'low' | 'medium' | 'high' | 'critical';

      // Translate AI reply → user's language
      let finalReply = result.reply;
      if (language !== 'English') {
        try {
          finalReply = await translateText(result.reply, language, 'English');
        } catch {
          finalReply = result.reply;
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: finalReply,
        sender: 'helper',
        timestamp: new Date(),
        type: 'text',
      };
      
      addMessageGlobal(id as string, aiMsg);
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const shareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') window.alert('Permission Denied: Location permission is required.');
        else Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const mapUrl = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
      const messageText = `SOS! I need help. My current location is: ${mapUrl}`;

      if (Platform.OS === 'web') {
        const locMsg: Message = {
          id: Date.now().toString(),
          text: `📍 ${t('Share Location')}: ${mapUrl}`,
          sender: isCurrentUserHelper ? 'helper' : 'user',
          timestamp: new Date(),
          type: 'location',
        };
        addMessageGlobal(id as string, locMsg);
        setMessages((prev) => [...prev, locMsg]);
      } else {
        Alert.alert(
          t('Share Location'),
          'How would you like to share your location?',
          [
            {
              text: 'Send in App Chat',
              onPress: () => {
                const locMsg: Message = {
                  id: Date.now().toString(),
                  text: `📍 ${t('Share Location')}: ${mapUrl}`,
                  sender: isCurrentUserHelper ? 'helper' : 'user',
                  timestamp: new Date(),
                  type: 'location',
                };
                addMessageGlobal(id as string, locMsg);
                setMessages((prev) => [...prev, locMsg]);
              },
            },
            {
              text: 'Share via WhatsApp',
              onPress: async () => {
                const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(messageText)}`;
                const canOpen = await Linking.canOpenURL(whatsappUrl);
                if (canOpen) await Linking.openURL(whatsappUrl);
              },
            },
            { text: t('Cancel'), style: 'cancel' },
          ]
        );
      }
    } catch {
      if (Platform.OS === 'web') window.alert('Error: Could not get your location.');
      else Alert.alert('Error', 'Could not get your location.');
    }
  };

  const shareLiveLocation = async () => {
    const startSharing = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (Platform.OS === 'web') window.alert('Permission Denied');
          else Alert.alert('Permission Denied', 'Location permission is required.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const mapUrl = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
        const liveMsg: Message = {
          id: Date.now().toString(),
          text: `📡 ${t('Live Location')} (30 min)\n📍 ${mapUrl}`,
          sender: isCurrentUserHelper ? 'helper' : 'user',
          timestamp: new Date(),
          type: 'location',
        };
        addMessageGlobal(id as string, liveMsg);
        setMessages((prev) => [...prev, liveMsg]);
      } catch {
        if (Platform.OS === 'web') window.alert('Error');
        else Alert.alert('Error', 'Could not start live location sharing.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Share your live location for 30 minutes?')) await startSharing();
    } else {
      Alert.alert(t('Live Location'), 'Share your live location for 30 minutes?', [
        { text: t('Cancel'), style: 'cancel' },
        { text: 'Share', onPress: startSharing },
      ]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = (isCurrentUserHelper && item.sender === 'helper') || (!isCurrentUserHelper && item.sender === 'user');
    
    return (
      <View style={[styles.messageBubble, isMe ? styles.userBubble : styles.helperBubble]}>
        {item.type === 'location' && (
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={16} color="#E50000" />
          </View>
        )}
        <Text style={[styles.messageText, isMe ? styles.userText : styles.helperText]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={theme === 'dark' ? ['#0f0000', '#000'] : [colors.background, colors.background]} 
        style={styles.gradient} 
      />

      {language !== 'English' && (
        <View style={styles.langBanner}>
          <Ionicons name="language" size={14} color="#8B5CF6" />
          <Text style={styles.langBannerText}>🌐 {language}</Text>
        </View>
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isTyping ? (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>{helperName} {t('is typing...')}</Text>
            </View>
          ) : null}
        />

        <View style={styles.locationBar}>
          <TouchableOpacity style={styles.locationBtn} onPress={shareLocation}>
            <Ionicons name="location" size={16} color="#22C55E" />
            <Text style={styles.locationBtnText}>{t('Share Location')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationBtn} onPress={shareLiveLocation}>
            <Ionicons name="navigate" size={16} color="#3B82F6" />
            <Text style={styles.locationBtnText}>{t('Live Location')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={t('Type your message...')}
            placeholderTextColor={colors.textSecondary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <LinearGradient colors={['#E50000', '#B30000']} style={styles.sendBtnGradient}>
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: any, theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  langBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 6, backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f0f0ff',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  langBannerText: { color: '#8B5CF6', fontSize: 12, fontWeight: '600' },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubble: { 
    maxWidth: '85%', padding: 12, borderRadius: 18, marginBottom: 10,
    ...Shadows.soft,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  helperBubble: {
    alignSelf: 'flex-start', backgroundColor: colors.card,
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  helperText: { color: colors.text },
  timeText: { fontSize: 10, color: colors.textSecondary, marginTop: 4, alignSelf: 'flex-end', opacity: 0.7 },
  locationIcon: { marginBottom: 4 },
  locationBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    ...Shadows.soft,
  },
  locationBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 10, color: colors.text, fontSize: 15,
    maxHeight: 120, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: { marginBottom: 2 },
  sendBtnGradient: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.medium,
  },
  typingContainer: { paddingVertical: 8, paddingHorizontal: 4 },
  typingText: { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
});
