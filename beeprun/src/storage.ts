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
