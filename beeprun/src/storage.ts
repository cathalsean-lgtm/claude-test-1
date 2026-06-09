import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'beeprun_results';

export type TestResult = {
  id: string;
  date: string;       // ISO string
  level: number;
  shuttle: number;
  score: string;      // e.g. "12.4"
  vo2: number;
};

export async function saveResult(result: Omit<TestResult, 'id' | 'date'>): Promise<TestResult> {
  const existing = await loadResults();
  const entry: TestResult = {
    ...result,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...existing]));
  return entry;
}

export async function loadResults(): Promise<TestResult[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearResults(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

// ─── User Profile ─────────────────────────────────────────────────────────────

const PROFILE_KEY = 'beeprun_profile';
const ONBOARDING_KEY = 'beeprun_onboarding_done';

export type UserProfile = {
  firstName: string;
  age: number;
  city: string;
  baselinePB?: { level: number; shuttle: number; score: string } | null;
};

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function isOnboardingDone(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
