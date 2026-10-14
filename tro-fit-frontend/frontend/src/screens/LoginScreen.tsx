import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput } from '../components/common';
import { ApiError, login } from '../services';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      setErrorMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login({ userId: userId.trim(), password });
      navigation.replace('Home');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '로그인에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const enterPreviewMode = () => {
    navigation.replace('Home');
  };

  return (
    <ScreenLayout bottom={<AppButton title="로그인" loading={loading} onPress={handleLogin} />}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Tro-Fit</Text>
        <Text style={styles.title}>오늘 몸 상태에 맞춰 움직여볼까요?</Text>
        <Text style={styles.subtitle}>
          로그인하면 이번 주 맞춤 안무 영상과 측정 기록을 확인할 수 있어요.
        </Text>
      </View>

      <View style={styles.form}>
        <AppInput
          autoCapitalize="none"
          label="아이디"
          onChangeText={setUserId}
          placeholder="아이디 입력"
          value={userId}
        />
        <AppInput
          label="비밀번호"
          onChangeText={setPassword}
          placeholder="비밀번호 입력"
          secureTextEntry
          value={password}
        />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.previewBox}>
        <Text style={styles.previewText}>백엔드 서버 없이 화면만 확인하려면</Text>
        <AppButton title="UI 둘러보기" variant="secondary" onPress={enterPreviewMode} />
      </View>

      <View style={styles.signupBox}>
        <Text style={styles.signupText}>처음 이용하시나요?</Text>
        <AppButton title="회원가입" variant="ghost" onPress={() => navigation.navigate('Signup')} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xxxl,
    marginTop: spacing.xxxl,
  },
  kicker: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.titleLarge,
    fontWeight: fontWeights.bold,
    lineHeight: 36,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: 18,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  previewBox: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  previewText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
  },
  signupBox: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signupText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginBottom: spacing.xs,
  },
});
