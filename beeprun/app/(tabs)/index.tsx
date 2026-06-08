import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, typography, spacing, radius, borders } from '../../src/theme';

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
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar() {
  return (
    <View style={styles.navBar}>
      <View style={styles.navLogo}>
        <View style={styles.navLogoCircle} />
        <Text style={styles.navLogoText}>BeepRun</Text>
      </View>
      <TouchableOpacity hitSlop={8}>
        <Text style={styles.navGear}>⚙</Text>
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
        {/* YOU button */}
        <View style={styles.storyItem}>
          <View style={styles.storyAddCircle}>
            <Text style={styles.storyAddPlus}>+</Text>
          </View>
          <Text style={styles.storyLabel}>YOU</Text>
        </View>

        {STORIES.map(story => (
          <View key={story.id} style={styles.storyItem}>
            <View style={[styles.storyRing, story.hasActivity && styles.storyRingActive]}>
              <View style={styles.storyAvatar} />
            </View>
            <Text style={styles.storyLabel}>{story.name}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.hairline} />
    </View>
  );
}

function ActivityCard({ item, isLast }: { item: typeof ACTIVITIES[0]; isLast: boolean }) {
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
          <TouchableOpacity hitSlop={8} style={{ marginLeft: spacing.sm }}>
            <Text style={styles.cardBookmark}>⊡</Text>
          </TouchableOpacity>
        </View>

        {/* Score block */}
        <View style={styles.cardScore}>
          <Text style={styles.scoreNumber}>{item.score}</Text>
          <View style={styles.scoreMeta}>
            <Text style={styles.scoreLevel}>{item.level}</Text>
            <Text style={styles.scoreVo2}>{item.vo2}</Text>
          </View>
        </View>

        {/* Action row */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} hitSlop={8}>
            <Text style={styles.actionIcon}>♡</Text>
            <Text style={styles.actionCount}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} hitSlop={8}>
            <Text style={styles.actionIcon}>◯</Text>
            <Text style={styles.actionCount}>{item.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} hitSlop={8}>
            <Text style={styles.actionIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!isLast && <View style={styles.hairline} />}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <NavBar />
      <View style={styles.hairline} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <StoryRow />
        {ACTIVITIES.map((item, index) => (
          <ActivityCard
            key={item.id}
            item={item}
            isLast={index === ACTIVITIES.length - 1}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 42;
const STORY_SIZE = 60;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.white,
  },
  navLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  navLogoText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  navGear: {
    fontSize: 20,
    color: colors.textSecondary,
  },

  // Stories
  storyRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md - 4,
  },
  storyItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  storyAddCircle: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAddPlus: {
    fontSize: 24,
    color: colors.accent,
    lineHeight: 28,
  },
  storyRing: {
    width: STORY_SIZE + 4,
    height: STORY_SIZE + 4,
    borderRadius: (STORY_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingActive: {
    borderColor: colors.accent,
  },
  storyAvatar: {
    width: STORY_SIZE - 2,
    height: STORY_SIZE - 2,
    borderRadius: (STORY_SIZE - 2) / 2,
    backgroundColor: colors.tile,
  },
  storyLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },

  // Hairline divider
  hairline: {
    height: borders.hairline,
    backgroundColor: borders.color,
  },

  // Activity card
  card: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.tile,
    marginRight: spacing.sm,
  },
  cardMeta: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  cardMore: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  cardBookmark: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Score
  cardScore: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  scoreNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -1,
    lineHeight: 56,
  },
  scoreMeta: {
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  scoreLevel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  scoreVo2: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Actions
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  actionCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
