import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';

const C = {
  surface: '#f9f9f9',
  onSurface: '#1a1c1c',
  secondary: '#5e5e5e',
  brandRed: '#FF3B30',
  outlineVariant: '#e7bdb7',
  surfaceContainerLow: '#f3f3f4',
  white: '#ffffff',
};

export default function PermissionScreen() {
  const handleAllow = async () => {
    await Audio.requestPermissionsAsync().catch(() => {});
    router.push('/onboarding/profile');
  };

  const handleNotNow = () => {
    router.push('/onboarding/profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Text style={styles.micIcon}>🎙</Text>
        </View>

        <Text style={styles.label}>AUDIO PERMISSION</Text>

        <Text style={styles.title}>BeepRun needs your microphone to play the beep test audio.</Text>

        <Text style={styles.body2}>
          This allows the app to precisely calibrate audio cues and record ambient sound for performance analysis.
        </Text>

        <View style={styles.preview} />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.allowBtn} onPress={handleAllow} activeOpacity={0.85}>
          <Text style={styles.allowBtnText}>Allow</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNotNow} activeOpacity={0.7} hitSlop={12}>
          <Text style={styles.notNow}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: C.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  micIcon: {
    fontSize: 28,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.secondary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: C.onSurface,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  body2: {
    fontSize: 14,
    color: C.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  preview: {
    width: '100%',
    height: 80,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 2,
    marginTop: 16,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
  },
  footer: {
    gap: 16,
    alignItems: 'center',
  },
  allowBtn: {
    width: '100%',
    height: 52,
    backgroundColor: C.brandRed,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  notNow: {
    fontSize: 14,
    color: C.secondary,
  },
});
