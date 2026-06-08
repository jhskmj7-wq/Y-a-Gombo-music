# AFRIGOMBO — GUIDE OFFICIEL DE MIGRATION VERS CAPACITOR 🚀

Ce document formalise la **Décision Technique Officielle** d'abandonner AppsGeyser au profit de **Capacitor** (une seule base de code pour le Web officiel et l'application Android native).

---

## 🏆 POURQUOI CAPACITOR ?

*   **Google SSO / Facebook SSO natifs** : Plus de blocages de Webviews ou redirections Google complexes.
*   **Performance Élite** : Temps de chargement ultra-rapides, intégration directe avec le moteur Webview système Android modern.
*   **FCM (Firebase Cloud Messaging)** : Support officiel des notifications Push en tâche de fond (foreground et background).
*   **Base de code unique** : Permet de compiler directement le code React + Vite vers l'APK final sans toucher à Flutter ou réécrire de logique.

---

## 🛠️ GUIDE DE MISE EN PLACE DE L'ENVIRONNEMENT

### 1. Installation des dépendances Capacitor au sein d'AFRIGOMBO

Exécutez dans le dossier racine de votre application Web :

```bash
# Installer le noyau Capacitor et l'interface de commande (CLI)
npm install @capacitor/core
npm install -D @capacitor/cli

# Installer la plateforme Android
npm install @capacitor/android

# Installer les plug-ins natifs essentiels (Auth & Push)
npm install @capacitor-firebase/authentication
npm install @capacitor/push-notifications
npm install @capacitor/share
```

### 2. Initialisation de Capacitor

Créez le fichier de configuration `capacitor.config.ts` :

```bash
npx cap init afrigombo com.afrigombo.app --web-dir=dist
```

### 3. Ajouter la plateforme Android native

```bash
npx cap add android
```

---

## ⚙️ CONFIGURATION DES SERVICES SUPPORTS APPS

### A. GOOGLE LOGIN NATIF (ANDROID)

Le plugin utiliser {@capacitor-firebase/authentication} s'occupe de la communication avec l'API Google Play Services.

1.  Générer l'empreinte SHA-1 de votre clé de production/débougale Android.
2.  Ajouter l'empreinte SHA-1 dans votre console **Firebase > Paramètres du projet > Applications Android**.
3.  Télécharger le fichier mis à jour `google-services.json` et le placer dans `android/app/`.
4.  Dans `capacitor.config.ts`, configurer l'ID client Google :

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.afrigombo.app',
  appName: 'AFRIGOMBO',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      providers: ['google.com', 'facebook.com'],
      skipNativeAuth: false,
    }
  }
};

export default config;
```

---

### B. CONFIGURATION DE DEEP LINKING ET APP LINKS (RETOUR AUTOMATIQUE)

Pour que Google Chrome ou l'onglet personnalisé Chrome renvoie spontanément l'artiste vers l'application AFRIGOMBO après une authentification réussie, configurez le protocole de schéma natif dans votre fichier Android officiel :

#### 1. Configuration dans `AndroidManifest.xml` (situé dans `android/app/src/main/AndroidManifest.xml`)

Ajoutez cet `intent-filter` à l'intérieur de la balise `<activity>` principale de votre application :

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <!-- Option 1: Protocole d'URL personnalisé (Recommandé pour un retour instantané et robuste) -->
    <data android:scheme="afrigombo" android:host="redirect" />
</intent-filter>

<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <!-- Option 2: App Links officiels (Vérifiés par domaine sécurisé de production) -->
    <data android:scheme="https" android:host="afrigombo.com" android:pathPrefix="/redirect" />
    <data android:scheme="https" android:host="ais-pre-ft4dcfebiheopao5youqan-162624868358.europe-west3.run.app" android:pathPrefix="/redirect" />
</intent-filter>
```

#### 2. Fonctionnement de l'interbancaire de connexion automatique

1. Lorsque l'application ouvre Chrome, elle transmet un jeton unique et sécurisé `transferId`.
2. Chrome procède à l'authentification sécurisée de l'utilisateur avec Google ou Facebook.
3. À la validation, la passerelle web appelle :
   `afrigombo://redirect?transferId=goog_trans_xxx` ou `https://afrigombo.com/redirect?transferId=goog_trans_xxx`.
4. L'OS Android réactive immédiatement l'application native AFRIGOMBO.
5. Grâce à l'écouteur `window.onGomboDeepLinkReceived` ou au listener de deep links de Capacitor pré-codé dans `/src/App.tsx`, l'application récupère la session Firestore, authentifie l'utilisateur via Firebase de façon native, puis affiche le dashboard immédiatement.

---

## 📣 NOTIFICATIONS PUSH (FIREBASE CLOUD MESSAGING - FCM)

La gestion des notifications est pré-câblée dans notre code source React au démarrage à travers `AuthContext.tsx` et `src/lib/capacitor-adapter.ts`.

### 1. Structure du Token FCM
Lorsqu'un artiste ou client se connecte à l'application native sous Capacitor, le jeton FCM de l'appareil est généré et stocké dans Firestore sous :
`users/{uid}/fcmDeviceToken`

### 2. Permissions Système
L'application demandera automatiquement l'accès au démarrage ou à la connexion sans interrompre la navigation grâce à notre wrapper asynchrone non-bloquant.

---

## 🔄 COMMANDES DE CYCLE DE DÉVELOPPEMENT QUOTIDIEN

Chaque fois que vous modifiez l'interface visuelle d'AFRIGOMBO et souhaitez la tester sur votre téléphone Android :

```bash
# 1. Compiler l'application React
npm run build

# 2. Copier les ressources statiques compilées vers le dossier Android Studio
npx cap sync

# 3. Ouvrir ou démarrer Android Studio pour générer l'APK ou lancer l'émulateur
npx cap open android
```

---

## 🌟 ÉTAPES DE SÉCURISATION AVANT LE GO-LIVE (PLAY STORE)

1.  **Clé de signature APK** : Générer via le menu de clé standard d'Android Studio.
2.  **Mise à jour des règles Firestore (`firestore.rules`)** : Autoriser la mise à jour asynchrone de `fcmDeviceToken` et `isNativePushEnabled` de l'utilisateur par lui-même.
3.  **Permissions Manifest (`AndroidManifest.xml`)** : S'assurer que la permission Internet est bien présente (par défaut avec Capacitor).

---

*L'architecture d'AFRIGOMBO est désormais modernisée, propre, sécurisée, et 100% compatible Android officiel sans dépendances obsolètes !*
