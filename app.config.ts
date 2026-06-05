import type { ExpoConfig, ConfigContext } from 'expo/config';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-qwas.academinctools.pw';

const config: ExpoConfig = {
  name: 'QWAS',
  slug: 'qwas',
  scheme: 'qwas',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',

  ios: {
    bundleIdentifier: 'com.auratechno.qwas',
    icon: './assets/images/icon.png',
    supportsTablet: false,
    requireFullScreen: false,
    infoPlist: {
      UIBackgroundModes: ['voip', 'audio', 'remote-notification'],
      ITSAppUsesNonExemptEncryption: false,
      NSMicrophoneUsageDescription: 'QWAS needs microphone access for voice messages and calls.',
      NSCameraUsageDescription: 'QWAS needs camera access for video messages and video calls.',
      NSPhotoLibraryUsageDescription: 'QWAS needs photo library access to send images.',
      NSPhotoLibraryAddUsageDescription: 'QWAS needs permission to save images to your library.',
      NSContactsUsageDescription: 'QWAS can help you find friends from your contacts.',
      NSLocationWhenInUseUsageDescription: 'QWAS needs your location to share it in chats.',
      NSSupportsLiveActivities: true,
    },
  },

  android: {
    package: 'com.auratechno.qwas',
    icon: './assets/images/icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: '#5e8ee7',
    },
    permissions: [
      'android.permission.INTERNET',
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_CAMERA',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.USE_FULL_SCREEN_INTENT',
      'android.permission.READ_CONTACTS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    ],
    blockedPermissions: [],
    // googleServicesFile: './google-services.json',
  },

  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    ['expo-router', { root: './src/app' }],
    'expo-secure-store',
    'expo-font',
    'expo-web-browser',
    'expo-image',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#5e8ee7',
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        dark: {
          backgroundColor: '#1c1c1e',
        },
      },
    ],
    [
      'expo-notifications',
      {
        color: '#5e8ee7',
        icon: './assets/images/android-icon-foreground.png',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'QWAS needs camera access for video messages and video calls.',
        microphonePermission: 'QWAS needs microphone access for voice messages and calls.',
        recordAudioAndroid: true,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'QWAS needs photo library access to send images.',
        cameraPermission: 'QWAS needs camera access for video messages and video calls.',
      },
    ],
    [
      'expo-document-picker',
      {
        iPadPositionLock: false,
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    apiUrl: API_URL,
    eas: {
      projectId: 'qwas-mobile-app',
    },
  },

  updates: {
    enabled: false,
  },
};

export default config;
