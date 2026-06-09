import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { loadProfile, saveProfile, markOnboardingDone } from '../../src/storage';

const C = {
  surface: '#f9f9f9',
  onSurface: '#1a1c1c',
  secondary: '#5e5e5e',
  brandRed: '#FF3B30',
  outlineVariant: '#e7bdb7',
  surfaceContainerLow: '#f3f3f4',
  white: '#ffffff',
};

const SHUTTLES_PER_LEVEL = [7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16];

export default function PBScreen() {
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);
  const [level, setLevel] = useState(8);
  const [shuttle, setShuttle] = useState(1);

  const maxShuttle = SHUTTLES_PER_LEVEL[level - 1] ?? 8;

  const finish = async (withPB: boolean) => {
    const profile = await loadProfile();
    if (profile) {
      await saveProfile({
        ...profile,
        baselinePB: withPB
          ? { level, shuttle, score: `${level}.${shuttle}` }
          : null,
      });
    }
    await markOnboardingDone();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
          <TouchableOpacity onPress={() => finish(false)} hitSlop={12}>
            <Text style={styles.cancelLabel}>CANCEL</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Previous Beep Test Experience?</Text>
        <Text style={styles.subtitle}>
          Defining your baseline Personal Best ensures your training load is mathematically optimized for progress.
        </Text>

        {/* Option: Yes */}
        <TouchableOpacity
          style={[styles.option, choice === 'yes' && styles.optionSelected]}
          onPress={() => setChoice('yes')}
          activeOpacity={0.85}
        >
          <View style={[styles.radio, choice === 'yes' && styles.radioSelected]}>
            {choice === 'yes' && <View style={styles.radioDot} />}
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, choice === 'yes' && styles.optionTitleSelected]}>
              Yes, I have a score
            </Text>
            <Text style={styles.optionSub}>Enter your level and shuttle.</Text>
          </View>
          <Text style={styles.optionChevron}>›</Text>
        </TouchableOpacity>

        {/* Level / shuttle picker (shown when yes selected) */}
        {choice === 'yes' && (
          <View style={styles.picker}>
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>LEVEL</Text>
              <View style={styles.pickerControls}>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setLevel(l => Math.max(1, l - 1))}
                  hitSlop={8}
                >
                  <Text style={styles.pickerBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{level}</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setLevel(l => Math.min(21, l + 1))}
                  hitSlop={8}
                >
                  <Text style={[styles.pickerBtnText, { color: C.brandRed }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.pickerDivider} />
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>SHUTTLE</Text>
              <View style={styles.pickerControls}>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShuttle(s => Math.max(1, s - 1))}
                  hitSlop={8}
                >
                  <Text style={styles.pickerBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{shuttle}</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShuttle(s => Math.min(maxShuttle, s + 1))}
                  hitSlop={8}
                >
                  <Text style={[styles.pickerBtnText, { color: C.brandRed }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.pickerScore}>Score: {level}.{shuttle}</Text>
          </View>
        )}

        {/* Option: No */}
        <TouchableOpacity
          style={[styles.option, choice === 'no' && styles.optionSelected]}
          onPress={() => setChoice('no')}
          activeOpacity={0.85}
        >
          <View style={[styles.radio, choice === 'no' && styles.radioSelected]}>
            {choice === 'no' && <View style={styles.radioDot} />}
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, choice === 'no' && styles.optionTitleSelected]}>
              No, I'm not sure
            </Text>
            <Text style={styles.optionSub}>Skip and run a test later.</Text>
          </View>
          <Text style={styles.optionChevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !choice && styles.continueBtnDisabled]}
          onPress={() => choice && finish(choice === 'yes')}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {choice === 'yes' ? 'Save & Continue →' : 'Skip & Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: { fontSize: 12, fontWeight: '600', color: C.secondary, letterSpacing: 0.5 },
  cancelLabel: { fontSize: 12, fontWeight: '700', color: C.brandRed, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', color: C.onSurface, letterSpacing: -0.5, lineHeight: 32 },
  subtitle: { fontSize: 14, color: C.secondary, lineHeight: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    borderRadius: 2,
    backgroundColor: C.surfaceContainerLow,
    gap: 12,
  },
  optionSelected: {
    borderColor: C.brandRed,
    backgroundColor: 'rgba(255,59,48,0.04)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: C.brandRed, backgroundColor: C.brandRed },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 15, fontWeight: '600', color: C.onSurface },
  optionTitleSelected: { color: C.brandRed },
  optionSub: { fontSize: 13, color: C.secondary },
  optionChevron: { fontSize: 20, color: C.secondary },
  picker: {
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    borderRadius: 2,
    backgroundColor: C.surfaceContainerLow,
    overflow: 'hidden',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerDivider: { height: 0.5, backgroundColor: C.outlineVariant },
  pickerLabel: { fontSize: 11, fontWeight: '600', color: C.secondary, letterSpacing: 0.8 },
  pickerControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pickerBtn: {
    width: 36,
    height: 36,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    backgroundColor: C.white,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBtnText: { fontSize: 18, fontWeight: '600', color: C.onSurface },
  pickerValue: { fontSize: 22, fontWeight: '700', color: C.onSurface, minWidth: 32, textAlign: 'center' },
  pickerScore: {
    textAlign: 'center',
    fontSize: 13,
    color: C.brandRed,
    fontWeight: '600',
    paddingBottom: 12,
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: C.outlineVariant,
    backgroundColor: C.white,
  },
  continueBtn: {
    height: 52,
    backgroundColor: C.brandRed,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { fontSize: 15, fontWeight: '700', color: C.white, letterSpacing: 0.3 },
});
