import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { colors, spacing, borders } from '../../src/theme';
import { loadResults, type TestResult } from '../../src/storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.md * 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fitnessCategory(vo2: number): string {
  if (vo2 >= 55) return 'SUPERIOR';
  if (vo2 >= 48) return 'EXCELLENT';
  if (vo2 >= 42) return 'GOOD';
  if (vo2 >= 35) return 'FAIR';
  return 'NEEDS WORK';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function heatColor(val: number): string {
  switch (val) {
    case 1: return '#FFBBB8';
    case 2: return '#FF6B63';
    case 3: return colors.accent;
    default: return colors.bgSecondary;
  }
}

function buildHeatmap(results: TestResult[]): number[][] {
  const weeks = 12;
  const grid: number[][] = Array.from({ length: weeks }, () => Array(7).fill(0));
  const now = new Date();
  results.forEach(r => {
    const d = new Date(r.date);
    const msAgo = now.getTime() - d.getTime();
    const daysAgo = Math.floor(msAgo / 86400000);
    const weeksAgo = Math.floor(daysAgo / 7);
    if (weeksAgo < weeks) {
      const weekIdx = weeks - 1 - weeksAgo;
      const dayIdx = d.getDay();
      grid[weekIdx][dayIdx] = Math.min(3, (grid[weekIdx][dayIdx] || 0) + 1);
    }
  });
  return grid;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statTileValue}>{value}</Text>
      {sub ? <Text style={styles.statTileSub}>{sub}</Text> : null}
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function HistoryRow({ item, isLast }: { item: TestResult; isLast: boolean }) {
  return (
    <View>
      <View style={styles.historyRow}>
        <View style={styles.historyLeft}>
          <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
          <Text style={styles.historyLevel}>LVL {item.level + 1}, SH {item.shuttle + 1}</Text>
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

function Heatmap({ grid }: { grid: number[][] }) {
  const cellSize = Math.floor((CHART_WIDTH - 6 * 4) / 7);
  return (
    <View style={styles.heatmapWrap}>
      <View style={styles.heatmapGrid}>
        {grid.map((week, wi) => (
          <View key={wi} style={styles.heatmapRow}>
            {week.map((val, di) => (
              <View
                key={di}
                style={[styles.heatmapCell, { width: cellSize, height: cellSize, backgroundColor: heatColor(val) }]}
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

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>NO TESTS YET</Text>
      <Text style={styles.emptySub}>Complete a beep test to see your progress here.</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function YouScreen() {
  const [results, setResults] = useState<TestResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadResults().then(setResults).catch(() => {});
    }, [])
  );

  const best = results.reduce<TestResult | null>((b, r) => {
    if (!b) return r;
    return parseFloat(r.score) > parseFloat(b.score) ? r : b;
  }, null);

  const heatmap = buildHeatmap(results);
  const chartResults = [...results].reverse().slice(-7);
  const vo2Data = chartResults.length > 0 ? chartResults.map(r => r.vo2) : [0];
  const chartLabels = chartResults.length > 0 ? chartResults.map(r => formatDate(r.date).split(' ')[0]) : ['—'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>SD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Sean Donnelly</Text>
            <Text style={styles.profileHandle}>@seandonnelly</Text>
          </View>
        </View>

        <View style={styles.hairline} />

        {/* Top stats */}
        <View style={styles.statsRow}>
          <StatTile label="TESTS" value={String(results.length)} />
          <View style={styles.statDivider} />
          <StatTile
            label="BEST SCORE"
            value={best ? best.score : '—'}
            sub={best ? `LVL ${best.level + 1}` : undefined}
          />
          <View style={styles.statDivider} />
          <StatTile
            label="BEST VO2"
            value={best ? String(best.vo2) : '—'}
            sub={best ? fitnessCategory(best.vo2) : undefined}
          />
        </View>

        <View style={styles.hairline} />

        {results.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* VO2 trend chart */}
            <View style={styles.section}>
              <SectionHeader title="VO2 MAX TREND" />
              <LineChart
                data={{ labels: chartLabels, datasets: [{ data: vo2Data }] }}
                width={CHART_WIDTH}
                height={180}
                chartConfig={{
                  backgroundGradientFrom: colors.white,
                  backgroundGradientTo: colors.white,
                  decimalPlaces: 1,
                  color: () => colors.accent,
                  labelColor: () => colors.textSecondary,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent, fill: colors.white },
                  propsForBackgroundLines: { stroke: colors.bgSecondary, strokeWidth: 1 },
                }}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines={false}
              />
            </View>

            <View style={styles.hairline} />

            {/* Heatmap */}
            <View style={styles.section}>
              <SectionHeader title="ACTIVITY — LAST 12 WEEKS" />
              <Heatmap grid={heatmap} />
            </View>

            <View style={styles.hairline} />

            {/* History */}
            <View style={styles.section}>
              <SectionHeader title="TEST HISTORY" />
              {results.map((item, i) => (
                <HistoryRow key={item.id} item={item} isLast={i === results.length - 1} />
              ))}
            </View>
          </>
        )}

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
  chart: {
    borderRadius: 8,
    marginLeft: -spacing.md,
  },
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
  hairline: {
    height: borders.hairline,
    backgroundColor: borders.color,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
