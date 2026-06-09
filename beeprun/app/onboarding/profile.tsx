import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { saveProfile } from '../../src/storage';

const C = {
  surface: '#f9f9f9',
  onSurface: '#1a1c1c',
  secondary: '#5e5e5e',
  brandRed: '#FF3B30',
  outlineVariant: '#e7bdb7',
  surfaceContainerLow: '#f3f3f4',
  white: '#ffffff',
};

export default function ProfileScreen() {
  const [firstName, setFirstName] = useState('Alex');
  const [age, setAge] = useState(24);
  const [city, setCity] = useState('London, UK');
  const [detecting, setDetecting] = useState(false);

  const detectCity = async () => {
    setDetecting(true);
    // Placeholder — real implementation would use expo-location
    setTimeout(() => {
      setCity('London, UK');
      setDetecting(false);
    }, 800);
  };

  const handleContinue = async () => {
    if (!firstName.trim() || age < 5 || age > 100 || !city.trim()) return;
    await saveProfile({ firstName: firstName.trim(), age, city: city.trim() });
    router.push('/onboarding/pb');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.stepLabel}>STEP 1 / 2</Text>
        </View>

        <Text style={styles.title}>Setup Profile</Text>
        <Text style={styles.subtitle}>
          Enter your details to calibrate the Beep test metrics for your age and location.
        </Text>

        {/* First name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>FIRST NAME</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Alex"
            placeholderTextColor={C.secondary}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Age */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>AGE</Text>
          <View style={styles.agePicker}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={String(age)}
              onChangeText={v => { const n = parseInt(v); if (!isNaN(n)) setAge(n); }}
              keyboardType="number-pad"
              maxLength={3}
            />
            <TouchableOpacity
              style={styles.ageBtn}
              onPress={() => setAge(a => Math.max(5, a - 1))}
              hitSlop={8}
            >
              <Text style={styles.ageBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ageBtn}
              onPress={() => setAge(a => Math.min(100, a + 1))}
              hitSlop={8}
            >
              <Text style={[styles.ageBtnText, { color: C.brandRed }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* City */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>CITY</Text>
          <View style={styles.cityRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={city}
              onChangeText={setCity}
              placeholder="London, UK"
              placeholderTextColor={C.secondary}
              autoCapitalize="words"
            />
            <TouchableOpacity style={styles.detectBtn} onPress={detectCity} hitSlop={8}>
              <Text style={styles.detectBtnText}>{detecting ? '...' : '📍 DETECT'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calibration image placeholder */}
        <View style={styles.calibrationCard}>
          <Text style={styles.calibrationLabel}>PRECISION CALIBRATION</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, (!firstName.trim() || age < 5 || !city.trim()) && styles.continueBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue →</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>You can change these later in settings.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.white,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.secondary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: C.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: C.secondary,
    lineHeight: 20,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.secondary,
    letterSpacing: 0.8,
  },
  input: {
    height: 48,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    borderRadius: 2,
    paddingHorizontal: 12,
    fontSize: 15,
    color: C.onSurface,
  },
  agePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ageBtn: {
    width: 40,
    height: 40,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: C.onSurface,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detectBtn: {
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.brandRed,
    letterSpacing: 0.5,
  },
  calibrationCard: {
    height: 100,
    backgroundColor: C.onSurface,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibrationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e7bdb7',
    backgroundColor: C.white,
  },
  continueBtn: {
    height: 52,
    backgroundColor: C.brandRed,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 12,
    color: C.secondary,
    textAlign: 'center',
  },
});
