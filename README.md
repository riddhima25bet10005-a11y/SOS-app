# 🆘 SOS! — Emergency Response App

A cross-platform emergency response application built with **React Native** and **Expo**, designed to help users quickly reach emergency services, connect with nearby community helpers, and access critical safety resources — all from one app.

---

## ✨ Features

### 🚨 SOS Emergency Button
- **One-tap SOS activation** to instantly alert nearby community helpers
- **Real-time GPS location sharing** so helpers can locate you immediately
- **Emergency call integration** — directly dial local emergency numbers

### 📞 Emergency Numbers Directory
- Comprehensive database of **emergency numbers by country**
- Quick-dial functionality for police, fire, ambulance, and more
- Supports **190+ countries** with region-specific services

### 🤝 Community Helper Network
- **Register as a community helper** to assist people nearby
- **Phone authentication via Firebase OTP** for secure registration
- View and respond to active SOS alerts in your area
- Real-time helper availability tracking

### 🤖 AI Safety Assistant
- Built-in **AI-powered chat assistant** for emergency guidance
- Get step-by-step instructions for various emergency situations
- Available offline with a local AI engine

### 🌍 Multi-Language Support
- Full **internationalization (i18n)** support
- Auto-detect user's preferred language
- Translate emergency content on the fly

### 👤 User Profile & Authentication
- Secure **Firebase Phone Authentication** (OTP-based)
- Persistent user sessions with **AsyncStorage**
- Customizable user profile with personal info and emergency contacts

### 🎨 Theme Support
- **Light & Dark mode** with a global theme system
- Smooth transitions between themes
- Accessible color contrasts for readability

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React Native** | Cross-platform mobile framework |
| **Expo SDK 54** | Development toolchain & native APIs |
| **Expo Router** | File-based navigation |
| **Firebase** | Authentication (Phone/OTP) & Realtime Database |
| **AsyncStorage** | Local data persistence |
| **Expo Location** | GPS & geolocation services |
| **Expo Speech** | Text-to-speech for accessibility |
| **React Native Maps** | Map visualization for helper locations |
| **React Native Reanimated** | Smooth animations |
| **TypeScript** | Type-safe development |

---

## 📁 Project Structure

```
sos-app/
├── app/                        # Screens (Expo Router file-based routing)
│   ├── (tabs)/                 # Tab navigation screens
│   │   ├── SOS!.tsx            # Main SOS emergency screen
│   │   ├── emergency.tsx       # Emergency numbers directory
│   │   ├── helper.tsx          # Community helper dashboard
│   │   ├── profile.tsx         # User profile screen
│   │   └── _layout.tsx         # Tab layout configuration
│   ├── call/[id].tsx           # Dynamic emergency call screen
│   ├── chat/[id].tsx           # AI chat conversation screen
│   ├── ai-assistant.tsx        # AI safety assistant
│   ├── helper-register.tsx     # Helper registration with OTP
│   ├── login.tsx               # User login screen
│   ├── user-info.tsx           # User information form
│   ├── legal.tsx               # Legal / terms of service
│   ├── index.tsx               # App entry / splash screen
│   └── _layout.tsx             # Root layout
├── data/                       # Static data
│   ├── emergencyNumbers.ts     # Emergency numbers by country
│   ├── countryLanguages.ts     # Language mappings per country
│   └── countryExtras.ts        # Additional country metadata
├── utils/                      # Utility modules
│   ├── firebase.ts             # Firebase configuration & helpers
│   ├── auth.ts                 # Authentication utilities
│   ├── aiEngine.ts             # Local AI engine for chat
│   ├── languageContext.tsx      # i18n language context provider
│   ├── theme.tsx               # Global theme (Light/Dark mode)
│   ├── translate.ts            # Translation utilities
│   └── userStore.ts            # User state persistence
├── assets/                     # Images, icons, splash screen
├── app.json                    # Expo configuration
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
├── eas.json                    # EAS Build configuration
├── netlify.toml                # Netlify deployment config
└── FIREBASE_SETUP.md           # Firebase setup guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ installed
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- A **Firebase project** with Phone Authentication enabled

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/riddhima25bet10005-a11y/SOS-app.git
cd SOS-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> See [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md) for detailed Firebase configuration instructions.

4. **Start the development server**

```bash
npx expo start
```

5. **Run on your device**

- Press **`w`** for web
- Press **`a`** for Android
- Press **`i`** for iOS
- Scan the QR code with the **Expo Go** app

---

## 🌐 Deployment

### Web (Netlify)

The project includes a `netlify.toml` for web deployment:

```bash
# Build for web
npx expo export --platform web

# Deploy to Netlify (via CI or manual upload of /dist)
```

### Mobile (EAS Build)

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## 🔒 Security

- Firebase API keys are stored in `.env` (excluded from version control)
- Phone authentication uses Firebase's secure OTP system
- API keys are restricted to authorized domains in Google Cloud Console
- No sensitive data is stored in plain text

---

## 📄 License

This project is private. All rights reserved.

---

## 👩‍💻 Author

**Riddhima** — [@riddhima25bet10005-a11y](https://github.com/riddhima25bet10005-a11y)

---

> Built with ❤️ for community safety
