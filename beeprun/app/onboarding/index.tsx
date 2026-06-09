import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

const C = {
  surface: '#f9f9f9',
  onSurface: '#1a1c1c',
  secondary: '#5e5e5e',
  brandRed: '#FF3B30',
  outlineVariant: '#e7bdb7',
  white: '#ffffff',
};

export default function SplashScreen() {
  const continueWith = (_provider: 'apple' | 'google') => {
    router.push('/onboarding/permission');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroNumber}>12.4</Text>
        <Text style={styles.heroSub}>Your beep test. Tracked.</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnApple} onPress={() => continueWith('apple')} activeOpacity={0.85}>
          <Text style={styles.btnAppleText}> Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGoogle} onPress={() => continueWith('google')} activeOpacity={0.85}>
          <Text style={styles.btnGoogleText}>G  Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing, you agree to{'\n'}
          BeepRun's <Text style={styles.legalLink}>Terms of Service</Text> and <Text style={styles.legalLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.surface,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNumber: {
    fontSize: 88,
    fontWeight: '700',
    color: C.brandRed,
    letterSpacing: -3,
    lineHeight: 90,
  },
  heroSub: {
    fontSize: 17,
    color: C.onSurface,
    marginTop: 12,
    letterSpacing: -0.2,
  },
  buttons: {
    gap: 12,
  },
  btnApple: {
    height: 52,
    backgroundColor: C.onSurface,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAppleText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
    letterSpacing: 0.2,
  },
  btnGoogle: {
    height: 52,
    backgroundColor: C.white,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGoogleText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.onSurface,
    letterSpacing: 0.2,
  },
  legal: {
    fontSize: 12,
    color: C.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  legalLink: {
    color: C.brandRed,
  },
});
