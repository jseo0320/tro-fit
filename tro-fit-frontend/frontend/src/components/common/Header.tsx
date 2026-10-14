import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontWeights, spacing, typography } from '../../styles';

type HeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
};

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightLabel,
  onRightPress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable accessibilityLabel="Go back" onPress={onBackPress} style={styles.backButton}>
          <Text style={styles.backText}>{'‹'}</Text>
        </Pressable>
      ) : null}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightLabel ? (
        <Pressable accessibilityRole="button" onPress={onRightPress} style={styles.rightButton}>
          <Text style={styles.rightText}>{rightLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 38,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  rightButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rightText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
});
