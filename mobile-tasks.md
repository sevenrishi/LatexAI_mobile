# Tasks — React Native App & Backend Integration

Scope: only the React Native client (built with the **React Native Community CLI / bare workflow**) and its integration with the existing backend API. Backend/AI/compiler service build-out is out of scope for this list.

After completing each task check the respective boxes like this - [x]

---

## Phase 0 — Project Foundation

- [x] MB-0.01 - Scaffold project via `npx @react-native-community/cli@latest init LatexAI` (TypeScript template), set bundle ID/package name, and document native tooling setup (Node 20+, JDK 17, Android SDK, Xcode, CocoaPods)
- [x] MB-0.02 - Configure tooling: ESLint (`@react-native/eslint-config`), Prettier, TypeScript strict mode, path aliases, and Jest + RNTL
- [x] MB-0.03 - Establish folder structure (`src/{app,screens/{auth,onboarding,dashboard,profile,templates,generate,history,settings,system},components/{ui,forms,pdf,feedback},features,lib,store,theme,utils,types,mocks}`)
- [x] MB-0.04 - Install and natively link core dependencies: `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`, and `@react-navigation/*`; run `pod install` and verify builds
- [x] MB-0.05 - Set up theme token system supporting light/dark modes and dynamic status bar styling
- [x] MB-0.06 - Build comprehensive UI kit (Typography, Buttons, TextFields, Chips, Cards, BottomSheets, ConfirmDialogs, Toast, ScoreGauge) adhering to 44x44 pt touch targets and accessibility guidelines
- [x] MB-0.07 - Configure icons (`lucide-react-native`), app icons, adaptive Android icons, and native splash screens via `react-native-bootsplash`
- [x] MB-0.08 - Configure `react-native-config` with environment variables (`.env.development/.staging/.production`) and platform build flavors/schemes
- [x] MB-0.09 - Set up typed navigation skeleton (`RootStackParamList`), `NavigationContainer`, and Android hardware back-button handling
- [x] MB-0.10 - Establish provider hierarchy (`GestureHandlerRootView` -> `SafeAreaProvider` -> `ErrorBoundary` -> `QueryClientProvider` -> `ThemeProvider` -> auth bootstrap -> `NavigationContainer`)
- [x] MB-0.11 - Implement global `ErrorBoundary` and build **S-41** ErrorFallback screen
- [x] MB-0.12 - Configure secure storage wrapper using `react-native-keychain` and a Supabase storage adapter
- [x] MB-0.13 - Initialize Supabase client configured with PKCE flow and AppState session refresh listeners
- [x] MB-0.14 - Build API client wrapper with Bearer token injection, envelope unwrap, typed `ApiError` codes, timeout handling, and 401 refresh interceptors
- [x] MB-0.15 - Configure TanStack Query with persisted cache (`query-async-storage-persister`), `onlineManager` (NetInfo), and `focusManager` (AppState)
- [x] MB-0.16 - Set up Zustand auth and session state stores
- [x] MB-0.17 - Implement mock network layer (`msw/native` or fetch mock) mirroring backend contract fixtures
- [x] MB-0.18 - Set up CI linting, typechecking, Jest tests, and Android/iOS build automation pipelines
- [x] MB-0.19 - Lock portrait orientation for v1 and document the React Native upgrade process

## Phase A — Authentication & Onboarding

- [x] MB-1.01 - Implement core auth gate in `RootNavigator` managing Splash, AuthStack, VerifyEmail, OnboardingStack, and AppTabs states
- [x] MB-1.02 - Register custom URL scheme (`latexai://`) in `Info.plist` and `AndroidManifest.xml` with deep-link listeners for auth callbacks, verification, and password resets
- [x] MB-1.03 - Build **S-01** Splash screen with session check and minimum display duration
- [x] MB-1.04 - Build **S-02** Welcome screen with Google and GitHub OAuth integrations via in-app browser and deep-link code exchanges
- [x] MB-1.05 - Build **S-03** Login screen with validation, error handling, and dev-only demo login support
- [x] MB-1.06 - Build **S-04** Signup screen with strength validation and terms acceptance
- [x] MB-1.07 - Build **S-05** VerifyEmail holding screen with resend cooldowns and foreground auto-advance checks
- [x] MB-1.08 - Build **S-06** ForgotPassword screen with submission state feedback
- [x] MB-1.09 - Build **S-07** ResetPassword screen handling deep-link recovery parameters
- [x] MB-1.10 - Build **S-08 / S-09 / S-10** onboarding wizard screens and wire `POST /auth/onboarding/complete`
- [x] MB-1.11 - Implement complete logout flow clearing keychain tokens, query caches, and resetting navigation stacks
- [x] MB-1.12 - Build `SessionExpiredModal` for unrecoverable 401 responses
- [x] MB-1.13 - Add optional biometric app lock toggle in settings
- [x] MB-1.14 - Write authentication unit and deep-link parsing test suites

## Phase B — Profile (Knowledge Base) Setup

- [x] MB-2.01 - Set up TanStack Query hooks (`useProfile`) and profile section mutation hooks with optimistic updates
- [x] MB-2.02 - Build reusable form components (`MonthYearPickerSheet`, `BulletListEditor`, `ChipInput`, `DraggableList`, and unsaved-changes navigation guards)
- [x] MB-2.03 - Build **S-12** ProfileHome screen featuring completeness rings and section status rows
- [x] MB-2.04 - Build **S-13** ContactInfo form screen with validation and dynamic link management
- [x] MB-2.05 - Build **S-14** Summary text editor screen with character counts
- [x] MB-2.06 - Build **S-15** ExperienceList screen with reordering and swipe-to-delete actions
- [x] MB-2.07 - Build **S-16** ExperienceForm modal editor supporting date bounds and bullet point management
- [x] MB-2.08 - Build **S-17 / S-18** Education list and form screens
- [x] MB-2.09 - Build **S-19** Skills screen grouped by category with chip manipulation and bulk-add capabilities
- [x] MB-2.10 - Build **S-20 / S-21** Certifications list and form screens
- [x] MB-2.11 - Build **S-22 / S-23** Projects list and form screens
- [x] MB-2.12 - Install and configure `@react-native-documents/picker` and build **S-24** ImportResume screen handling multipart FormData uploads and progress states
- [x] MB-2.13 - Build **S-25** ImportReview screen allowing users to verify, toggle, edit, and merge or replace parsed resume draft fields
- [x] MB-2.14 - Write unit tests for profile form validations, optimistic rollbacks, and import flows

## Phase C — Template Setup

- [x] MB-3.01 - Install and natively configure `react-native-pdf` and `react-native-blob-util` for iOS and Android
- [x] MB-3.02 - Build core `PdfViewer` component supporting cached downloads, pinch-to-zoom, and page indicators
- [x] MB-3.03 - Build secure PDF download utility streaming signed URLs to local cache directories
- [x] MB-3.04 - Build **S-40** fullscreen modal `PdfViewer` screen
- [x] MB-3.05 - Build **S-26** Templates screen listing pre-built layouts and action sheets
- [x] MB-3.06 - Build **S-27** TemplatePreview screen featuring sample/profile toggles, compilation previews, and read-only source code inspection
- [x] MB-3.07 - Build `TemplatePickerSheet` component for generation workflow usage
- [x] MB-3.08 - Write template list and preview rendering test cases

## Phase D — Job Input

- [x] MB-4.01 - Build **S-28** NewGeneration screen shell with segmented control for text and URL inputs
- [x] MB-4.02 - Build job URL fetch input, loading states, and fallback warnings redirecting blocked sites to text pasting
- [x] MB-4.03 - Wire job submission to `POST /generate` handling quota errors, incomplete profiles, and duplicate submission prevention
- [x] MB-4.04 - Support generation parameter pre-filling via `fromGenerationId` resume reuse options

## Phase E/F — JD Analysis & Tailoring (Client Integration)

- [x] MB-4.05 - Build `useGenerationStatus(id)` polling hook with background throttling and foreground resume triggers
- [x] MB-4.06 - Build **S-29** GenerationProgress screen with a vertical status stepper, elapsed timer, rotating user tips, and failure recovery cards
- [x] MB-4.07 - Add back-press confirmation sheets for background generations and cancellation controls
- [x] MB-4.08 - Write generation polling and error-handling integration test suites

## Phase I — ATS Score (Client Integration)

- [x] MB-5.01 - Build **S-30** Review screen shell, header menus, and summary strips
- [x] MB-5.02 - Integrate inline `PdfViewer` panels into the Review screen with out-of-date overlay indicators
- [x] MB-5.03 - Build **S-32** AtsReport screen featuring score gauges, coverage bars, matched/missing keyword chips, and profile-add shortcuts
- [x] MB-5.04 - Build Changes tab component displaying AI note summaries and role-based before/after diffs

## Phase J — Review, Download, History

- [x] MB-5.05 - Build **S-31** EditContent screen allowing users to edit summary, experience bullets, skills, and projects with dirty-state checks
- [x] MB-5.06 - Implement re-render request flows following content edits while preserving valid fallback PDFs on compiler errors
- [x] MB-5.07 - Implement cross-platform PDF and `.tex` sharing/saving utilities using native share sheets and Android MediaStore storage
- [x] MB-5.08 - Build job description view tabs and history overflow action sheets
- [x] MB-5.09 - Implement AI version reset actions
- [x] MB-5.10 - Write review, edit, re-render, and download module unit tests
- [x] MB-6.01 - Build **S-11** Dashboard screen using `GET /dashboard/summary` data widgets
- [x] MB-6.02 - Build **S-33** History screen with search bars, filter chips, cursor pagination, infinite scrolling, and swipe actions
- [x] MB-6.03 - Build **S-34** Settings screen with theme switchers, account management shortcuts, and sign-out confirmations
- [x] MB-6.04 - Build **S-35** Account management and **S-36** ChangePassword screens
- [x] MB-6.05 - Build **S-37** DataPrivacy screen supporting data exports and typed account deletion flows
- [x] MB-6.06 - Build **S-38** About screen displaying version metadata and legal links
- [x] MB-6.07 - Implement robust offline caching behaviors and fallback read banners across list screens
- [x] MB-6.08 - Build **S-39** standalone AtsChecker tool screen
- [x] MB-6.09 - Integrate push notifications for background generation completion alerts (FCM/APNs)
- [x] MB-6.10 - Write history filter, settings, and offline-state test cases

## Phase L — Testing & Release

- [ ] MB-7.01 - Conduct accessibility (a11y) audits for VoiceOver, TalkBack, touch targets, and dynamic type text scaling
- [ ] MB-7.02 - Optimize app performance with Hermes, flatlist optimizations, and cold-start budgeting
- [ ] MB-7.03 - Implement security hardening rules (Keychain-only token storage, ProGuard/R8, `allowBackup=false`, deep-link schema validations)
- [ ] MB-7.04 - Configure crash reporting tools (Sentry RN) and conversion funnel analytics
- [ ] MB-7.05 - Build E2E test suites with Maestro or Detox covering full user journeys
- [ ] MB-7.06 - Configure release engineering workflows for Android keystores and iOS signing via Fastlane
- [ ] MB-7.07 - Ensure App Store and Google Play compliance regarding in-app account deletions and privacy label disclosures
- [ ] MB-7.08 - Execute manual physical device QA passes on both iOS and Android handsets
- [ ] MB-7.09 - Distribute internal beta testing builds through TestFlight and Play Console tracks
- [ ] MB-7.10 - Finalize developer documentation, architecture notes, and React Native upgrade guides
