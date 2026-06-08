import { ScrollView, View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, borders, typography } from '../../src/theme';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PROFILE = {
  name: 'Sean Donnelly',
  age: 28,
  handle: '@seandonnelly',
  testsCompleted: 14,
  bestScore: '12.4',
  bestVO2: 54.2,
  bestLevel: 12,
  bestShuttle: 4,
};

const HISTORY = [
  { date: 'JAN 8', score: '8.2', level: 8, shuttle: 2, vo2: 41.3 },
  { date: 'JAN 22', score: '9.1', level: 9, shuttle: 1, vo2: 44.1 },
  { date: 'FEB 5', score: '9.8', level: 9, shuttle: 8, vo2: 46.0 },
  { date: 'FEB 19', score: '10.4', level: 10, shuttle: 4, vo2: 47.8 },
  { date: 'MAR 4', score: '11.1', level: 11, shuttle: 1, vo2: 49.9 },
  { date: 'MAR 18', score: '11.8', level: 11, shuttle: 8, vo2: 51.6 },
  { date: 'APR 1', score: '12.4', level: 12, shuttle: 4, vo2: 54.2 },
];

// Calendar heatmap: last 12 weeks × 7 days
// 0 = no test, 1 = low, 2 = med, 3 = high
const HEATMAP: number[][] = [
  [0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.md * 2;

function fitnessCategory(vo2: number): string {
  if (vo2 >= 55) return 'SUPERIOR';
  if (vo2 >= 48) return 'EXCELLENT';
  if (vo2 >= 42) return 'GOOD';
  if (vo2 >= 35) return 'FAIR';
  return 'NEEDS WORK';
}

function heatColor(val: number): string {
  switch (val) {
    case 1: return '#FFBBB8';
    case 2: return '#FF6B63';
    case 3: return colors.accent;
    default: return colors.bgSecondary;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statTileValue}>{value}</Text>
      {sub && <Text style={styles.statTileSub}>{sub}</Text>}
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function HistoryRow({ item, isLast }: { item: typeof HISTORY[0]; isLast: boolean }) {
  return (
    <View>
      <View style={styles.historyRow}>
        <View style={styles.historyLeft}>
          <Text style={styles.historyDate}>{item.date}</Text>
          <Text style={styles.historyLevel}>LVL {item.level}, SH {item.shuttle}</Text>
        </View>
        <View style={styles.historyRight}>
          <Text style={styles.historyScore}>{item.score}</Text>
          <Text style={styles.historyVo2}>VO2 {item.vo2}</Text>
        </View>
      </View>
      {!isLast && <View style={styles.hairline} />}
    </View>
  );
}

function Heatmap() {
  const cellSize = Math.floor((CHART_WIDTH - 6 * 4) / 7);
  return (
    <View style={styles.heatmapWrap}>
      <View style={styles.heatmapGrid}>
        {HEATMAP.map((week, wi) => (
          <View key={wi} style={styles.heatmapRow}>
            {week.map((val, di) => (
              <View
                key={di}
                style={[
                  styles.heatmapCell,
                  { width: cellSize, height: cellSize, backgroundColor: heatColor(val) },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.heatmapLegend}>
        <Text style={styles.heatmapLegendText}>LESS</Text>
        {[0, 1, 2, 3].map(v => (
          <View key={v} style={[styles.heatmapLegendDot, { backgroundColor: heatColor(v) }]} />
        ))}
        <Text style={styles.heatmapLegendText}>MORE</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function YouScreen() {
  const vo2Data = HISTORY.map(h => h.vo2);
  const labels = HISTORY.map(h => h.date.split(' ')[0]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {PROFILE.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{PROFILE.name}</Text>
            <Text style={styles.profileHandle}>{PROFILE.handle}</Text>
          </View>
        </View>

        <View style={styles.hairline} />

        {/* Top stats */}
        <View style={styles.statsRow}>
          <StatTile label="TESTS" value={String(PROFILE.testsCompleted)} />
          <View style={styles.statDivider} />
          <StatTile label="BEST SCORE" value={PROFILE.bestScore} sub={`LVL ${PROFILE.bestLevel}`} />
          <View style={styles.statDivider} />
          <StatTile label="BEST VO2" value={String(PROFILE.bestVO2)} sub={fitnessCategory(PROFILE.bestVO2)} />
        </View>

        <View style={styles.hairline} />

        {/* VO2 max trend chart */}
        <View style={styles.section}>
          <SectionHeader title="VO2 MAX TREND" />
          <LineChart
            data={{
              labels,
              datasets: [{ data: vo2Data }],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{
              backgroundGradientFrom: colors.white,
              backgroundGradientTo: colors.white,
              decimalPlaces: 1,
              color: () => colors.accent,
              labelColor: () => colors.textSecondary,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.accent,
                fill: colors.white,
              },
              propsForBackgroundLines: {
                stroke: colors.bgSecondary,
                strokeWidth: 1,
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines
            withOuterLines={false}
          />
        </View>

        <View style={styles.hairline} />

        {/* Activity heatmap */}
        <View style={styles.section}>
          <SectionHeader title="ACTIVITY — LAST 12 WEEKS" />
          <Heatmap />
        </View>

        <View style={styles.hairline} />

        {/* Test history */}
        <View style={styles.section}>
          <SectionHeader title="TEST HISTORY" />
          {[...HISTORY].reverse().map((item, i) => (
            <HistoryRow key={item.date} item={item} isLast={i === HISTORY.length - 1} />
          ))}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Profile header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  profileHandle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statTileValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  statTileSub: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.accent,
    letterSpacing: 0.3,
  },
  statTileLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: borders.hairline,
    backgroundColor: borders.color,
    alignSelf: 'stretch',
    marginVertical: spacing.xs,
  },

  // Section
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },

  // Chart
  chart: {
    borderRadius: 8,
    marginLeft: -spacing.md,
  },

  // Heatmap
  heatmapWrap: {
    gap: spacing.sm,
  },
  heatmapGrid: {
    gap: 4,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapCell: {
    borderRadius: 3,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  heatmapLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapLegendText: {
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },

  // History
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  historyLeft: {
    gap: 2,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyLevel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  historyScore: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  historyVo2: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Dividers
  hairline: {
    height: borders.hairline,
    backgroundColor: borders.color,
  },
});
