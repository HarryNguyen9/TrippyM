/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_PUSH_FIREBASE_API_KEY?: string;
  readonly VITE_PUSH_FIREBASE_PROJECT_ID?: string;
  readonly VITE_PUSH_FIREBASE_SENDER_ID?: string;
  readonly VITE_PUSH_FIREBASE_APP_ID?: string;
  readonly VITE_PUSH_VAPID_KEY?: string;
}
