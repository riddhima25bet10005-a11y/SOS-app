import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../utils/languageContext';
import { translateText } from '../utils/translate';
import { useTheme, Shadows } from '../utils/theme';
import { getAIResponse } from '../utils/aiEngine';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const INITIAL_TEXT = '🤖 SOS AI Agent — Online & Ready\n\nI am your 24/7 emergency guide, trained in medical first aid, fire safety, disaster response, crime reporting, mental health crisis support, and more.\n\nTell me what is happening and I will give you exact step-by-step instructions.';

export default function AIAssistantScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { language, t } = useLanguage();
  const styles = getStyles(colors, theme);

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

  // Initialize and load memory
  useEffect(() => {
    const loadMemory = async () => {
      try {
        const savedMsgs = await AsyncStorage.getItem('ai_memory_messages');
        const savedCtx = await AsyncStorage.getItem('ai_memory_context');
        
        if (savedMsgs) {
          const parsed = JSON.parse(savedMsgs).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(parsed);
        } else {
          const initMsg: Message = {
            id: '1',
            text: t(INITIAL_TEXT),
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages([initMsg]);
        }

        if (savedCtx) {
          contextRef.current = JSON.parse(savedCtx);
        }
      } catch (e) {
        console.error('Failed to load AI memory', e);
      }
    };
    loadMemory();
  }, [language, t]);

  const saveMemory = async (newMessages: Message[], ctx: any) => {
    try {
      await AsyncStorage.setItem('ai_memory_messages', JSON.stringify(newMessages));
      await AsyncStorage.setItem('ai_memory_context', JSON.stringify(ctx));
    } catch (e) {
      console.error('Failed to save AI memory', e);
    }
  };

  const clearMemory = async () => {
    Alert.alert(
      t('Clear Memory'),
      t('Are you sure you want to erase the AI chat history?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { 
          text: t('Clear'), 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('ai_memory_messages');
            await AsyncStorage.removeItem('ai_memory_context');
            contextRef.current = { history: [], detectedCategory: null, severity: 'low', followUpCount: 0 };
            const initMsg: Message = { id: '1', text: t(INITIAL_TEXT), sender: 'ai', timestamp: new Date() };
            setMessages([initMsg]);
            saveMemory([initMsg], contextRef.current);
          }
        }
      ]
    );
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input.trim();

    const newMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };
    const newMsgs = [...messages, newMsg];
    setMessages(newMsgs);
    setInput('');
    saveMemory(newMsgs, contextRef.current);

    setIsTyping(true);
    flatListRef.current?.scrollToEnd({ animated: true });

    // Translate user input to English for AI Engine if needed
    let englishInput = userText;
    if (language !== 'English') {
      try {
        englishInput = await translateText(userText, 'English', language);
      } catch {
        englishInput = userText;
      }
    }

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

      // Translate AI reply back to user's language
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
        sender: 'ai',
        timestamp: new Date(),
      };
      
      const newMsgs = [...messages, newMsg, aiMsg];
      setMessages(newMsgs);
      saveMemory(newMsgs, ctx);
      setIsTyping(false);
    }, 1000); // Small artificial delay to simulate thinking
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
          <View style={styles.aiIconContainer}>
            <Ionicons name="hardware-chip" size={16} color={colors.primary} />
          </View>
        )}
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient 
          colors={theme === 'dark' ? ['#0a0a0a', '#000'] : [colors.background, colors.background]} 
          style={styles.gradient} 
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('SOS AI Assistant')}</Text>
            <Text style={styles.headerSubtitle}>
              <Ionicons name="language" size={12} color={colors.textSecondary} /> {language}
            </Text>
          </View>
          <TouchableOpacity onPress={clearMemory} style={styles.backBtn}>
            <Ionicons name="trash-outline" size={22} color="#E50000" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                <Ionicons name="hardware-chip" size={14} color={colors.textSecondary} />
                <Text style={styles.typingText}>{t('SOS AI is thinking...')}</Text>
              </View>
            ) : null}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t('Ask for emergency guidance...')}
              placeholderTextColor={colors.textSecondary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
              onPress={sendMessage}
              disabled={!input.trim()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, theme: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.card },
  container: { flex: 1, backgroundColor: colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    ...Shadows.soft,
  },
  backBtn: { padding: 4 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  messagesList: { padding: 16, paddingBottom: 24 },
  messageBubble: {
    maxWidth: '85%', padding: 14, borderRadius: 20, marginBottom: 12,
    ...Shadows.soft,
  },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start', backgroundColor: colors.card,
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border,
  },
  aiIconContainer: { marginBottom: 6 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: colors.text },
  timeText: { fontSize: 10, color: colors.textSecondary, marginTop: 6, alignSelf: 'flex-end', opacity: 0.8 },
  typingContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4 },
  typingText: { color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 12, color: colors.text, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...Shadows.medium,
  },
  sendBtnDisabled: { backgroundColor: colors.border },
});
