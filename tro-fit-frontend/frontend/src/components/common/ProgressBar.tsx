import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../../styles';

type ProgressBarProps = {
  progress: number;
  style?: StyleProp<ViewStyle>;
};

export default function ProgressBar({ progress, style }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 10,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: '100%',
  },
});
