import React from 'react';
import { StyleSheet } from 'react-native';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import { COLORS, BORDER_RADIUS, SPACING } from '../../constants/theme';

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={styles.successToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={styles.errorToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={styles.infoToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  ),
};

const styles = StyleSheet.create({
  successToast: {
    borderLeftColor: COLORS.success,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    height: 'auto',
    minHeight: 60,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorToast: {
    borderLeftColor: COLORS.error,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    height: 'auto',
    minHeight: 60,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoToast: {
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    height: 'auto',
    minHeight: 60,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contentContainer: { paddingHorizontal: SPACING.md },
  text1: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  text2: { fontSize: 12, color: COLORS.textSecondary },
});
