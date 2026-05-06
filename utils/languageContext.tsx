import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translateText } from './translate';
import { userProfileData } from './userStore';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => string;
  tAsync: (text: string) => Promise<string>;
  translatedStrings: Record<string, string>;
  isTranslating: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  t: (text) => text,
  tAsync: async (text) => text,
  translatedStrings: {},
  isTranslating: false,
});

export const useLanguage = () => useContext(LanguageContext);

// Common UI strings used across the app - will be pre-translated when language changes
const COMMON_STRINGS = [
  // Tab labels
  'Emergency', 'Community Helper', 'Profile',
  // Emergency screen
  'Emergency Services', 'Search country...', 'Tap to change country',
  'Share My Exact Location', 'Send your GPS coordinates via SMS, WhatsApp, etc.',
  'Quick Safety Tips',
  'Share your live location with a trusted contact',
  'Stay calm and speak clearly when calling emergency',
  'Know your exact address or nearby landmarks',
  'General', 'Police', 'Fire', 'Ambulance', 'DIAL',
  'Helplines',
  // Profile screen
  'Settings', 'Dark Mode', 'On', 'Off',
  'Live Location Sharing', 'Enabled', 'Disabled',
  'Notifications', 'Country', 'Language',
  'About', 'About SOS!', 'Terms of Service', 'Privacy Policy', 'Rate App',
  'Logout', 'Helper Mode', 'You can receive help requests', 'Toggle to become a helper',
  'Select Country', 'Cancel',
  // Chat screen
  'Type your message...', 'Share Location', 'Live Location',
  // User info
  'Personal Information', 'Edit', 'Save', 'Basic Info',
  'Full Name', 'Phone Number', 'Medical ID', 'Blood Group',
  'Medical Conditions', 'Emergency Contact', 'Contact 1', 'Contact 2',
  'Home Address', 'Full Address', 'Not provided',
  // Helper
  'Register as Helper', 'Community Helpers',
  // Login
  'Welcome to', 'Your personal safety companion', 'Login', 'Sign Up',
  // General
  'Are you sure you want to logout?',
  // Helplines
  'Women Helpline', 'Child Helpline', 'Disaster Management', 'Senior Citizen', 
  'Anti-Corruption', 'Railway Police', 'Road Accident', 'Cyber Crime', 'Tourist Police',
  'Poison Info', 'Red Crescent', 'Red Cross', 'Mental Health', 'Anti-Drug', 'Suicide Line',
  'Women & Child', 'National Info', 'Gender Violence', 'Child Protection', 'Human Rights',
  'Anti-Terrorism', 'Social Emergency', 'Drug Control', 'Family Protection', 'Traffic Accidents',
  'Women Abuse', 'Drug Report', 'Civil Defence', 'Traffic Accident', 'Consumer Rights',
  'Social Welfare', 'Women Affairs', 'Child Abuse', 'Poison Control', 'Blue Phone',
  'Suicide CVV', 'SAMU Health', 'Lifeline', 'Women Refuge', 'Youth Line', 'Women Crisis',
  'Women SOS', 'Anti-Violence',
  'Helper Dashboard', 'Manage your availability and incoming requests',
  'Available to Help', 'Offline', 'You will receive SOS requests', 'You are currently offline',
  'Active Requests Nearby', 'Go online to view active requests in your area.',
  'Accept Request', 'Your Impact', 'People Helped', 'Rating',
  'Medical Emergency', 'Road Accident', 'Fire & Rescue',
  'Just now', '5 mins ago', '12 mins ago',
  '1.2 km away', '3.5 km away', '5.0 km away',
  'No active emergency requests near you right now. Thank you for being available!',
  'Request Sent', 'Request Help', 'General Emergency',
  'Connecting to Global Verification Network...',
  'Analyzing Credentials & Licenses...',
  'Cross-referencing International Databases...',
  'Verification Complete! ✅',
  'Welcome to the International Helper Community.',
  'AI Verification in Progress',
  'Missing Info', 'Please fill in all fields to continue.',
  'Select Specialty', 'Please choose your area of expertise.',
  'Please scroll down and describe your experience.',
  'Agreement Required', 'Please accept the Helper Guidelines to proceed.',
  'Personal Information', 'Tell us about yourself so we can verify your identity.',
  'Full Name', 'Enter your full name', 'Phone Number', 'Email Address',
  'Your Expertise', 'Select your area of specialty and describe your experience.',
  'Medical Emergency', 'Safety & Security', 'Fire & Rescue', 'Crisis Counseling',
  'Poison Control', 'Disaster Relief', 'Women Safety', 'Mental Health',
  'Years of Experience', 'e.g. 5 years as a paramedic', 'Short Bio (Optional)',
  'Tell people in distress why they can trust you...',
  'Verification', 'We need to verify your credentials before you can help others.',
  'Government ID / License Number', 'e.g. AADHAAR / Medical License #',
  'Background Check', 'Our team will verify your identity and credentials. This usually takes 24-48 hours.',
  'Data Privacy', 'Your personal information is encrypted and will only be used for verification purposes.',
  'I agree to the', 'Helper Guidelines', 'and commit to providing genuine assistance to people in emergency situations.',
  'Become a Helper', 'Continue', 'Submit Application', 'Submitting...',
  'Request Accepted', 'is on the way and ready to help!', 'Go to Chat',
  'Connected with', 'They are on their way to help you.', 'SOS AI Agent',
  'Safety Toolkit', 'Siren', 'Flashlight', 'Fake Call', 'Incoming Call...', 'Private Number',
  'Incoming call', 'Call from Family', "Hey! Just wanted to say I'm almost there. I'll be waiting right at the entrance for you, okay?",
  "Everything's ready to go. Don't worry, I'll see you in just a second!",
  'Real people ready to help in emergencies', 'SOS AI Voice Agent', '24/7 Smart Emergency Guide', 'Instant', 'AI Powered', 'Chat',
  '🤖 SOS AI Agent — Online & Ready\n\nI am your 24/7 emergency guide, trained in medical first aid, fire safety, disaster response, crime reporting, mental health crisis support, and more.\n\nTell me what is happening and I will give you exact step-by-step instructions.',
  'Online', '(You)', 'No Helpers Yet', 'When verified helpers register, they will appear here. You can chat or call them directly for real-time guidance.',
  'Verified professionals', 'Real-time chat & calls', 'Location-based matching', 'User',
  'Decline', 'Accept', 'Ringing',
  'SOS AI Assistant', 'SOS AI is thinking...', 'Ask for emergency guidance...'
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(userProfileData.language || 'English');
  const [translatedStrings, setTranslatedStrings] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Sync language and trigger translation on mount
  useEffect(() => {
    if (userProfileData.language) {
      setLanguage(userProfileData.language);
    }
  }, [userProfileData.language]);

  const setLanguage = useCallback(async (lang: string) => {
    setLanguageState(lang);

    if (lang === 'English') {
      setTranslatedStrings({});
      return;
    }

    setIsTranslating(true);
    try {
      const separator = '\n=====\n';
      
      // Perform a single concurrent API call for all strings
      const translatedText = await translateText(COMMON_STRINGS.join(separator), lang, 'English');
      
      const results: Record<string, string> = {};
      
      // Split flexibly to account for translation API adding/removing spaces around the separator
      const translatedArray = translatedText.split(/\s*=====\s*/);
      COMMON_STRINGS.forEach((str, idx) => {
        results[str] = translatedArray[idx] ? translatedArray[idx].trim() : str;
      });
      
      setTranslatedStrings(results);
    } catch (error) {
      console.error('Batch translation error:', error);
    }
    setIsTranslating(false);
  }, []);

  // Synchronous translation lookup (uses pre-translated cache)
  const t = useCallback((text: string): string => {
    if (language === 'English') return text;
    return translatedStrings[text] || text;
  }, [language, translatedStrings]);

  // Async translation for dynamic/long text
  const tAsync = useCallback(async (text: string): Promise<string> => {
    if (language === 'English') return text;
    if (translatedStrings[text]) return translatedStrings[text];
    try {
      const result = await translateText(text, language, 'English');
      // Cache it
      setTranslatedStrings((prev) => ({ ...prev, [text]: result }));
      return result;
    } catch {
      return text;
    }
  }, [language, translatedStrings]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tAsync, translatedStrings, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};
