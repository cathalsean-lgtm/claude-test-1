import { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { loadResults, saveResult, type TestResult } from '../../src/storage';
import { supabase } from '../../src/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
  accentAmber: '#FF9500',
};

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

// Build 7-col heatmap (last 10 weeks, columns = days of week M-S)
function buildHeatmap(results: TestResult[], bestId?: string): { value: number; isBest: boolean }[][] {
  const weeks = 10;
  const grid: { value: number; isBest: boolean }[][] = Array.from(
    { length: weeks },
    () => Array(7).fill(null).map(() => ({ value: 0, isBest: false }))
  );
  const now = new Date();
  results.forEach(r => {
    const d = new Date(r.date);
    const msAgo = now.getTime() - d.getTime();
    const daysAgo = Math.floor(msAgo / 86400000);
    const weeksAgo = Math.floor(daysAgo / 7);
    if (weeksAgo < weeks) {
      const weekIdx = weeks - 1 - weeksAgo;
      // day 0=Sun, shift to Mon=0..Sun=6
      const dayIdx = (d.getDay() + 6) % 7;
      grid[weekIdx][dayIdx].value = Math.min(3, (grid[weekIdx][dayIdx].value || 0) + 1);
      if (r.id === bestId) grid[weekIdx][dayIdx].isBest = true;
    }
  });
  return grid;
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

const CHART_W = SCREEN_WIDTH - 40; // 20px padding each side
const CHART_H = 120;
const CHART_PAD_L = 8;
const CHART_PAD_R = 8;
const CHART_PAD_T = 12;
const CHART_PAD_B = 24;

function LineChartSvg({ data }: { data: number[] }) {
  if (data.length < 2) {
    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.labelCaps, { textAlign: 'center', padding: 20 }]}>NOT ENOUGH DATA</Text>
      </View>
    );
  }

  const innerW = CHART_W - CHART_PAD_L - CHART_PAD_R;
  const innerH = CHART_H - CHART_PAD_T - CHART_PAD_B;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => {
    const x = CHART_PAD_L + (i / (data.length - 1)) * innerW;
    const y = CHART_PAD_T + (1 - (v - minVal) / range) * innerH;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_W} height={CHART_H}>
        {/* Axis lines */}
        <Line
          x1={CHART_PAD_L}
          y1={CHART_PAD_T}
          x2={CHART_PAD_L}
          y2={CHART_PAD_T + innerH}
          stroke={C.outlineVariant}
          strokeWidth={0.5}
        />
        <Line
          x1={CHART_PAD_L}
          y1={CHART_PAD_T + innerH}
          x2={CHART_PAD_L + innerW}
          y2={CHART_PAD_T + innerH}
          stroke={C.outlineVariant}
          strokeWidth={0.5}
        />

        {/* Data line */}
        <Path
          d={pathD}
          stroke={C.brandRed}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Month labels */}
        <SvgText
          x={CHART_PAD_L}
          y={CHART_H - 4}
          fontSize={10}
          fontWeight="600"
          fill={C.secondary}
          letterSpacing={0.5}
        >
          JAN
        </SvgText>
        <SvgText
          x={CHART_PAD_L + innerW - 16}
          y={CHART_H - 4}
          fontSize={10}
          fontWeight="600"
          fill={C.secondary}
          letterSpacing={0.5}
        >
          JUN
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function Heatmap({ grid }: { grid: { value: number; isBest: boolean }[][] }) {
  const cellSize = Math.floor((SCREEN_WIDTH - 40 - 6 * 4) / 7);
  return (
    <View>
      {/* Day headers */}
      <View style={styles.heatmapDayRow}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={[styles.heatmapDayCell, { width: cellSize }]}>
            <Text style={styles.heatmapDayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      {grid.map((week, wi) => (
        <View key={wi} style={styles.heatmapRow}>
          {week.map((cell, di) => {
            let bg = C.surfaceContainerLow;
            if (cell.value > 0) bg = C.brandRed;
            if (cell.isBest) bg = C.accentAmber;
            return (
              <View
                key={di}
                style={[styles.heatmapCell, { width: cellSize, height: cellSize, backgroundColor: bg }]}
              />
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.heatmapLegend}>
        <View style={[styles.heatmapLegendSwatch, { backgroundColor: C.brandRed }]} />
        <Text style={styles.heatmapLegendText}>TEST DAY</Text>
        <View style={[styles.heatmapLegendSwatch, { backgroundColor: C.accentAmber, marginLeft: 12 }]} />
        <Text style={styles.heatmapLegendText}>PERSONAL BEST</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function YouScreen() {
  const [results, setResults] = useState<TestResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetch = async () => {
        const local = await loadResults().catch(() => [] as TestResult[]);
        if (active) setResults(local);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: rows } = await supabase
          .from('results')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false });

        if (!rows || !active) return;

        const localIds = new Set(local.map(r => r.id));
        const remoteOnly = rows
          .filter(r => !localIds.has(r.id))
          .map(r => ({
            id: r.id,
            date: r.recorded_at,
            level: r.level,
            shuttle: r.shuttle,
            score: r.score,
            vo2: Number(r.vo2_max),
          } as TestResult));

        for (const r of remoteOnly) await saveResult(r).catch(() => {});

        const merged = await loadResults().catch(() => local);
        if (active) setResults(merged);
      };
      fetch();
      return () => { active = false; };
    }, [])
  );

  const best = results.reduce<TestResult | null>((b, r) => {
    if (!b) return r;
    return parseFloat(r.score) > parseFloat(b.score) ? r : b;
  }, null);

  const bestId = best?.id;
  const heatmap = buildHeatmap(results, bestId);
  const chartData = [...results].reverse().slice(-12).map(r => r.vo2);

  // City rank mock
  const cityRank = results.length > 0 ? '#12' : '—';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
      <View style={styles.hairline} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar} />
          <Text style={styles.profileName}>Alex Rivera</Text>
          <Text style={styles.profileHandle}>@arivers</Text>
        </View>

        <View style={styles.hairline} />

        {/* 2-col stats: PB + City Rank */}
        <View style={styles.pbRankGrid}>
          <View style={styles.pbRankCell}>
            <Text style={styles.labelCaps}>PERSONAL BEST</Text>
            <Text style={[styles.heroMetric, { color: C.brandRed }]}>
              {best ? best.score : '—'}
            </Text>
          </View>
          <View style={styles.pbRankDivider} />
          <View style={styles.pbRankCell}>
            <Text style={styles.labelCaps}>CITY RANK</Text>
            <Text style={[styles.heroMetric, { color: C.onSurface }]}>{cityRank}</Text>
          </View>
        </View>

        <View style={styles.hairline} />

        {/* Level scores over time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEVEL SCORES OVER TIME</Text>
          <LineChartSvg data={chartData.length > 1 ? chartData : [40, 42, 44, 46, 48, 50, 51]} />
        </View>

        <View style={styles.hairline} />

        {/* Recent results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT RESULTS</Text>
          <View style={styles.tableContainer}>
            {/* Header row */}
            <View style={styles.tableHeader}>
              <Text style={[styles.labelCaps, { flex: 2 }]}>DATE</Text>
              <Text style={[styles.labelCaps, { flex: 1, textAlign: 'center' }]}>SCORE</Text>
              <Text style={[styles.labelCaps, { flex: 1, textAlign: 'right' }]}>VO2 MAX</Text>
            </View>
            <View style={styles.hairline} />

            {results.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.labelCaps}>NO TESTS YET</Text>
              </View>
            ) : (
              results.slice().reverse().slice(0, 8).map((item, i, arr) => {
                const isPB = item.id === bestId;
                return (
                  <View key={item.id}>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(item.date)}</Text>
                      <View style={[styles.tableCellCenter, { flex: 1 }]}>
                        {isPB && (
                          <View style={styles.pbBadge}>
                            <Text style={styles.pbBadgeText}>PB</Text>
                          </View>
                        )}
                        <Text style={styles.tableCell}>{item.score}</Text>
                      </View>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{item.vo2}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={styles.hairline} />}
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.hairline} />

        {/* Training heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRAINING HEATMAP</Text>
          <Heatmap grid={heatmap} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab}>
          <Text style={styles.navTabLabel}>HOME</Text>
        </TouchableOpacity>
        <View style={styles.navRecordWrapper}>
          <View style={styles.navRecordBtn}>
            <Text style={styles.navRecordIcon}>▶</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.navTab}>
          <Text style={[styles.navTabLabel, { color: C.brandRed }]}>YOU</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // Label caps
  labelCaps: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.secondary,
  },

  // Hero metric
  heroMetric: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2.56,
    lineHeight: 72,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.surfaceContainer,
    borderWidth: 2,
    borderColor: C.brandRed,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 34,
    fontWeight: '700',
    color: C.onSurface,
    letterSpacing: -0.68,
  },
  profileHandle: {
    fontSize: 17,
    fontWeight: '400',
    color: C.secondary,
  },

  // PB / rank grid
  pbRankGrid: {
    flexDirection: 'row',
    backgroundColor: C.outlineVariant,
    gap: 1,
  },
  pbRankDivider: {
    width: 1,
    backgroundColor: C.outlineVariant,
  },
  pbRankCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: C.white,
    gap: 4,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: C.white,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.secondary,
  },

  // Chart
  chartContainer: {
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 8,
  },

  // Table
  tableContainer: {
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surfaceContainerLow,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 15,
    fontWeight: '400',
    color: C.onSurface,
  },
  tableCellCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pbBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,59,48,0.10)',
  },
  pbBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.brandRed,
    letterSpacing: 0.5,
  },
  emptyRow: {
    padding: 20,
    alignItems: 'center',
  },

  // Heatmap
  heatmapDayRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  heatmapDayCell: {
    alignItems: 'center',
  },
  heatmapDayLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: C.secondary,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  heatmapCell: {
    borderRadius: 0,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  heatmapLegendSwatch: {
    width: 10,
    height: 10,
  },
  heatmapLegendText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
});
