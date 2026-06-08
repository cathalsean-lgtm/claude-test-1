import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import Svg, { Circle } from 'react-native-svg';
import { saveResult } from '../../src/storage';

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

// ─── Animated SVG Circle ─────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SVG_SIZE = 96;
const SVG_RADIUS = 44;
const SVG_CIRCUMFERENCE = 2 * Math.PI * SVG_RADIUS; // ~276.46

// ─── Stats Grid Cell ─────────────────────────────────────────────────────────

function StatCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statCellLabel}>{label}</Text>
      <Text style={styles.statCellValue}>{value}</Text>
      <Text style={styles.statCellUnit}>{unit}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecordScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(5);
  const [level, setLevel] = useState(0);
  const [shuttle, setShuttle] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [totalIntervalMs, setTotalIntervalMs] = useState(shuttleIntervalMs(0));

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const levelRef = useRef(0);
  const shuttleRef = useRef(0);

  // Animated value for SVG stroke dash offset
  const dashOffsetAnim = useRef(new Animated.Value(SVG_CIRCUMFERENCE)).current;
  // Animated value for pulsing play button ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Animated value for flash background on shuttle
  const flashAnim = useRef(new Animated.Value(0)).current;
  // Blink animation for LIVE dot
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse play button ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    // Blink LIVE dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [blinkAnim]);

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

  const flashBackground = useCallback(() => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: false }).start();
  }, [flashAnim]);

  const scheduleShuttle = useCallback((lvl: number, sh: number) => {
    const interval = shuttleIntervalMs(lvl);
    setTotalIntervalMs(interval);
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, interval - elapsed);
      setTimeLeftMs(remaining);

      // Update SVG countdown
      const offset = SVG_CIRCUMFERENCE - (remaining / interval) * SVG_CIRCUMFERENCE;
      dashOffsetAnim.setValue(SVG_CIRCUMFERENCE - (remaining / interval) * SVG_CIRCUMFERENCE);

      if (remaining > 50) {
        timerRef.current = setTimeout(tick, 50);
      }
    };
    tick();

    timerRef.current = setTimeout(() => {
      const maxShuttles = SHUTTLES_PER_LEVEL[lvl];
      const nextShuttle = sh + 1;
      flashBackground();
      if (nextShuttle >= maxShuttles) {
        const nextLevel = lvl + 1;
        if (nextLevel >= SHUTTLES_PER_LEVEL.length) {
          levelRef.current = lvl;
          shuttleRef.current = sh;
          setLevel(lvl);
          setShuttle(sh);
          setPhase('done');
          saveResult({ level: lvl, shuttle: sh, score: scoreLabel(lvl, sh), vo2: estimateVO2Max(lvl, sh) }).catch(() => {});
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
  }, [playBeep, flashBackground, dashOffsetAnim]);

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
    saveResult({ level, shuttle, score: scoreLabel(level, shuttle), vo2: estimateVO2Max(level, shuttle) }).catch(() => {});
  };

  const reset = () => {
    clearTimer();
    setPhase('idle');
    setLevel(0);
    setShuttle(0);
    setTimeLeftMs(0);
    levelRef.current = 0;
    shuttleRef.current = 0;
    dashOffsetAnim.setValue(SVG_CIRCUMFERENCE);
  };

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    return () => {
      clearTimer();
    };
  }, []);

  const vo2 = estimateVO2Max(level, shuttle);
  const score = scoreLabel(level, shuttle);
  const totalShuttlesForLevel = SHUTTLES_PER_LEVEL[level] ?? 1;
  const timeLeftSec = timeLeftMs / 1000;
  const progressPct = totalShuttlesForLevel > 0 ? shuttle / totalShuttlesForLevel : 0;

  // ── Idle ──
  if (phase === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarSmall} />
          <Text style={styles.headerTitle}>Record</Text>
          <TouchableOpacity hitSlop={8}>
            <Text style={styles.headerIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hairline} />

        {/* Hero */}
        <View style={styles.idleHero}>
          <Text style={styles.labelCaps}>CURRENT LEVEL</Text>
          <Text style={styles.heroMetric}>—</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCell label="START SPEED" value="8.5" unit="km/h" />
          <View style={styles.statsGridDivider} />
          <StatCell label="DISTANCE" value="20" unit="m" />
          <View style={styles.statsGridDivider} />
          <StatCell label="AUDIO" value="1" unit="LEVEL" />
        </View>

        {/* Start button */}
        <View style={styles.idleStartSection}>
          <View style={styles.pulseWrapper}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <TouchableOpacity style={styles.startCircle} onPress={startCountdown} activeOpacity={0.85}>
              <Text style={styles.startCircleIcon}>▶</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.startHint}>Ensure you are at the start line before beginning.</Text>
        </View>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navTab}>
            <Text style={styles.navTabLabel}>HOME</Text>
          </TouchableOpacity>
          <View style={styles.navRecordWrapper}>
            <View style={[styles.navRecordBtn, { backgroundColor: C.brandRed }]}>
              <Text style={styles.navRecordIcon}>▶</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.navTab}>
            <Text style={styles.navTabLabel}>YOU</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Countdown ──
  if (phase === 'countdown') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredFlex}>
          <Text style={styles.labelCaps}>GET READY</Text>
          <Text style={styles.heroMetric}>{countdown}</Text>
          <Text style={[styles.labelCaps, { color: C.secondary }]}>STARTING IN</Text>
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
    // Elapsed shuttles as minutes:seconds formatted
    const totalShuttlesCompleted = shuttle;
    const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const elapsedMin = Math.floor(elapsedSec / 60);
    const elapsedRemSec = elapsedSec % 60;
    const elapsedStr = `${elapsedMin}:${String(elapsedRemSec).padStart(2, '0')}`;

    const progressWidth = `${Math.round(progressPct * 100)}%`;

    // Dash offset: full circle = 0 shuttles done, shrinks as shuttles complete
    const shuttleFraction = totalIntervalMs > 0 ? (timeLeftMs / totalIntervalMs) : 1;
    const svgOffset = SVG_CIRCUMFERENCE * shuttleFraction;

    return (
      <SafeAreaView style={styles.container}>
        {/* Flash overlay */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: C.brandRed, opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.05] }) },
          ]}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTimer}>▶</Text>
          <Text style={styles.headerTitle}>BeepRun</Text>
          <View style={styles.liveIndicator}>
            <Animated.View style={[styles.liveDot, { opacity: blinkAnim }]} />
            <Text style={styles.liveLabel}>LIVE TEST</Text>
          </View>
        </View>
        <View style={styles.hairline} />

        {/* Hero level */}
        <View style={styles.runningHero}>
          <Text style={styles.labelCaps}>CURRENT LEVEL</Text>
          <Text style={styles.heroMetric}>{level + 1}</Text>

          {/* Shuttle progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: progressWidth as any }]} />
            </View>
            <View style={styles.progressBarLabels}>
              <Text style={styles.labelCaps}>SHUTTLE {shuttle + 1}</Text>
              <Text style={styles.labelCaps}>OF {totalShuttlesForLevel}</Text>
            </View>
          </View>
        </View>

        {/* Countdown circle */}
        <View style={styles.countdownCircleSection}>
          <Animated.View style={[styles.countdownPulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.countdownCircleWrapper}>
            <Svg width={SVG_SIZE} height={SVG_SIZE}>
              {/* Background circle */}
              <Circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={SVG_RADIUS}
                stroke={C.surfaceContainerHighest}
                strokeWidth={3}
                fill="none"
              />
              {/* Progress circle */}
              <AnimatedCircle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={SVG_RADIUS}
                stroke={C.brandRed}
                strokeWidth={4}
                fill="none"
                strokeDasharray={SVG_CIRCUMFERENCE}
                strokeDashoffset={svgOffset}
                strokeLinecap="butt"
                rotation="-90"
                origin={`${SVG_SIZE / 2}, ${SVG_SIZE / 2}`}
              />
            </Svg>
            <View style={styles.countdownCenter}>
              <Text style={styles.countdownSec}>{timeLeftSec.toFixed(1)}</Text>
              <Text style={[styles.labelCaps, { color: C.secondary }]}>SEC</Text>
            </View>
          </View>
          <Text style={[styles.labelCaps, { color: C.brandRed, marginTop: 8 }]}>NEXT BEEP</Text>
        </View>

        {/* Running stats grid */}
        <View style={styles.statsGrid}>
          <StatCell label="ELAPSED TIME" value={elapsedStr} unit="" />
          <View style={styles.statsGridDivider} />
          <StatCell label="SHUTTLES" value={String(shuttle)} unit="" />
          <View style={styles.statsGridDivider} />
          <StatCell label="EST. VO2 MAX" value={String(vo2)} unit="" />
        </View>

        {/* Stop button */}
        <View style={styles.stopSection}>
          <TouchableOpacity style={styles.stopSquare} onPress={stop} activeOpacity={0.85}>
            <View style={styles.stopInnerSquare} />
          </TouchableOpacity>
          <Text style={[styles.labelCaps, { marginTop: 8, color: C.secondary }]}>STOP</Text>
        </View>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navTab}>
            <Text style={styles.navTabLabel}>HOME</Text>
          </TouchableOpacity>
          <View style={styles.navRecordWrapper}>
            <View style={[styles.navRecordBtn, { backgroundColor: C.brandRed }]}>
              <Text style={styles.navRecordIcon}>▶</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.navTab}>
            <Text style={styles.navTabLabel}>YOU</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Done ──
  const finalVO2 = estimateVO2Max(level, shuttle);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarSmall} />
        <Text style={styles.headerTitle}>Record</Text>
        <TouchableOpacity hitSlop={8}>
          <Text style={styles.headerIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.hairline} />

      <View style={styles.doneBody}>
        <Text style={styles.labelCaps}>TEST COMPLETE</Text>
        <Text style={[styles.heroMetric, { color: C.brandRed }]}>{score}</Text>
        <Text style={[styles.labelCaps, { color: C.secondary, marginBottom: 32 }]}>
          LEVEL {level + 1}, SHUTTLE {shuttle + 1}
        </Text>

        <View style={styles.hairline} />
        <View style={styles.doneStatsTable}>
          <View style={styles.doneStatRow}>
            <Text style={styles.doneStatLabel}>VO2 MAX</Text>
            <Text style={styles.doneStatValue}>{finalVO2} ml/kg/min</Text>
          </View>
          <View style={styles.hairline} />
          <View style={styles.doneStatRow}>
            <Text style={styles.doneStatLabel}>FITNESS CATEGORY</Text>
            <Text style={styles.doneStatValue}>{fitnessCategory(finalVO2)}</Text>
          </View>
          <View style={styles.hairline} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.newTestBtn} onPress={reset} activeOpacity={0.85}>
          <Text style={styles.newTestBtnText}>NEW TEST</Text>
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
    gap: 8,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceContainer,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: C.onSurface,
    letterSpacing: -0.22,
  },
  headerTimer: {
    fontSize: 14,
    color: C.brandRed,
  },
  headerIcon: {
    fontSize: 20,
    color: C.secondary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.brandRed,
  },
  liveLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.brandRed,
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
    color: C.onSurface,
    lineHeight: 72,
  },

  // Idle hero
  idleHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: C.outlineVariant,
    gap: 1,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  statsGridDivider: {
    width: 1,
    backgroundColor: C.outlineVariant,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: C.white,
    gap: 4,
  },
  statCellLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.secondary,
  },
  statCellValue: {
    fontSize: 22,
    fontWeight: '600',
    color: C.onSurface,
    letterSpacing: -0.22,
  },
  statCellUnit: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.secondary,
  },

  // Idle start
  idleStartSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  pulseWrapper: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: 'rgba(255,59,48,0.2)',
  },
  startCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.brandRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCircleIcon: {
    fontSize: 28,
    color: C.white,
    marginLeft: 4,
  },
  startHint: {
    fontSize: 15,
    color: C.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Countdown (get ready)
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  // Running hero
  runningHero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 4,
  },

  // Progress bar
  progressBarContainer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 8,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: C.surfaceContainerHighest,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: C.brandRed,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  // Countdown circle section
  countdownCircleSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  countdownPulseRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: 'rgba(255,59,48,0.06)',
    top: 16,
  },
  countdownCircleWrapper: {
    width: SVG_SIZE,
    height: SVG_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownSec: {
    fontSize: 22,
    fontWeight: '600',
    color: C.onSurface,
    letterSpacing: -0.22,
  },

  // Stop section
  stopSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  stopSquare: {
    width: 80,
    height: 80,
    backgroundColor: C.white,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopInnerSquare: {
    width: 32,
    height: 32,
    backgroundColor: C.brandRed,
  },

  // Done
  doneBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  doneStatsTable: {
    width: '100%',
    marginTop: 16,
  },
  doneStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  doneStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.secondary,
  },
  doneStatValue: {
    fontSize: 15,
    fontWeight: '400',
    color: C.onSurface,
  },

  // Footer / nav
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  cancelBtn: {
    backgroundColor: C.surfaceContainerLow,
    paddingVertical: 18,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.secondary,
  },
  newTestBtn: {
    backgroundColor: C.brandRed,
    paddingVertical: 18,
    alignItems: 'center',
  },
  newTestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    color: C.white,
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
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRecordIcon: {
    fontSize: 18,
    color: C.white,
  },
});
