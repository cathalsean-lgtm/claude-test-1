import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../src/theme';

export default function YouScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You</Text>
      <Text style={styles.subtitle}>Profile & progress coming in Task 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  title: {
    ...typography.hero,
    fontSize: 34,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
