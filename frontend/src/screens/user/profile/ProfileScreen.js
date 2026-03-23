import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateProfile } from '../../../redux/slices/user/authSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { user, loading } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zip: user?.address?.zip || '',
    country: user?.address?.country || '',
  });
  const [avatarUri, setAvatarUri] = useState(null);

  const update = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const pickImage = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) return Toast.show({ type: 'error', text1: 'Permission denied' });

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });

    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Update Photo', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Photo Library', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    let payload;

    if (avatarUri) {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      formData.append('address[street]', form.street);
      formData.append('address[city]', form.city);
      formData.append('address[state]', form.state);
      formData.append('address[zip]', form.zip);
      formData.append('address[country]', form.country);

      const ext = (avatarUri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      formData.append('avatar', { uri: avatarUri, name: `avatar.${ext}`, type: mimeType });

      payload = formData;
    } else {
      payload = {
        name: form.name,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
      };
    }

    const result = await dispatch(updateProfile(payload));
    if (updateProfile.fulfilled.match(result)) {
      Toast.show({ type: 'success', text1: '✓ Profile Updated' });
      setAvatarUri(null);
    } else {
      Toast.show({ type: 'error', text1: 'Update failed', text2: result.payload || 'Please try again' });
    }
  };

  const avatarSource = avatarUri ? { uri: avatarUri } : user?.avatar ? { uri: user.avatar } : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="MY PROFILE" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={showImageOptions}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{user?.name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}><Text style={styles.cameraIcon}>📷</Text></View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
          <Text style={styles.roleTag}>{user?.role?.toUpperCase()}</Text>
        </View>

        {/* Personal Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Personal Information</Text>
          <InputField label="Full Name" value={form.name} onChangeText={(v) => update('name', v)} />
          <InputField label="Phone Number" value={form.phone} onChangeText={(v) => update('phone', v)} keyboard="phone-pad" />
          <InputField label="Email" value={user?.email} editable={false} hint="Email cannot be changed" />
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Address</Text>
          <InputField label="Street Address" value={form.street} onChangeText={(v) => update('street', v)} />
          <InputField label="City" value={form.city} onChangeText={(v) => update('city', v)} />
          <InputField label="State / Province" value={form.state} onChangeText={(v) => update('state', v)} />
          <InputField label="ZIP Code" value={form.zip} onChangeText={(v) => update('zip', v)} keyboard="numeric" />
          <InputField label="Country" value={form.country} onChangeText={(v) => update('country', v)} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function InputField({ label, value, onChangeText, keyboard, editable = true, hint }) {
  return (
    <View style={{ gap: 4, marginBottom: SPACING.sm }}>
      <Text style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
      <TextInput
        style={[{
          backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border,
          borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, color: COLORS.text, fontSize: 14,
        }, !editable && { opacity: 0.5 }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard || 'default'}
        editable={editable}
        placeholderTextColor={COLORS.textMuted}
      />
      {hint && <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, gap: SPACING.lg },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl },
  avatarWrapper: { position: 'relative', marginBottom: SPACING.sm },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: COLORS.primary },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryDark, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  avatarLetter: { fontSize: 40, color: COLORS.primary, fontWeight: '700' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { fontSize: 16 },
  avatarHint: { fontSize: 12, color: COLORS.textSecondary },
  roleTag: { marginTop: 6, fontSize: 11, color: COLORS.primary, fontWeight: '700', letterSpacing: 2, backgroundColor: COLORS.surfaceLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginBottom: SPACING.md },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 54, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: COLORS.background, fontSize: 15, fontWeight: '700', letterSpacing: 2 },
});
