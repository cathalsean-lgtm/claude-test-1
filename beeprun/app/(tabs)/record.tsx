import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { colors, spacing, borders } from '../../src/theme';

// ─── PACER Protocol ───────────────────────────────────────────────────────────

const SHUTTLES_PER_LEVEL = [7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16];
const START_SPEED_KMH = 8.5;
const SPEED_INCREMENT = 0.5;
const SHUTTLE_DISTANCE_M = 20;

function shuttleIntervalMs(level: number): number {
  const speed = START_SPEED_KMH + level * SPEED_INCREMENT;
  return (SHUTTLE_DISTANCE_M / (speed * 1000 / 3600)) * 1000;
}

function estimateVO2Max(level: number, shuttle: number): number {
  const speed = START_SPEED_KMH + level * SPEED_INCREMENT;
  return Math.round((31.025 + 3.238 * speed - 3.248 * 25 + 0.1536 * 25 * speed) * 10) / 10;
}

function scoreLabel(level: number, shuttle: number): string {
  return `${level + 1}.${shuttle + 1}`;
}

function fitnessCategory(vo2: number): string {
  if (vo2 >= 55) return 'SUPERIOR';
  if (vo2 >= 48) return 'EXCELLENT';
  if (vo2 >= 42) return 'GOOD';
  if (vo2 >= 35) return 'FAIR';
  return 'NEEDS WORK';
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'countdown' | 'running' | 'done';

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoTileLabel}>{label}</Text>
      <Text style={styles.infoTileValue}>
        {value}
        <Text style={styles.infoTileUnit}>{unit ? ` ${unit}` : ''}</Text>
      </Text>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecordScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(5);
  const [level, setLevel] = useState(0);
  const [shuttle, setShuttle] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const levelRef = useRef(0);
  const shuttleRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const playBeep = useCallback(async (times = 1) => {
    if (Platform.OS === 'web') return;
    try {
      for (let i = 0; i < times; i++) {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/beep.wav'),
          { shouldPlay: true, volume: 1.0 }
        );
        await new Promise(r => setTimeout(r, 220));
        await sound.unloadAsync();
      }
    } catch {}
  }, []);

  const scheduleShuttle = useCallback((lvl: number, sh: number) => {
    const interval = shuttleIntervalMs(lvl);
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, interval - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
      if (remaining > 100) {
        timerRef.current = setTimeout(tick, 100);
      }
    };
    tick();

    timerRef.current = setTimeout(() => {
      const maxShuttles = SHUTTLES_PER_LEVEL[lvl];
      const nextShuttle = sh + 1;
      if (nextShuttle >= maxShuttles) {
        const nextLevel = lvl + 1;
        if (nextLevel >= SHUTTLES_PER_LEVEL.length) {
          levelRef.current = lvl;
          shuttleRef.current = sh;
          setLevel(lvl);
          setShuttle(sh);
          setPhase('done');
          return;
        }
        playBeep(3);
        levelRef.current = nextLevel;
        shuttleRef.current = 0;
        setLevel(nextLevel);
        setShuttle(0);
        scheduleShuttle(nextLevel, 0);
      } else {
        playBeep(1);
        levelRef.current = lvl;
        shuttleRef.current = nextShuttle;
        setShuttle(nextShuttle);
        scheduleShuttle(lvl, nextShuttle);
      }
    }, interval);
  }, [playBeep]);

  const startCountdown = () => {
    setPhase('countdown');
    setCountdown(5);
    let c = 5;
    const tick = () => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        levelRef.current = 0;
        shuttleRef.current = 0;
        setLevel(0);
        setShuttle(0);
        setPhase('running');
        playBeep(1);
        scheduleShuttle(0, 0);
      } else {
        timerRef.current = setTimeout(tick, 1000);
      }
    };
    timerRef.current = setTimeout(tick, 1000);
  };

  const stop = () => {
    clearTimer();
    setPhase('done');
  };

  const reset = () => {
    clearTimer();
    setPhase('idle');
    setLevel(0);
    setShuttle(0);
    setTimeLeft(0);
    levelRef.current = 0;
    shuttleRef.current = 0;
  };

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    return () => {
      clearTimer();
    };
  }, []);

  const vo2 = estimateVO2Max(level, shuttle);
  const score = scoreLabel(level, shuttle);

  // ── Idle ──
  if (phase === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BEEP TEST</Text>
          <Text style={styles.headerSub}>20M PACER PROTOCOL</Text>
        </View>

        <View style={styles.idleBody}>
          <View style={styles.infoGrid}>
            <InfoTile label="DISTANCE" value="20M" />
            <InfoTile label="START SPEED" value="8.5" unit="KM/H" />
            <InfoTile label="MAX LEVELS" value="21" />
            <InfoTile label="INCREMENT" value="+0.5" unit="KM/H" />
          </View>
          <Text style={styles.instruction}>
            Run 20 metres to reach the far line before each beep.{'\n'}
            Stop when you can no longer keep up.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={startCountdown} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>START TEST</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Countdown ──
  if (phase === 'countdown') {
    return (
      <SafeAreaView style={[styles.container, styles.containerDark]}>
        <View style={styles.centeredFlex}>
          <Text style={styles.countdownLabel}>GET READY</Text>
          <Text style={styles.countdownNumber}>{countdown}</Text>
          <Text style={styles.countdownSub}>STARTING IN</Text>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={reset} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Running ──
  if (phase === 'running') {
    return (
      <SafeAreaView style={[styles.container, styles.containerDark]}>
        <View style={styles.runningHeader}>
          <Text style={styles.runningLabel}>LEVEL</Text>
          <Text style={styles.runningLabel}>SHUTTLE</Text>
          <Text style={styles.runningLabel}>NEXT IN</Text>
        </View>
        <View style={styles.runningValues}>
          <Text style={styles.runningBig}>{level + 1}</Text>
          <Text style={styles.runningBigSep}>·</Text>
          <Text style={styles.runningBig}>{shuttle + 1}</Text>
          <Text style={styles.runningBigSep}>·</Text>
          <Text style={styles.runningBig}>{timeLeft}s</Text>
        </View>

        <View style={styles.hairlineDark} />

        <View style={styles.scoreRow}>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabelSm}>SCORE</Text>
            <Text style={styles.scoreHero}>{score}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabelSm}>EST. VO2 MAX</Text>
            <Text style={styles.scoreHero}>{vo2}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.stopBtn} onPress={stop} activeOpacity={0.85}>
            <Text style={styles.stopBtnText}>STOP TEST</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Done ──
  const finalVO2 = estimateVO2Max(level, shuttle);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.doneHeader}>
        <Text style={styles.doneTitle}>TEST COMPLETE</Text>
      </View>

      <View style={styles.doneBody}>
        <Text style={styles.doneLabelSm}>FINAL SCORE</Text>
        <Text style={styles.doneScore}>{score}</Text>
        <Text style={styles.doneLevel}>LEVEL {level + 1}, SHUTTLE {shuttle + 1}</Text>

        <View style={styles.hairlineLight} />

        <View style={styles.doneStats}>
          <StatRow label="ESTIMATED VO2 MAX" value={`${finalVO2} ml/kg/min`} />
          <StatRow label="FITNESS CATEGORY" value={fitnessCategory(finalVO2)} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={reset} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>NEW TEST</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  containerDark: {
    backgroundColor: '#000000',
  },

  // Idle
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  idleBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  infoTileLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  infoTileValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  infoTileUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  instruction: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  // Countdown
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -4,
    lineHeight: 130,
  },
  countdownSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginTop: spacing.sm,
  },

  // Running
  runningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  runningLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 1,
    textAlign: 'center',
    flex: 1,
  },
  runningValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  runningBig: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -2,
    flex: 1,
    textAlign: 'center',
  },
  runningBigSep: {
    fontSize: 48,
    color: '#333333',
    fontWeight: '300',
  },
  hairlineDark: {
    height: borders.hairline,
    backgroundColor: '#222222',
  },
  hairlineLight: {
    height: borders.hairline,
    backgroundColor: borders.color,
    marginVertical: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  scoreBlock: {
    flex: 1,
  },
  scoreLabelSm: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreHero: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -1,
  },
  scoreDivider: {
    width: borders.hairline,
    height: 60,
    backgroundColor: '#222222',
    marginHorizontal: spacing.lg,
  },

  // Done
  doneHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: borders.hairline,
    borderBottomColor: borders.color,
  },
  doneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  doneBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  doneLabelSm: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  doneScore: {
    fontSize: 88,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -2,
    lineHeight: 92,
  },
  doneLevel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginTop: spacing.xs,
  },
  doneStats: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: borders.hairline,
    borderBottomColor: borders.color,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Buttons
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  stopBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  stopBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
});
