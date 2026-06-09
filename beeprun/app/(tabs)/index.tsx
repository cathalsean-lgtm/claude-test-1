import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  surface: '#f9f9f9',
  onSurface: '#1a1c1c',
  secondary: '#5e5e5e',
  brandRed: '#FF3B30',
  outlineVariant: '#e7bdb7',
  surfaceContainerHighest: '#e2e2e2',
  surfaceContainerLow: '#f3f3f4',
  surfaceContainer: '#eeeeee',
  white: '#ffffff',
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STORIES = [
  { id: '1', name: 'ALEX', hasActivity: true },
  { id: '2', name: 'SARAH', hasActivity: true },
  { id: '3', name: 'JORDAN', hasActivity: true },
  { id: '4', name: 'MI...', hasActivity: false },
];

const ACTIVITIES = [
  {
    id: '1',
    name: 'Sarah Miller',
    timeAgo: '2H AGO',
    score: '12.4',
    level: 'LEVEL 12, SHUTTLE 4',
    vo2: 'VO2 MAX: 54.2',
    likes: 12,
    comments: 3,
    isPB: true,
  },
  {
    id: '2',
    name: 'Alex Rivera',
    timeAgo: '5H AGO',
    score: '10.8',
    level: 'LEVEL 10, SHUTTLE 8',
    vo2: 'VO2 MAX: 48.5',
    likes: 24,
    comments: 8,
    isPB: false,
  },
  {
    id: '3',
    name: 'Jordan Smith',
    timeAgo: 'YESTERDAY',
    score: '14.1',
    level: 'LEVEL 14, SHUTTLE 1',
    vo2: 'VO2 MAX: 62.3',
    likes: 45,
    comments: 14,
    isPB: false,
  },
];

// ─── Pulsing Story Ring ───────────────────────────────────────────────────────

function PulsingStory({ name }: { name: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={styles.storyItem}>
      <Animated.View style={[styles.storyRingActive, { transform: [{ scale }] }]}>
        <View style={styles.storyAvatar} />
      </Animated.View>
      <Text style={styles.storyLabel}>{name}</Text>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.avatarSmall} />
      <View style={styles.headerCenter}>
        <Text style={styles.headerTimer}>▶</Text>
        <Text style={styles.headerTitle}>BeepRun</Text>
      </View>
      <TouchableOpacity hitSlop={8}>
        <Text style={styles.headerIcon}>⚙</Text>
      </TouchableOpacity>
    </View>
  );
}

function StoryRow() {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storyRow}
      >
        {/* YOU – add button */}
        <View style={styles.storyItem}>
          <View style={styles.storyAddCircle}>
            <Text style={styles.storyAddPlus}>+</Text>
          </View>
          <Text style={styles.storyLabel}>YOU</Text>
        </View>

        {STORIES.map(story =>
          story.hasActivity ? (
            <PulsingStory key={story.id} name={story.name} />
          ) : (
            <View key={story.id} style={styles.storyItem}>
              <View style={styles.storyRingInactive}>
                <View style={styles.storyAvatar} />
              </View>
              <Text style={styles.storyLabel}>{story.name}</Text>
            </View>
          )
        )}
      </ScrollView>
      <View style={styles.hairline} />
    </View>
  );
}

function ActivityCard({ item, isLast }: { item: typeof ACTIVITIES[0]; isLast: boolean }) {
  const scoreColor = item.isPB ? C.brandRed : C.onSurface;

  return (
    <View>
      <View style={styles.card}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardAvatar} />
          <View style={styles.cardMeta}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardTime}>{item.timeAgo}</Text>
          </View>
          <TouchableOpacity hitSlop={8}>
            <Text style={styles.cardMore}>···</Text>
          </TouchableOpacity>
        </View>

        {/* Score block */}
        <View style={styles.cardScoreBlock}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{item.score}</Text>
          <View style={styles.scoreMetaRow}>
            <Text style={styles.scoreMetaText}>{item.level}</Text>
            <View style={styles.scoreMetaDivider} />
            <Text style={styles.scoreMetaText}>{item.vo2}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} hitSlop={8}>
            <Text style={styles.actionIcon}>♡</Text>
            <Text style={styles.actionCount}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} hitSlop={8}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} hitSlop={8}>
            <Text style={styles.actionIcon}>↗</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity hitSlop={8}>
            <Text style={styles.actionIcon}>🔖</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!isLast && <View style={styles.hairline} />}
    </View>
  );
}

function BottomNav() {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navTab}>
        <Text style={[styles.navTabLabel, { color: C.brandRed }]}>HOME</Text>
      </TouchableOpacity>

      {/* Raised RECORD button */}
      <View style={styles.navRecordWrapper}>
        <TouchableOpacity style={styles.navRecordBtn} activeOpacity={0.85}>
          <Text style={styles.navRecordIcon}>▶</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.navTab}>
        <Text style={styles.navTabLabel}>YOU</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyFeed({ name }: { name: string }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyAvatarRow}>
        <View style={styles.emptyAvatar} />
        <View>
          <Text style={styles.emptyName}>{name}</Text>
          <Text style={styles.emptyTime}>NOW</Text>
        </View>
      </View>
      <View style={styles.emptyScoreBlock}>
        <Text style={styles.emptyScoreDash}>—</Text>
        <Text style={styles.emptyScoreLabel}>Run your first test to appear here.</Text>
      </View>
      <View style={styles.emptyArrowRow}>
        <Text style={styles.emptyArrowText}>Tap RECORD to start</Text>
        <Text style={styles.emptyArrow}>↓</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const showEmpty = ACTIVITIES.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.hairline} />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <StoryRow />
        {showEmpty ? (
          <EmptyFeed name="Jake" />
        ) : (
          ACTIVITIES.map((item, index) => (
            <ActivityCard
              key={item.id}
              item={item}
              isLast={index === ACTIVITIES.length - 1}
            />
          ))
        )}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STORY_SIZE = 68;
const AVATAR_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.surface,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.white,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceContainer,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTimer: {
    fontSize: 14,
    color: C.brandRed,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: C.onSurface,
    letterSpacing: -0.22,
  },
  headerIcon: {
    fontSize: 20,
    color: C.secondary,
  },

  // Hairline
  hairline: {
    height: 0.5,
    backgroundColor: C.outlineVariant,
  },

  // Stories
  storyRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    gap: 4,
  },
  storyAddCircle: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderWidth: 1.5,
    borderColor: C.brandRed,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAddPlus: {
    fontSize: 24,
    color: C.brandRed,
    lineHeight: 28,
  },
  storyRingActive: {
    width: STORY_SIZE + 4,
    height: STORY_SIZE + 4,
    borderRadius: (STORY_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: C.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingInactive: {
    width: STORY_SIZE + 4,
    height: STORY_SIZE + 4,
    borderRadius: (STORY_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: C.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: STORY_SIZE - 2,
    height: STORY_SIZE - 2,
    borderRadius: (STORY_SIZE - 2) / 2,
    backgroundColor: C.surfaceContainer,
  },
  storyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.secondary,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },

  // Card
  card: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: C.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.surfaceContainer,
    marginRight: 12,
  },
  cardMeta: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '400',
    color: C.onSurface,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '600',
    color: C.secondary,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  cardMore: {
    fontSize: 18,
    fontWeight: '700',
    color: C.secondary,
    letterSpacing: 2,
  },

  // Score block
  cardScoreBlock: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: C.outlineVariant,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2.56,
    lineHeight: 72,
  },
  scoreMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  scoreMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.secondary,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
  scoreMetaDivider: {
    width: 0.5,
    height: 12,
    backgroundColor: C.outlineVariant,
  },

  // Actions
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 16,
    color: C.secondary,
  },
  actionCount: {
    fontSize: 15,
    color: C.secondary,
  },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: C.outlineVariant,
    backgroundColor: C.white,
    paddingBottom: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  navTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.secondary,
  },
  navRecordWrapper: {
    alignItems: 'center',
    marginTop: -20,
  },
  navRecordBtn: {
    width: 48,
    height: 48,
    backgroundColor: C.brandRed,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRecordIcon: {
    fontSize: 18,
    color: C.white,
  },

  // Empty feed
  emptyCard: {
    margin: 20,
    padding: 20,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    borderRadius: 2,
    backgroundColor: C.surfaceContainerLow,
    gap: 16,
  },
  emptyAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceContainerHighest,
  },
  emptyName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.onSurface,
  },
  emptyTime: {
    fontSize: 10,
    fontWeight: '600',
    color: C.secondary,
    letterSpacing: 0.5,
  },
  emptyScoreBlock: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: C.outlineVariant,
    gap: 8,
  },
  emptyScoreDash: {
    fontSize: 64,
    fontWeight: '700',
    color: C.surfaceContainerHighest,
    letterSpacing: -2,
    lineHeight: 64,
  },
  emptyScoreLabel: {
    fontSize: 13,
    color: C.secondary,
    textAlign: 'center',
  },
  emptyArrowRow: {
    alignItems: 'center',
    gap: 4,
  },
  emptyArrowText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.brandRed,
    letterSpacing: 0.3,
  },
  emptyArrow: {
    fontSize: 24,
    color: C.brandRed,
  },
});
