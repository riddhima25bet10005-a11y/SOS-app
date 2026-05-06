# Firebase Setup Guide for SOS! App

## Step 1: Create Firebase Project (5 minutes)

1. Go to **https://console.firebase.google.com/**
2. Click **"Add project"**
3. Name it: `sos-emergency-app`
4. Disable Google Analytics (optional for this app)
5. Click **Create project**

## Step 2: Enable Realtime Database

1. In Firebase Console sidebar → click **"Realtime Database"**
2. Click **"Create Database"**
3. Choose your region (select closest to you)
4. Start in **Test mode** (allows read/write for 30 days)
5. Click **Enable**

## Step 3: Get Your Config

1. In Firebase Console → ⚙️ **Project Settings** (gear icon, top left)
2. Scroll down to **"Your apps"**
3. Click **"<\/>" (Web)** icon to add a web app
4. Register app with name: `sos-web`
5. Copy the `firebaseConfig` object shown — it looks like:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "sos-emergency-app.firebaseapp.com",
  databaseURL: "https://sos-emergency-app-default-rtdb.firebaseio.com",
  projectId: "sos-emergency-app",
  storageBucket: "sos-emergency-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123...:web:abc..."
};
```

## Step 4: Update firebase.ts

Open `utils/firebase.ts` and replace the `firebaseConfig` object with your actual values.

## Step 5: Set Database Rules (for production)

> **Security Note:** This app has been intentionally configured to **bypass authentication** for a frictionless user experience. As a result, the Realtime Database is publicly readable and writable. To prevent basic bot spam while remaining open, use these validation rules instead of auth rules.

In Firebase Console → Realtime Database → **Rules** tab, paste:

```json
{
  "rules": {
    "sos_requests": {
      ".read": true,
      ".write": true,
      "$requestId": {
        ".validate": "newData.hasChildren(['userId', 'userName', 'latitude', 'longitude', 'status', 'timestamp']) && newData.child('userName').isString() && newData.child('userName').val().length < 50"
      }
    },
    "helpers": {
      ".read": true,
      ".write": true,
      "$helperId": {
        ".validate": "newData.hasChildren(['id', 'name', 'phone', 'specialty', 'status'])"
      }
    }
  }
}
```

Click **Publish**.

## Step 6: Enable Phone Authentication & Billing

Because this app uses real SMS verification, you must enable billing on your Firebase project.

1. In Firebase Console, click on **Build** -> **Authentication** in the sidebar.
2. Click **Get Started** and navigate to the **Sign-in method** tab.
3. Click **Add new provider** and select **Phone**.
4. Enable Phone authentication and click **Save**.
5. In the bottom left of the console, click **Upgrade** (next to your current plan, "Spark").
6. Select the **Blaze** (Pay as you go) plan. You will need to link a Google Cloud billing account (requires a credit card).

*Note: If the `firebaseConfig` currently in `utils/firebase.ts` belongs to an automated demo project (`sos-emergency-c2b4e`), you will NOT be able to upgrade its billing. You must first create your own Firebase project (Step 1-4) and put your own config in `utils/firebase.ts` before you can upgrade it.*

---

Once you have upgraded to the Blaze plan and updated `firebase.ts` with your own credentials, the Phone SMS OTP will start working automatically without any further code changes!
