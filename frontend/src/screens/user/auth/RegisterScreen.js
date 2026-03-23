import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { registerUser, clearError } from '../../../redux/slices/user/authSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    if (error) {
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: error });
      dispatch(clearError());
    }
  }, [error]);

  const handleRegister = () => {
    if (!form.name || !form.email || !form.password)
      return Toast.show({ type: 'error', text1: 'Please fill all fields' });
    if (form.password !== form.confirm)
      return Toast.show({ type: 'error', text1: 'Passwords do not match' });
    if (form.password.length < 6)
      return Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
    dispatch(registerUser({ name: form.name, email: form.email.trim(), password: form.password }));
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: '👤', placeholder: 'Your full name', keyboard: 'default' },
    { key: 'email', label: 'Email Address', icon: '✉️', placeholder: 'your@email.com', keyboard: 'email-address' },
    { key: 'password', label: 'Password', icon: '🔒', placeholder: 'Min. 6 characters', secure: true },
    { key: 'confirm', label: 'Confirm Password', icon: '🔑', placeholder: 'Repeat password', secure: true },
  ];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <Text style={styles.logoGem}>💎</Text>
            <Text style={styles.brandName}>LUXURY GLEAM</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our exclusive jewelry community</Text>
        </View>

        <View style={styles.form}>
          {fields.map((f) => (
            <View key={f.key} style={styles.inputGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>{f.icon}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={form[f.key]}
                  onChangeText={(v) => update(f.key, v)}
                  keyboardType={f.keyboard || 'default'}
                  secureTextEntry={f.secure && !showPass}
                  autoCapitalize={f.key === 'name' ? 'words' : 'none'}
                />
                {f.secure && f.key === 'password' && (
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: SPACING.xl, paddingBottom: 40 },
  header: { marginBottom: SPACING.xl },
  backBtn: { marginBottom: SPACING.lg },
  backText: { color: COLORS.primary, fontSize: 15 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  logoGem: { fontSize: 28 },
  brandName: { fontSize: 20, color: COLORS.primary, letterSpacing: 4, fontWeight: '700' },
  title: { fontSize: 28, color: COLORS.text, fontWeight: '700', marginBottom: 6 },
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
  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    height: 54, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm,
  },
  registerBtnText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 2 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
