import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !newPassword || !confirmPassword) {
      return Toast.show({ type: 'error', text1: 'Please fill all fields' });
    }

    if (newPassword.length < 6) {
      return Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return Toast.show({ type: 'error', text1: 'Passwords do not match' });
    }

    try {
      setLoading(true);
      await api.post('/auth/forgot-password', {
        email: normalizedEmail,
        newPassword,
        confirmPassword,
      });

      Toast.show({
        type: 'success',
        text1: 'Password Updated',
        text2: 'You can now sign in with your new password.',
      });

      navigation.navigate('Login');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: e.response?.data?.message || 'Unable to reset password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Reset your account password securely</Text>
        </View>

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
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat new password"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetPassword} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.resetBtnText}>RESET PASSWORD</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: SPACING.xl, paddingBottom: 40 },
  header: { marginTop: 30, marginBottom: SPACING.xl },
  backBtn: { marginBottom: SPACING.lg },
  backText: { color: COLORS.primary, fontSize: 15 },
  title: { fontSize: 30, color: COLORS.text, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary },
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
  resetBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  resetBtnText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 1.6 },
});
