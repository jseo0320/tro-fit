import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/common';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const floatValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          duration: 1200,
          toValue: -8,
          useNativeDriver: true,
        }),
        Animated.timing(floatValue, {
          duration: 1200,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          duration: 1200,
          toValue: 1.05,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          duration: 1200,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    );

    floatAnimation.start();
    pulseAnimation.start();

    return () => {
      floatAnimation.stop();
      pulseAnimation.stop();
    };
  }, [floatValue, pulseValue]);

  return (
    <ScreenLayout
      bottom={
        <View style={styles.bottomArea}>
          <View style={styles.pageDots}>
            <View style={styles.dotInactive} />
            <View style={styles.dotActive} />
          </View>
          <AppButton
            title="시작하기 · Get Started"
            style={styles.startButton}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      }
      scroll={false}
    >
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.hero}>
        <Animated.View
          style={[
            styles.logoShadow,
            {
              transform: [{ translateY: floatValue }, { scale: pulseValue }],
            },
          ]}
        >
          <View style={styles.logoMark}>
            <View style={styles.badgeCircle}>
              <View style={styles.runnerHead} />
              <View style={styles.runnerBody} />
              <View style={styles.runnerArmLeft} />
              <View style={styles.runnerArmRight} />
              <View style={styles.runnerLegLeft} />
              <View style={styles.runnerLegRight} />
            </View>
          </View>
        </Animated.View>

        <Text style={styles.title}>Tro-Fit</Text>
        <Text style={styles.subtitle}>건강한 하루, 신나는 트로트</Text>
        <Text style={styles.caption}>Dance into wellness, every day</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backgroundGlowTop: {
    backgroundColor: '#FFD2BE',
    borderRadius: 180,
    height: 240,
    opacity: 0.42,
    position: 'absolute',
    right: -80,
    top: -42,
    width: 240,
  },
  backgroundGlowBottom: {
    backgroundColor: '#DCE7C8',
    borderRadius: 190,
    bottom: 70,
    height: 260,
    left: -100,
    opacity: 0.45,
    position: 'absolute',
    width: 260,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 64,
  },
  logoShadow: {
    shadowColor: colors.primary,
    shadowOffset: {
      height: 12,
      width: 0,
    },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  badgeCircle: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    position: 'relative',
    width: 38,
  },
  runnerHead: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    top: 7,
    width: 8,
  },
  runnerBody: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 14,
    position: 'absolute',
    top: 15,
    transform: [{ rotate: '-14deg' }],
    width: 4,
  },
  runnerArmLeft: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 3,
    left: 11,
    position: 'absolute',
    top: 18,
    transform: [{ rotate: '35deg' }],
    width: 12,
  },
  runnerArmRight: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 3,
    position: 'absolute',
    right: 10,
    top: 17,
    transform: [{ rotate: '-45deg' }],
    width: 12,
  },
  runnerLegLeft: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 3,
    left: 13,
    position: 'absolute',
    top: 28,
    transform: [{ rotate: '-50deg' }],
    width: 13,
  },
  runnerLegRight: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 3,
    position: 'absolute',
    right: 10,
    top: 29,
    transform: [{ rotate: '45deg' }],
    width: 14,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 31,
    fontWeight: fontWeights.bold,
    letterSpacing: 0,
    marginTop: spacing.xxl,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
    lineHeight: 24,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  caption: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bottomArea: {
    gap: spacing.xxl,
  },
  pageDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  dotInactive: {
    backgroundColor: colors.border,
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  dotActive: {
    backgroundColor: colors.primarySoft,
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  startButton: {
    borderRadius: 18,
    shadowColor: colors.primary,
    shadowOffset: {
      height: 8,
      width: 0,
    },
    shadowOpacity: 0.24,
    shadowRadius: 14,
  },
});
