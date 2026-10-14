import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fontWeights, layout, radius, typography } from '../../styles';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost';

type AppButtonProps = PressableProps & {
  title: string;
  variant?: AppButtonVariant;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function AppButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.card : colors.primary} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.xl,
    flexDirection: 'row',
    gap: 8,
    height: layout.buttonHeight,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
  },
  primaryText: {
    color: colors.card,
  },
  secondaryText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.textSecondary,
  },
});
