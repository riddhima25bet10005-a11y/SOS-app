import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { globalRequests } from '../../utils/userStore';

interface HelperProfile {
  name: string;
  avatar: string;
  icon: string;
  dialogues: string[];
}

const HELPER_PROFILES: Record<string, HelperProfile> = {
  ai: {
    name: 'SOS AI Agent',
    avatar: '🤖',
    icon: 'hardware-chip',
    dialogues: [
      'SOS AI Agent activated. I am your 24/7 emergency expert, trained in medical first aid, disaster response, fire safety, crime reporting, and mental health support. Are you safe right now?',
      'I am analyzing your situation. My database covers over 200 emergency scenarios including cardiac arrest, choking, severe bleeding, burns, fractures, poisoning, snake bites, allergic reactions, drowning, road accidents, fire evacuation, earthquake safety, flood protocols, domestic violence, child safety, and mental health crises.',
      'I can guide you step by step through CPR, wound dressing, tourniquet application, the Heimlich maneuver, and the recovery position. Tell me what is happening and I will give you exact instructions.',
      'I also have direct numbers for every Indian emergency service. Ambulance 108, Police 100, Fire 101, Women Helpline 1091, Child Helpline 1098, Poison Control 1800 116 117, NDMA 1078, and Mental Health 1800 599 0019. What do you need?',
      'Remember, I am here to help. Describe the situation in your own words and I will respond with actionable steps. Take your time.',
    ],
  },
  '1': {
    name: 'Dr. Priya Sharma',
    avatar: '👩‍⚕️',
    icon: 'medkit',
    dialogues: [
      'Hello, this is Dr. Priya Sharma speaking. How can I help you today?',
      'Can you describe your symptoms? Are you experiencing any pain, dizziness, or difficulty breathing?',
      'Based on what you have told me, please stay still and do not exert yourself. I am going to guide you through some steps.',
      'If you have any medication nearby such as paracetamol, keep it ready. I will let you know if you should take it.',
      'Your vitals assessment sounds stable. I will stay on the line with you until you feel better or help arrives.',
    ],
  },
  '2': {
    name: 'Officer Raj Kumar',
    avatar: '👮',
    icon: 'shield',
    dialogues: [
      'This is Officer Raj Kumar. You are connected to the safety and security line. What is your situation?',
      'Are you in immediate danger right now? Is anyone threatening you?',
      'Try to stay in a well-lit, public area if you can. Lock your doors if you are indoors.',
      'I am dispatching the nearest patrol unit to your location. Please share your live location.',
      'Stay on the line. Do not engage with anyone suspicious. Help is on the way.',
    ],
  },
  '3': {
    name: 'Sarah Mitchell',
    avatar: '🧑‍💼',
    icon: 'heart',
    dialogues: [
      'Hi, this is Sarah. I am a crisis counselor and I am here for you. You are not alone.',
      'Take a deep breath with me. Breathe in for four seconds, hold for four, and breathe out for six.',
      'It is completely okay to feel the way you are feeling. Can you tell me what triggered this?',
      'I want you to focus on five things you can see around you right now. Name them for me.',
      'You are doing great. I am going to stay right here with you as long as you need.',
    ],
  },
  '4': {
    name: 'Firefighter Carlos',
    avatar: '👨‍🚒',
    icon: 'flame',
    dialogues: [
      'This is Firefighter Carlos from Fire and Rescue. What is happening at your location?',
      'If you see smoke, immediately drop to the floor and crawl. The air is cleaner down there.',
      'Do not use elevators. Use stairs and head towards the nearest exit.',
      'Cover your nose and mouth with a wet cloth if available. Are you able to evacuate?',
      'A fire unit has been alerted. Stay away from the building and wait in a safe open area.',
    ],
  },
  '5': {
    name: 'Dr. Aisha Khan',
    avatar: '👩‍🔬',
    icon: 'flask',
    dialogues: [
      'This is Dr. Aisha Khan from Poison Control. What substance was ingested or exposed?',
      'Do not induce vomiting unless I tell you to. Can you read me the label of the substance?',
      'How long ago was the exposure? Is the person conscious and breathing normally?',
      'Give them small sips of water only. Do not give milk or any other liquid.',
      'Based on what you described, this requires immediate hospital attention. I am connecting you to an ambulance now.',
    ],
  },
  '6': {
    name: 'James Wilson',
    avatar: '🦺',
    icon: 'earth',
    dialogues: [
      'James Wilson here from Disaster Relief. What kind of natural disaster are you dealing with?',
      'Are you in a structurally safe location? Move away from windows and heavy furniture.',
      'Gather essentials like water, phone, and any first aid supplies you can find.',
      'If flooding is occurring, move to higher ground immediately. Do not try to walk through moving water.',
      'Relief teams are being coordinated for your area. Stay tuned to this channel for updates.',
    ],
  },
  '7': {
    name: 'Maria Rodriguez',
    avatar: '💁‍♀️',
    icon: 'female',
    dialogues: [
      'Hi, this is Maria from the Women Safety Helpline. You are in a safe space now. How can I help?',
      'Are you currently in danger? Can you speak freely right now?',
      'If you cannot speak, send me a message through the chat. I will understand.',
      'I want you to know that what happened is not your fault. We are going to help you through this.',
      'I am connecting you to a local women shelter and a legal advisor. They will guide you on next steps.',
    ],
  },
  '8': {
    name: 'Alex Chen',
    avatar: '🧑‍⚕️',
    icon: 'happy',
    dialogues: [
      'Hi, I am Alex, a mental health professional. Thank you for reaching out. How are you feeling?',
      'Whatever you are going through right now, I want you to know it is temporary and you matter.',
      'Let us try something together. Place your feet flat on the ground and feel the surface beneath you.',
      'Can you tell me one thing that brought you comfort recently? Even something small.',
      'You are incredibly brave for calling. I am here and I am listening. Take your time.',
    ],
  },
};

export default function CallScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const helperId = typeof id === 'string' ? id : 'ai';
  
  // Resolve profile: Check if it's a human helper from globalRequests
  const request = globalRequests.find(r => r.id === helperId);
  const isHuman = request && request.status === 'accepted';
  
  const profile = isHuman ? {
    name: request.acceptedBy,
    avatar: '👨‍💼',
    icon: 'person',
    dialogues: [
      `Hello, I am ${request.acceptedBy}. I accepted your SOS request. Are you okay?`,
      'I am on my way to your location. Please stay calm and tell me exactly what happened.',
      'I am looking at your coordinates now. I will be there in just a few minutes.',
      'Stay on the line with me. You are not alone.',
    ]
  } : (HELPER_PROFILES[helperId] || HELPER_PROFILES['ai']);

  const [callActive, setCallActive] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState(`Connecting to ${profile.name}...`);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  useEffect(() => {
    if (!callActive) return;

    const speakAndSet = (text: string) => {
      setTranscript(`${profile.avatar} ${profile.name}:\n"${text}"`);
      Speech.speak(text, { pitch: 1, rate: 0.9 });
    };

    const showListening = (text: string) => {
      setTranscript(`${profile.avatar} ${profile.name}:\n"${text}"\n\n🎙️ Listening...`);
    };

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let delay = 2000;

    profile.dialogues.forEach((line, i) => {
      timeouts.push(setTimeout(() => speakAndSet(line), delay));
      delay += 4000;
      timeouts.push(setTimeout(() => showListening(line), delay));
      delay += 3000;
    });

    return () => {
      timeouts.forEach(clearTimeout);
      Speech.stop();
    };
  }, [callActive]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const endCall = () => {
    setCallActive(false);
    Speech.stop();
    setTimeout(() => router.back(), 500);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0000', '#000', '#000', '#1a0000']}
        style={styles.gradient}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Caller Info */}
        <Text style={styles.callingText}>
          {callActive ? 'Voice Active' : 'Call Ended'}
        </Text>

        <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 48 }}>{profile.avatar}</Text>
          </View>
        </Animated.View>

        <Text style={styles.callerName}>{profile.name}</Text>
        <Text style={styles.timer}>{formatTime(seconds)}</Text>

        {/* Transcript */}
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, muted && styles.controlBtnActive]}
            onPress={() => setMuted(!muted)}
          >
            <Ionicons name={muted ? 'mic-off' : 'mic'} size={24} color="#fff" />
            <Text style={styles.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, speaker && styles.controlBtnActive]}
            onPress={() => setSpeaker(!speaker)}
          >
            <Ionicons name={speaker ? 'volume-high' : 'volume-medium'} size={24} color="#fff" />
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="keypad" size={24} color="#fff" />
            <Text style={styles.controlLabel}>Keypad</Text>
          </TouchableOpacity>
        </View>

        {/* End Call */}
        <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
          <LinearGradient
            colors={['#E50000', '#8B0000']}
            style={styles.endCallGradient}
          >
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { ...StyleSheet.absoluteFillObject },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, paddingBottom: 40 },
  callingText: { fontSize: 14, color: '#22C55E', fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  avatarRing: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, borderColor: '#E5000040',
    alignItems: 'center', justifyContent: 'center', marginTop: 30,
  },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E5000020', alignItems: 'center', justifyContent: 'center',
  },
  callerName: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 20 },
  timer: { fontSize: 18, color: '#888', marginTop: 8, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', gap: 30, marginTop: 30 },
  controlBtn: {
    alignItems: 'center', gap: 6,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#222', justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: '#333' },
  controlLabel: { fontSize: 10, color: '#aaa', fontWeight: '600' },
  endCallBtn: { marginTop: 30 },
  endCallGradient: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E50000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 15, elevation: 10,
  },
  transcriptBox: {
    marginTop: 30, padding: 16, backgroundColor: '#111',
    borderRadius: 12, borderWidth: 1, borderColor: '#222',
    width: '90%', minHeight: 80, justifyContent: 'center',
  },
  transcriptText: { color: '#E50000', fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
});
