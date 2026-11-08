# LatexAI Mobile Application

The cross-platform mobile companion for **LatexAI**, built with React Native. Create, edit, and optimize ATS-friendly LaTeX resumes, preview compiled PDFs, and run AI tailoring directly from Android and iOS devices.

---

## ✨ Features

- **Profile & Experience Management**: Manage work experience, education, skills, certifications, and projects on the go with real-time profile completion indicators.
- **Resume Ingestion**: Import existing resumes (.pdf, .docx) using native document pickers (`@react-native-documents/picker`) with AI parsing.
- **AI ATS Checker**: Compare resumes against job descriptions, calculate match percentages, and view actionable suggestions.
- **In-App PDF Viewer**: High-performance PDF previewing, zooming, and sharing (`react-native-pdf`, `react-native-blob-util`).
- **Template Explorer**: Browse and preview ATS-optimized LaTeX templates with instant style switching.
- **Biometrics & Secure Token Storage**: Secure credential handling using `react-native-keychain` and Supabase Auth.
- **Offline Resilience**: Offline query caching and state persistence with `@tanstack/query-async-storage-persister` and `@react-native-async-storage/async-storage`.

---

## 🛠 Tech Stack

- **Framework**: React Native 0.87 (New Architecture enabled), React 19
- **Language**: TypeScript
- **Navigation**: React Navigation v7 (Native Stack & Bottom Tabs)
- **State & Caching**: Zustand, TanStack React Query v5
- **Document & PDF Handling**: `react-native-pdf`, `react-native-blob-util`, `@react-native-documents/picker`
- **Security & Storage**: `react-native-keychain`, `@react-native-async-storage/async-storage`
- **UI & Animations**: `react-native-reanimated`, `react-native-safe-area-context`, `lucide-react-native`, `react-native-svg`
- **Configuration**: `react-native-config`
- **Testing**: Jest, `@testing-library/react-native`

---

## 📁 Directory Structure

```
mobile/
├── android/                 # Android native project and Gradle setup
├── ios/                     # iOS native project and CocoaPods setup
├── src/
│   ├── app/                 # Root navigation structure, tab navigators, and theme providers
│   ├── components/          # Reusable mobile UI widgets (buttons, cards, inputs, sheets)
│   ├── config/              # Environment config loader and app constants
│   ├── features/            # Feature modules (auth, profile, generate, ats, templates)
│   ├── lib/                 # Supabase client, API client, Keychain helpers
│   ├── mocks/               # Mock data for preview and isolated tests
│   ├── screens/             # Screen components organized by flow:
│   │   ├── auth/            # Login, Signup, ForgotPassword, VerifyEmail, Splash
│   │   ├── dashboard/       # Main home dashboard & quick actions
│   │   ├── generate/        # AI resume generation wizard, ATS reports, review
│   │   ├── history/         # Past generation records and saved drafts
│   │   ├── onboarding/      # First-run guided setup flow
│   │   ├── profile/         # Section forms (Experience, Education, Skills, etc.)
│   │   ├── settings/        # Account, Privacy, Password, and Preferences
│   │   ├── templates/       # Template gallery and preview sheets
│   │   └── tools/           # ATS Checker and resume utilities
│   ├── store/               # Zustand state stores (auth, profile, resume, settings)
│   ├── theme/               # Color palettes, typography, spacing tokens
│   ├── types/               # TypeScript models and navigation route param lists
│   └── utils/               # Formatting, file validation, error handlers
├── App.tsx                  # App entry root component
└── index.js                 # React Native registration entrypoint
```

---

## ⚙️ Environment Configuration

Environment files are managed per environment. Copy `.env.example` to `.env.development` or `.env`:

```bash
cp .env.example .env.development
```

| Key | Description | Android Emulator | iOS Simulator / Physical Device |
| :--- | :--- | :--- | :--- |
| `API_BASE_URL` | LatexAI backend API base URL | `http://10.0.2.2:4000/api/v1` | `http://localhost:4000/api/v1` |
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Public Supabase anon key | `your-anon-key` | `your-anon-key` |
| `APP_ENV` | Environment identifier | `development` | `development` |
| `ENABLE_MOCKS` | Enable mock responses | `false` | `false` |
| `SENTRY_DSN` | Crash reporting DSN | Optional | Optional |

> **Note**: Android emulators map host machine's `localhost` to `10.0.2.2`. For physical test devices, use your local network IP (e.g., `http://192.168.1.X:4000/api/v1`).

---

## 🏃 Getting Started

### Prerequisites

- **Node.js**: >= 22.11.0
- **JDK**: Java Development Kit 17
- **Android**: Android Studio, Android SDK Platform 35, Build-Tools, and an Android Virtual Device (AVD)
- **iOS** (macOS only): Xcode 15+ and CocoaPods

### 1. Install Dependencies
```bash
npm install
```

### 2. iOS Setup (macOS only)
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

### 3. Start Metro Bundler
```bash
npm start
```

### 4. Run on Android
Ensure an Android emulator is running or a device is connected via ADB:
```bash
npm run android
```

### 5. Run on iOS (macOS only)
```bash
npm run ios
```

---

## 🧪 Testing & Code Quality

```bash
# Run unit & component tests with Jest
npm test

# Run tests in watch mode
npm test -- --watch

# TypeScript type check
npm run typecheck

# Code linting
npm run lint
```
