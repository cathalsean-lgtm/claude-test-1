import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../src/supabase';

const C = {
  surface: '#f9f9f9',
  onSurface: '#1a1c1c',
  secondary: '#5e5e5e',
  brandRed: '#FF3B30',
  outlineVariant: '#e7bdb7',
  surfaceContainerLow: '#f3f3f4',
  surfaceContainer: '#eeeeee',
  surfaceContainerHighest: '#e2e2e2',
  white: '#ffffff',
};

type Profile = {
  id: string;
  first_name: string;
  city: string | null;
  baseline_pb: { level: number; shuttle: number; score: string } | null;
};

type Result = {
  id: string;
  level: number;
  shuttle: number;
  score: string;
  vo2_max: number;
  recorded_at: string;
  is_pb: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function timeAgoLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return 'JUST NOW';
  if (h < 24) return `${h}H AGO`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'YESTERDAY';
  return `${d}D AGO`;
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setCurrentUserId(user?.id ?? null);

      const [profileRes, resultsRes, followRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase
          .from('results')
          .select('*')
          .eq('user_id', id)
          .order('recorded_at', { ascending: false })
          .limit(20),
        user
          ? supabase
              .from('follows')
              .select('follower_id')
              .eq('follower_id', user.id)
              .eq('following_id', id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (!active) return;
      setProfile(profileRes.data);
      setResults(resultsRes.data ?? []);
      setFollowing(!!followRes.data);
      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, [id]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !id) return;
    const wasFollowing = following;

    // Optimistic update
    setFollowing(!wasFollowing);

    if (wasFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', id);
      if (error) setFollowing(true); // revert
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: id });
      if (error) setFollowing(false); // revert
    }
  }, [currentUserId, id, following]);

  const pb = results.reduce<Result | null>((best, r) => {
    if (!best) return r;
    return parseFloat(r.score) > parseFloat(best.score) ? r : best;
  }, null);

  const isOwnProfile = currentUserId === id;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} color={C.brandRed} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.emptyText}>Profile not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatar} />
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{profile.first_name}</Text>
            {profile.city ? <Text style={styles.profileCity}>{profile.city.toUpperCase()}</Text> : null}
          </View>
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followBtnActive]}
              onPress={toggleFollow}
              activeOpacity={0.85}
            >
              <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.hairline} />

        {/* PB stat */}
        {pb && (
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{pb.score}</Text>
              <Text style={styles.statLabel}>PERSONAL BEST</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{`${pb.level}.${pb.shuttle}`}</Text>
              <Text style={styles.statLabel}>LEVEL · SHUTTLE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Number(pb.vo2_max).toFixed(1)}</Text>
              <Text style={styles.statLabel}>VO₂ MAX</Text>
            </View>
          </View>
        )}

        <View style={styles.hairline} />

        {/* Results list */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT RESULTS</Text>
          {results.length === 0 ? (
            <Text style={styles.emptyText}>No results yet.</Text>
          ) : (
            results.map(r => (
              <View key={r.id} style={styles.resultRow}>
                <View>
                  <Text style={styles.resultScore}>{r.score}</Text>
                  <Text style={styles.resultMeta}>
                    LEVEL {r.level} · SHUTTLE {r.shuttle} · VO₂ {Number(r.vo2_max).toFixed(1)}
                  </Text>
                </View>
                <View style={styles.resultRight}>
                  <Text style={styles.resultDate}>{formatDate(r.recorded_at)}</Text>
                  {r.is_pb && <Text style={styles.pbBadge}>PB</Text>}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 64;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.surface },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 0.5,
    borderBottomColor: C.outlineVariant,
  },
  backBtn: {
    fontSize: 15,
    fontWeight: '600',
    color: C.brandRed,
  },
  hairline: { height: 0.5, backgroundColor: C.outlineVariant },

  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: C.white,
    gap: 14,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.surfaceContainer,
  },
  profileMeta: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: C.onSurface },
  profileCity: { fontSize: 12, fontWeight: '600', color: C.secondary, letterSpacing: 0.5, marginTop: 2 },

  followBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: C.brandRed,
  },
  followBtnActive: {
    backgroundColor: C.brandRed,
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.brandRed,
    letterSpacing: 0.3,
  },
  followBtnTextActive: {
    color: C.white,
  },

  statRow: {
    flexDirection: 'row',
    backgroundColor: C.white,
    paddingVertical: 20,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '700', color: C.onSurface, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '600', color: C.secondary, letterSpacing: 0.6, marginTop: 4 },
  statDivider: { width: 0.5, backgroundColor: C.outlineVariant, marginVertical: 4 },

  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.secondary, letterSpacing: 0.8, marginBottom: 12 },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.outlineVariant,
  },
  resultScore: { fontSize: 22, fontWeight: '700', color: C.onSurface, letterSpacing: -0.5 },
  resultMeta: { fontSize: 11, fontWeight: '600', color: C.secondary, letterSpacing: 0.4, marginTop: 2 },
  resultRight: { alignItems: 'flex-end', gap: 4 },
  resultDate: { fontSize: 12, fontWeight: '600', color: C.secondary, letterSpacing: 0.3 },
  pbBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: C.brandRed,
    borderWidth: 1,
    borderColor: C.brandRed,
    paddingHorizontal: 6,
    paddingVertical: 1,
    letterSpacing: 0.5,
  },
  emptyText: { fontSize: 14, color: C.secondary, textAlign: 'center', marginTop: 40 },
});
