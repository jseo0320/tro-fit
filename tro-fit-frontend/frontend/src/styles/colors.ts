export const colors = {
  background: '#FFF8EE',
  backgroundSoft: '#FFF2E0',

  primary: '#F7654A',
  primaryLight: '#FF8A65',
  primarySoft: '#FFE0D2',

  dark: '#1E0F0C',
  darkBrown: '#2A120F',

  textPrimary: '#24110E',
  textSecondary: '#6F5A52',
  textMuted: '#9A8A82',

  success: '#64AA91',
  successSoft: '#D8F4E8',

  warning: '#F5C75E',
  danger: '#F7654A',

  card: '#FFFFFF',
  border: '#EAD8CA',
} as const;

export type ColorName = keyof typeof colors;
