import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, Header } from '../components/common';
import { ApiError, getCurrentUser, logout, updateCurrentUserProfile } from '../services';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { AuthUser } from '../types/api';
import type { RootStackParamList } from '../types/navigation';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;

export default function MyPageScreen({ navigation }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!mounted) return;
        setUser(currentUser);
        setName(currentUser.name);
        setEmail(currentUser.email);
        setAge(currentUser.age ? String(currentUser.age) : '');
        setHeightCm(currentUser.heightCm ? String(currentUser.heightCm) : '');
        setWeightKg(currentUser.weightKg ? String(currentUser.weightKg) : '');
      })
      .catch((error) => {
        if (!mounted) return;
        const errorText =
          error instanceof ApiError ? error.message : '사용자 정보를 불러오지 못했습니다.';
        setMessage(errorText);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigation.replace('Login');
  };

  const handleSave = async () => {
    const ageValue = Number(age);
    const heightValue = Number(heightCm);
    const weightValue = Number(weightKg);

    if (!name.trim() || !email.trim() || !ageValue || !heightValue || !weightValue) {
      setMessage('이름, 이메일, 나이, 키, 몸무게를 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const updatedUser = await updateCurrentUserProfile({
        name: name.trim(),
        email: email.trim(),
        age: ageValue,
        heightCm: heightValue,
        weightKg: weightValue,
      });
      setUser(updatedUser);
      setEditing(false);
      setMessage('정보가 수정되었습니다.');
    } catch (error) {
      const errorText =
        error instanceof ApiError
          ? error.message
          : '아직 백엔드 수정 API가 준비되지 않았습니다.';
      setMessage(errorText);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout>
      <Header
        showBack
        subtitle="계정 정보와 맞춤 안무 기준 정보를 확인합니다."
        title="마이페이지"
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>정보를 불러오는 중입니다.</Text>
        </View>
      ) : (
        <>
          <AppCard style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name ? name.slice(0, 1) : 'T'}</Text>
            </View>
            <Text style={styles.profileName}>{name || user?.userId || '사용자'}</Text>
            <Text style={styles.profileId}>{user?.userId}</Text>
          </AppCard>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>기본 정보</Text>
            <AppButton
              title={editing ? '취소' : '수정'}
              variant="ghost"
              onPress={() => {
                setEditing((current) => !current);
                setMessage('');
              }}
            />
          </View>

          <AppCard style={styles.formCard}>
            <View style={styles.form}>
              <AppInput
                editable={editing}
                label="이름"
                onChangeText={setName}
                placeholder="이름"
                value={name}
              />
              <AppInput
                autoCapitalize="none"
                editable={editing}
                keyboardType="email-address"
                label="이메일"
                onChangeText={setEmail}
                placeholder="이메일"
                value={email}
              />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <AppInput
                    editable={editing}
                    keyboardType="number-pad"
                    label="나이"
                    onChangeText={setAge}
                    placeholder="68"
                    value={age}
                  />
                </View>
                <View style={styles.rowItem}>
                  <AppInput
                    editable={editing}
                    keyboardType="number-pad"
                    label="키"
                    onChangeText={setHeightCm}
                    placeholder="165"
                    value={heightCm}
                  />
                </View>
              </View>
              <AppInput
                editable={editing}
                keyboardType="number-pad"
                label="몸무게"
                onChangeText={setWeightKg}
                placeholder="60"
                value={weightKg}
              />
            </View>

            {editing ? (
              <AppButton
                title="저장하기"
                loading={saving}
                style={styles.saveButton}
                onPress={handleSave}
              />
            ) : null}
          </AppCard>

          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          <AppButton
            title="로그아웃"
            variant="secondary"
            style={styles.logoutButton}
            onPress={handleLogout}
          />
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.xxxl,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  profileCard: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  avatarText: {
    color: colors.card,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
    marginTop: spacing.md,
  },
  profileId: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxxl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
  },
  formCard: {
    marginTop: spacing.md,
  },
  form: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  messageText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: spacing.xxxl,
  },
});
