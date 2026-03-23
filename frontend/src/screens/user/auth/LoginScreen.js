import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { loginUser, clearError } from '../../../redux/slices/user/authSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [didSubmitLogin, setDidSubmitLogin] = useState(false);

  useEffect(() => {
    if (error) {
      Toast.show({ type: 'error', text1: 'Login Failed', text2: error });
      dispatch(clearError());
      setDidSubmitLogin(false);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isAuthenticated && didSubmitLogin) {
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: `Welcome back, ${user?.name || 'User'}!`,
      });
      setDidSubmitLogin(false);
    }
  }, [isAuthenticated, didSubmitLogin, user]);

  const handleLogin = () => {
    if (!email || !password) {
      return Toast.show({ type: 'error', text1: 'Please fill all fields' });
    }
    setDidSubmitLogin(true);
    dispatch(loginUser({ email: email.trim(), password }));
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo / Branding */}
        <View style={styles.brandSection}>
          <View style={styles.logoRing}>
            <Text style={styles.logoGem}>💎</Text>
          </View>
          <Text style={styles.brandName}>LUXURY GLEAM</Text>
          <Text style={styles.brandTagline}>Fine Jewelry & Precious Gems</Text>
          <View style={styles.goldDivider} />
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.forgotWrap} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.loginBtnText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login buttons (UI only — requires Expo AuthSession for full implementation) */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialLabel}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
              <Text style={styles.socialLabel}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: SPACING.xl, paddingBottom: 40 },
  brandSection: { alignItems: 'center', marginTop: 40, marginBottom: SPACING.xl },
  logoRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.surfaceLight, marginBottom: SPACING.md,
  },
  logoGem: { fontSize: 38 },
  brandName: { fontSize: 24, color: COLORS.primary, letterSpacing: 6, fontWeight: '700', marginBottom: 4 },
  brandTagline: { fontSize: 11, color: COLORS.textSecondary, letterSpacing: 2, textTransform: 'uppercase' },
  goldDivider: { width: 60, height: 1, backgroundColor: COLORS.primary, marginTop: SPACING.md },
  title: { fontSize: 28, color: COLORS.text, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  form: { gap: SPACING.md },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  eyeIcon: { fontSize: 16, padding: 4 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 2 },
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm,
  },
  loginBtnText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginVertical: SPACING.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textMuted },
  socialRow: { flexDirection: 'row', gap: SPACING.md },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, height: 48, backgroundColor: COLORS.surfaceLight,
  },
  socialIcon: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  socialLabel: { fontSize: 14, color: COLORS.text },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
