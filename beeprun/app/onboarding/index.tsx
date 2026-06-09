import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/supabase';

const C = {
  surface: '#f9f9f9',
  onSurface: '#1a1c1c',
  secondary: '#5e5e5e',
  brandRed: '#FF3B30',
  outlineVariant: '#e7bdb7',
  white: '#ffffff',
};

export default function SplashScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroNumber}>12.4</Text>
          <Text style={styles.heroSub}>Your beep test. Tracked.</Text>
        </View>
        <View style={styles.buttons}>
          <View style={styles.sentBox}>
            <Text style={styles.sentTitle}>Check your email</Text>
            <Text style={styles.sentSub}>
              We sent a magic link to{'\n'}
              <Text style={{ color: C.onSurface, fontWeight: '600' }}>{email}</Text>
            </Text>
            <TouchableOpacity onPress={() => setSent(false)} hitSlop={8}>
              <Text style={styles.resendLink}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroNumber}>12.4</Text>
          <Text style={styles.heroSub}>Your beep test. Tracked.</Text>
        </View>

        <View style={styles.buttons}>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={C.secondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={sendMagicLink}
            returnKeyType="go"
          />

          <TouchableOpacity
            style={[styles.btnContinue, (!email.trim() || loading) && styles.btnDisabled]}
            onPress={sendMagicLink}
            activeOpacity={0.85}
            disabled={!email.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.btnContinueText}>Continue with Email →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/onboarding/permission')} hitSlop={8}>
            <Text style={styles.skipLink}>Skip for now</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            By continuing, you agree to{'\n'}
            BeepRun's <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  input: {
    height: 52,
    backgroundColor: C.white,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    borderRadius: 2,
    paddingHorizontal: 16,
    fontSize: 15,
    color: C.onSurface,
  },
  btnContinue: {
    height: 52,
    backgroundColor: C.brandRed,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnContinueText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  skipLink: {
    fontSize: 13,
    color: C.secondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  legal: {
    fontSize: 12,
    color: C.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  legalLink: {
    color: C.brandRed,
  },
  sentBox: {
    padding: 20,
    borderWidth: 0.5,
    borderColor: C.outlineVariant,
    borderRadius: 2,
    backgroundColor: C.white,
    alignItems: 'center',
    gap: 8,
  },
  sentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.onSurface,
  },
  sentSub: {
    fontSize: 14,
    color: C.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resendLink: {
    fontSize: 13,
    color: C.brandRed,
    fontWeight: '600',
    marginTop: 4,
  },
});
