# LikeMinded Mobile App - Project Guide

## Overview
LikeMinded is a compatibility-based dating/social mobile app built with React Native CLI (no Expo).
Users are matched based on personality traits, interests, and preferences rather than swiping.

## Tech Stack
- **Framework**: React Native 0.84.1 CLI (TypeScript, React 19.2.3) — NO EXPO
- **Navigation**: React Navigation 7 (native-stack + bottom-tabs)
- **Auth**: Supabase Auth (@supabase/supabase-js v2) with AsyncStorage persistence
- **API Client**: Custom fetch-based ApiClient with Bearer token from Supabase session
- **State Management**: Zustand v5 (auth, chat, onboarding stores)
- **Server State**: TanStack Query v5 (caching, refetch, mutations)
- **Animations**: React Native Reanimated 4 (babel plugin in babel.config.js)
- **Storage**: react-native-mmkv v4 (fast key-value storage)
- **Camera/Photos**: react-native-image-picker v8 (launchCamera for KYC, launchImageLibrary for gallery)
- **UI**: Custom design system with react-native-linear-gradient, custom components
- **Forms**: react-hook-form + zod (available but screens use manual state)

## Project Structure
```
src/
├── app/App.tsx              # Root: GestureHandler > SafeArea > QueryClient > Navigation > RootNavigator
├── config/env.ts            # Environment config (Supabase URL, API URL, ReCAPTCHA)
├── navigation/
│   ├── RootNavigator.tsx    # Auth flow: checks session > loads profile > routes to Auth/Onboarding/Main
│   ├── AuthStack.tsx        # Welcome → Login → Register
│   ├── OnboardingStack.tsx  # AgeGender → Location → Preferences
│   ├── MainTabs.tsx         # Bottom tabs: Matches / Assessment / Profile
│   ├── MatchesStack.tsx     # MatchesHome → Conversation → MatchPhotos
│   ├── AssessmentStack.tsx  # AssessmentHome → Chatbot
│   └── ProfileStack.tsx     # ProfileHome → Interests / Gallery / Preferences / Verification / DeleteAccount
├── screens/
│   ├── auth/                # WelcomeScreen, LoginScreen, RegisterScreen
│   ├── onboarding/          # OnboardingAgeGender, OnboardingLocation, OnboardingPreferences
│   ├── matches/             # MatchesHomeScreen, ConversationScreen, MatchPhotosScreen
│   ├── assessment/          # AssessmentHomeScreen, ChatbotScreen
│   └── profile/             # ProfileHomeScreen, InterestsScreen, GalleryScreen, PreferencesScreen, VerificationScreen, DeleteAccountScreen
├── components/ui/           # GradientButton, Input, Card, Chip, Badge, Avatar, ProgressBar, LoadingSpinner, EmptyState, Button
├── services/
│   ├── api.ts               # ApiClient class (fetch-based, auto Bearer token from Supabase)
│   ├── supabase.ts          # Supabase client with AsyncStorage auth persistence
│   ├── auth.ts              # signUp({email,password,fullName}), signIn({email,password}), signOut, getSession, resetPassword, onAuthStateChange
│   ├── profile.ts           # getMe, deleteMe, ping, completeOnboarding, updatePreferences, updateWeights, getCountries, getCities
│   ├── conversations.ts     # list, getMessages, sendMessage, markRead, endConversation, getFeedbackStatus, submitFeedback, getPhotos
│   ├── matching.ts          # getStatus, generate, generateMatch
│   ├── interests.ts         # getMyInterests, getAllInterests, updateMyInterests
│   ├── photos.ts            # getMyPhotos, uploadGalleryPhoto, deleteGalleryPhoto, getConversationPhotos, uploadVerificationPhoto
│   ├── kyc.ts               # getStatus, upload(string[] | {uri,name}[]), cancel
│   ├── assessment.ts        # start, sendMessage, getHistory, getTraits
│   ├── reports.ts           # create(ReportIn)
│   └── events.ts            # track events
├── stores/
│   ├── authStore.ts         # isAuthenticated, isLoading, profile, needsOnboarding, setOnboarded, logout
│   ├── chatStore.ts         # messages, isConnected, setMessages, addMessage, clear
│   └── onboardingStore.ts   # age, gender, locationId, country(Lebanon), preferences, reset
├── hooks/                   # Custom React hooks (extensible)
├── theme/
│   ├── colors.ts            # Full color palette (primary, secondary, gradient, semantic, chat, tab colors)
│   ├── typography.ts        # Apple HIG scale: largeTitle(34) → caption2(11)
│   ├── spacing.ts           # xxs(2) → 5xl(64), borderRadius, MIN_TOUCH_TARGET=44
│   └── index.ts             # Re-exports + shadow presets (sm/md/lg/xl)
├── types/
│   ├── api.ts               # All TypeScript interfaces matching swagger schemas
│   └── navigation.ts        # Navigation param types for all stacks
└── utils/
    └── formatters.ts        # timeAgo, formatRelativeTime, formatMessageTime, formatChatDate, formatCompatibility, truncateText
```

## Entry Point
- `index.js` → `src/app/App.tsx`

## Backend API
- FastAPI backend with Supabase (PostgreSQL)
- Base URL configured in `src/config/env.ts`
- Auth via Supabase Auth → Bearer token in Authorization header (auto-attached by ApiClient)
- Swagger spec at: `../backendEndpoints/backendSwagger.json`
- **Lebanon is the only supported country** (hardcoded in onboarding)

### Key API Endpoints
- Auth: Supabase client-side (signUp, signInWithPassword)
- Profile: GET/DELETE /me, POST /me/ping, PUT /me/onboarding, PUT /me/preferences, PUT /me/weights
- Interests: GET/PUT /me/interests, GET /me/interests/all
- Locations: GET /me/locations/countries, GET /me/locations/cities?country=
- Photos: POST /me/photos/gallery (FormData with position), DELETE /me/photos/gallery/{position}, GET /me/photos
- KYC: GET /me/kyc/status, POST /me/kyc/upload (3 images as FormData 'files'), DELETE /me/kyc/cancel
- Matching: GET /matching/status, POST /matching/generate
- Conversations: GET /conversations, GET/POST /conversations/{cid}/messages, POST /conversations/{cid}/read, POST /conversations/{cid}/end
- Match Feedback: GET /conversations/{cid}/match-feedback/status, POST /conversations/{cid}/match-feedback
- Conversation Photos: GET /conversations/{cid}/photos (unlocked after mutual positive feedback)
- Assessment: POST /assessment/start, POST /chatbot/message, GET /chatbot/history
- Traits: GET /traits
- Reports: POST /reports
- Events: POST /events

## Design System
### Brand Colors (from logo gradient)
- Primary: #FF6B8A (coral pink)
- Secondary: #8B5CF6 (purple)
- Gradient: #FF6B8A → #8B5CF6
- Defined in `src/theme/colors.ts`

### Typography
- Follows Apple HIG text styles (largeTitle 34px through caption2 11px)
- Defined in `src/theme/typography.ts`

### UI Components
- **GradientButton**: variant('filled'|'outline'), size('small'|'sm'|'md'|'lg'|'large'), loading, disabled
- **Input**: label, error, isPassword (toggle visibility), containerStyle, rightIcon
- **Card**: children, style, elevated (shadow)
- **Chip**: label, selected (gradient when selected), onPress
- **Badge**: label/text, variant('success'|'warning'|'error'|'info'|'default'), style
- **Avatar**: name (shows initials), size, gradient background
- **ProgressBar**: progress(0-1), height, gradient fill
- **LoadingSpinner**: message, fullScreen

## Navigation Flow
```
Root (Stack, no headers, fade animation)
├── Auth (Stack, no headers, slide_from_right)
│   ├── Welcome (gradient background, logo, Create Account + Sign In)
│   ├── Login (email/password form)
│   └── Register (3-step: Name → Email → Password)
├── Onboarding (Stack, no headers, slide_from_right)
│   ├── OnboardingAgeGender (age input + gender cards)
│   ├── OnboardingLocation (country=Lebanon, searchable city list)
│   └── OnboardingPreferences (age range, gender pref, distance → completeOnboarding API)
└── Main (Bottom Tabs: emoji icons)
    ├── MatchesTab (Stack)
    │   ├── MatchesHome (locked state with 4 requirement cards OR find-match + conversation list)
    │   ├── Conversation (real-time chat with 3s polling, feedback banner, report flow)
    │   └── MatchPhotos (unlocked photos after mutual positive feedback)
    ├── AssessmentTab (Stack)
    │   ├── AssessmentHome (status card, how-it-works, start/continue button)
    │   └── Chatbot (MCQ chat interface with options, custom input for "Other")
    └── ProfileTab (Stack)
        ├── ProfileHome (avatar, menu items, personality trait bars, sign out, delete account)
        ├── Interests (category tabs, search, chip grid, save)
        ├── Gallery (3 photo slots, upload from library, delete with confirmation)
        ├── Preferences (age range, gender, distance, personality/interests weight slider)
        ├── Verification (KYC: camera-only capture of ID front/back + selfie, submit for review)
        └── DeleteAccount (warning, type "DELETE" to confirm)
```

## Key Business Logic
1. **Auth flow**: RootNavigator checks Supabase session → loads profile → routes based on isAuthenticated + needsOnboarding
2. **Matching is locked** until: verified + assessment complete + 1+ interests + 3 photos (checked in MatchesHomeScreen)
3. **Photo unlock**: After match, chat for 24h → feedback prompt → both answer "yes" → photos_unlocked=true → navigate to MatchPhotos
4. **Assessment**: Chatbot-based MCQ with options, "Other" shows custom text input, start/sendMessage/getHistory API
5. **KYC verification**: Camera-only (launchCamera, NOT launchImageLibrary) → 3 photos (ID front, back, selfie) → admin reviews
6. **Delete account**: Type "DELETE" to confirm, calls profileService.deleteMe()
7. **Real-time messaging**: Uses polling (3s interval via setInterval + refetch); upgrade to Supabase Realtime later
8. **Onboarding**: 3 steps → calls profileService.completeOnboarding(OnboardingIn) → sets profile + setOnboarded(true) → routes to Main

## Apple App Store Compliance
- Age rating: 17+
- Age gate: 18+ enforced in OnboardingAgeGender (min age validation)
- Account deletion: Required by Apple — implemented in DeleteAccountScreen
- Camera usage: NSCameraUsageDescription added to Info.plist
- Photo library usage: NSPhotoLibraryUsageDescription added to Info.plist
- Push notification permission flow (to be added with Firebase)
- Privacy policy link (to be added in app settings)
- No web-view wrapping — pure native components
- Safe area handling via react-native-safe-area-context
- Portrait-only on iPhone, all orientations on iPad

## Apple Human Interface Guidelines (HIG) — Essential Rules

### MUST-HAVE (Rejection Risk)
- **Account deletion**: Must be discoverable and easy to complete (Apple Review 5.1.1(v))
- **Safe Areas**: All content must respect top (notch/Dynamic Island), bottom (home indicator), and side insets
- **Touch targets**: Minimum 44x44pt for all interactive elements (Apple HIG standard)
- **Privacy permissions**: Clear purpose strings for Camera, Photo Library, Location, Notifications
- **No web-view wrapping**: App must provide native-quality experience, not a wrapped website
- **No misleading UI**: Buttons must look tappable, disabled states must be visually distinct
- **Accessibility basics**: VoiceOver labels on all interactive elements, sufficient contrast (4.5:1 for text)

### Navigation (Apple HIG)
- **Tab bars**: 3-5 tabs max, use SF Symbols or vector icons (NOT emojis), labels required under icons
- **Tab bar height**: iOS standard — bar height + safe area bottom inset (handled by React Navigation)
- **Navigation bars**: Use large titles for root screens, standard titles for pushed screens
- **Back navigation**: Always provide a back button; never trap the user on a screen
- **Swipe-to-go-back**: Must work on all pushed screens (native-stack handles this automatically)
- **Modals**: Use sheets for non-blocking content; full-screen modals for focused tasks

### Typography (Apple HIG)
- **System font**: Use platform system font (SF Pro on iOS, Roboto on Android) — never hardcode SF Pro
- **Dynamic Type scale**: largeTitle(34), title1(28), title2(22), title3(20), headline(17 semibold), body(17), callout(16), subhead(15), footnote(13), caption1(12), caption2(11)
- **Large titles**: Use for top-level/root screens (34pt bold), transition to inline on scroll
- **Minimum readable size**: 11pt (caption2) — never go below this
- **Text hierarchy**: Clear visual distinction between heading, body, and caption levels

### Color & Contrast (Apple HIG)
- **Minimum contrast**: 4.5:1 for normal text, 3:1 for large text (18pt+) and UI elements
- **Don't use color alone**: Always pair color with icons, text, or shapes to convey meaning
- **System colors**: Use semantic colors that adapt to light/dark mode when possible
- **Tint color**: One primary tint color for interactive elements (buttons, links, tab bar active)
- **Backgrounds**: Use layered backgrounds (primary, secondary, tertiary) for depth hierarchy

### Layout & Spacing (Apple HIG)
- **Standard margins**: 16pt horizontal margins for content (20pt on larger displays)
- **Grouped content**: Use inset grouped style for settings/preferences (rounded cards with margins)
- **Consistent spacing**: Use an 8pt grid system (4/8/12/16/20/24/32/48/64)
- **Scroll content**: Add bottom padding so content isn't hidden behind tab bar or home indicator
- **Keyboard avoidance**: All forms must handle keyboard appearance without obscuring inputs

### Components (Apple HIG)
- **Buttons**: Use filled style for primary actions, tinted/bordered for secondary, plain for tertiary
- **Text fields**: Show labels above inputs (not just placeholder text), show clear button, proper keyboard types
- **Lists/Tables**: Use standard list row height (44pt minimum), separators between rows, chevron for drill-down
- **Alerts**: Use native Alert API for critical actions; in-app banners for non-blocking feedback
- **Action sheets**: Use for presenting 2+ related actions from a button/long-press
- **Progress indicators**: Use determinate (bar) when progress is known, indeterminate (spinner) otherwise

### Interaction (Apple HIG)
- **Feedback**: Every tap must produce visible feedback (opacity change, highlight, ripple)
- **Loading states**: Show activity indicator or skeleton screens for async operations
- **Error handling**: Show clear, actionable error messages near the point of failure
- **Destructive actions**: Always confirm with alert before irreversible operations (delete, end conversation)
- **Pull to refresh**: Support on scrollable lists that fetch remote data
- **Haptic feedback**: Use for significant moments (success, error, selection changes)

### Accessibility (Apple HIG — Required)
- **VoiceOver**: All interactive elements need accessibilityLabel
- **Accessibility roles**: Set accessibilityRole on interactive elements (button, link, header, etc.)
- **Focus order**: Must match visual reading order (left-to-right, top-to-bottom)
- **Reduced motion**: Respect prefers-reduced-motion for all animations
- **Dynamic Type**: Layouts should not break at larger text sizes
- **Color independence**: Never rely solely on color to convey information

### App Store Review Guidelines (Key Points)
- **4.0 Design**: App must feel native, well-designed, not a thin wrapper around web content
- **4.1 Copycats**: Must provide unique value, not clone another app's UI wholesale
- **4.2 Minimum Functionality**: Must provide enough content and features to be useful
- **5.1.1(v) Account Deletion**: Must offer in-app account deletion flow
- **5.1.2 Data Use and Sharing**: Must accurately describe data usage in App Store privacy labels
- **2.1 App Completeness**: No placeholder content, broken links, or unfinished features in release builds

## Android Configuration
- Camera permission: android.permission.CAMERA in AndroidManifest.xml
- Storage permissions: READ_MEDIA_IMAGES (API 33+), READ_EXTERNAL_STORAGE (API 32-), WRITE_EXTERNAL_STORAGE (API 28-)

## Configuration Before Building
Update `src/config/env.ts` with:
- SUPABASE_URL (your Supabase project URL)
- SUPABASE_ANON_KEY (your Supabase anon/public key)
- API_BASE_URL (your FastAPI backend URL)
- RECAPTCHA_SITE_KEY (for auth screens, placeholder for now)

## Running the App
```bash
# Install dependencies
npm install

# iOS (requires macOS + Xcode)
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

## Linter Behavior
- Project has a linter that auto-formats files on save
- Colors file was reformatted to use `gradient: { start, end }` instead of `gradientStart/End`
- Typography was reformatted to single-line objects
- Accept linter changes, don't revert them

## Known Limitations / Future Work
- Push notifications: Firebase messaging not yet configured
- ReCAPTCHA: Client integration placeholder (add to auth screens)
- WebSocket: Currently using HTTP polling; can upgrade to Supabase Realtime channels
- Dark mode: Theme infrastructure exists but dark colors not yet defined
- Delete account: Backend endpoint may not fully work yet
- Image caching: Can add react-native-fast-image when peer dep issue resolved
- Haptic feedback: Not yet implemented on key interactions
- Skeleton loading animations: Not yet implemented
- Snake_case API response mapping: Backend returns snake_case, ConversationOut uses camelCase — may need a response transformer if API doesn't return camelCase
