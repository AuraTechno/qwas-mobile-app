# QWAS Mobile

iOS-style messenger app (iOS + Android) built with React Native + Expo SDK 56.

**Backend**: https://github.com/AuraTechno/qwas-mobile-server (Go + Fiber)
**API**: https://api-qwas.academinctools.pw

## Stack

- **Framework**: Expo SDK 56 + React Native 0.85 + React 19.2
- **Routing**: expo-router v3 (file-based, type-safe)
- **State**: Zustand
- **UI**: iOS HIG design system, light/dark, glassmorphism
- **Icons**: lucide-react-native
- **Animations**: react-native-reanimated v3
- **Real-time**: WebSocket (custom manager)
- **Calls**: @stream-io/react-native-webrtc
- **Storage**: expo-secure-store (JWT)
- **Media**: expo-image-picker, expo-av, expo-camera, expo-document-picker
- **Push**: expo-notifications + FCM (Android)
- **Updates**: expo-updates (OTA JS) + custom APK download

## Project structure

```
app/
├── src/
│   ├── app/                    # Routes (expo-router)
│   │   ├── _layout.tsx         # Root: providers, auth gate
│   │   ├── (auth)/             # Auth flow (welcome, login, register)
│   │   ├── (main)/             # Main app (tabs)
│   │   │   ├── chats/          # Chats list + [id] detail
│   │   │   ├── contacts.tsx
│   │   │   ├── calls.tsx
│   │   │   └── settings.tsx
│   │   └── (modals)/           # Modals (new-chat, chat-info)
│   ├── api/                    # API client + WebSocket
│   ├── components/             # GlassCard, Button, TextField, Icon, Avatar
│   ├── constants/              # iOS theme (colors, typography, spacing)
│   ├── hooks/                  # useTheme, useColorScheme
│   ├── store/                  # Zustand stores (auth, ...)
│   └── types/                  # TypeScript interfaces
├── assets/images/              # Paper plane icon + Android adaptive
├── app.config.ts               # Expo config (name, bundle, plugins)
├── eas.json                    # EAS Build profiles
└── scripts/                    # generate-icons.js
```

## Development

### Prerequisites
- Node 22.13+ (tested with 24.15)
- Expo CLI: `npm install -g eas-cli`
- Expo account at https://expo.dev

### Setup
```bash
npm install
```

### Run locally (Expo Go)
```bash
npx expo start
# Scan QR with Expo Go app
```

**Note**: SDK 56 Expo Go is not in App Store. Use `npx expo start --tunnel` + install Expo Go from CLI on Android, or use TestFlight on iOS.

### Build for device
```bash
# Development build (Android APK)
eas build --profile development --platform android

# Production
eas build --profile production --platform android
```

## Configuration

API URL is configured in `app.config.ts`:
```ts
extra: { apiUrl: 'https://api-qwas.academinctools.pw' }
```

Or override via `EXPO_PUBLIC_API_URL` env var.

## App identifiers

- **Name**: QWAS
- **iOS bundle**: com.auratechno.qwas
- **Android package**: com.auratechno.qwas
- **Slug**: qwas
- **Scheme**: qwas://

## License

MIT © AuraTechno
