import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type { User, Session } from '@supabase/supabase-js';

export async function syncProfileToSupabase(profile: {
  firstName: string;
  age: number;
  city: string;
  baselinePB?: { level: number; shuttle: number; score: string } | null;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').upsert({
    id: user.id,
    first_name: profile.firstName,
    age: profile.age,
    city: profile.city,
    baseline_pb: profile.baselinePB ?? null,
  });
}

export async function syncResultToSupabase(result: {
  level: number;
  shuttle: number;
  score: string;
  vo2: number;
  isPB?: boolean;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('results').insert({
    user_id: user.id,
    level: result.level,
    shuttle: result.shuttle,
    score: result.score,
    vo2_max: result.vo2,
    is_pb: result.isPB ?? false,
  });
}
