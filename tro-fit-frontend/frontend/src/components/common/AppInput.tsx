import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fontWeights, layout, radius, spacing, typography } from '../../styles';

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export default function AppInput({ label, error, style, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    height: layout.inputHeight,
    paddingHorizontal: spacing.lg,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: typography.caption,
  },
});
