import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../styles';

type ScreenLayoutProps = {
  children: ReactNode;
  bottom?: ReactNode;
  scroll?: boolean;
};

export default function ScreenLayout({ children, bottom, scroll = true }: ScreenLayoutProps) {
  const content = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {bottom ? <View style={styles.bottom}>{bottom}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.screen,
  },
  bottom: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
  },
});
