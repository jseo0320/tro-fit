import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, Header } from '../components/common';
import { ApiError, signup } from '../services';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (
      !userId.trim() ||
      !password.trim() ||
      !name.trim() ||
      !email.trim() ||
      !age.trim() ||
      !heightCm.trim() ||
      !weightKg.trim()
    ) {
      setErrorMessage('모든 정보를 입력해주세요.');
      return;
    }

    const ageValue = Number(age);
    const heightValue = Number(heightCm);
    const weightValue = Number(weightKg);

    if (!ageValue || !heightValue || !weightValue) {
      setErrorMessage('나이, 키, 몸무게는 숫자로 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await signup({
        userId: userId.trim(),
        password,
        name: name.trim(),
        email: email.trim(),
        age: ageValue,
        heightCm: heightValue,
        weightKg: weightValue,
      });
      navigation.replace('Home');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : '회원가입에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout bottom={<AppButton title="가입하고 시작하기" loading={loading} onPress={handleSignup} />}>
      <Header
        showBack
        subtitle="맞춤 안무 생성을 위한 기본 정보를 입력합니다."
        title="회원가입"
        onBackPress={() => navigation.goBack()}
      />

      <AppCard style={styles.infoCard}>
        <Text style={styles.infoLabel}>가입 정보</Text>
        <Text style={styles.infoText}>
          나이, 키, 몸무게는 맞춤 안무 난이도와 안전 안내를 조정하는 데 사용됩니다.
        </Text>
      </AppCard>

      <View style={styles.form}>
        <AppInput
          autoCapitalize="none"
          label="아이디"
          onChangeText={setUserId}
          placeholder="예: hans6988"
          value={userId}
        />
        <AppInput
          label="비밀번호"
          onChangeText={setPassword}
          placeholder="비밀번호 입력"
          secureTextEntry
          value={password}
        />
        <AppInput label="이름" onChangeText={setName} placeholder="예: 한상협" value={name} />
        <AppInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="이메일"
          onChangeText={setEmail}
          placeholder="예: trofit@example.com"
          value={email}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <AppInput
              keyboardType="number-pad"
              label="나이"
              onChangeText={setAge}
              placeholder="68"
              value={age}
            />
          </View>
          <View style={styles.rowItem}>
            <AppInput
              keyboardType="number-pad"
              label="키"
              onChangeText={setHeightCm}
              placeholder="165"
              value={heightCm}
            />
          </View>
        </View>
        <AppInput
          keyboardType="number-pad"
          label="몸무게"
          onChangeText={setWeightKg}
          placeholder="60"
          value={weightKg}
        />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    marginTop: spacing.xxxl,
  },
  infoLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
