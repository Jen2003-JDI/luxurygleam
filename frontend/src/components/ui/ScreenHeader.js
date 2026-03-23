import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export default function ScreenHeader({ title, subtitle, onMenuPress, onNotifPress, notifCount, onBack, rightComponent }) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        ) : null}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.right}>
        {rightComponent}
        {onNotifPress && (
          <TouchableOpacity style={styles.iconBtn} onPress={onNotifPress}>
            <Text style={styles.notifIcon}>🔔</Text>
            {notifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { fontSize: 18, color: COLORS.primary, fontWeight: '700', letterSpacing: 2 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  iconBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  menuIcon: { fontSize: 22, color: COLORS.text },
  backIcon: { fontSize: 22, color: COLORS.primary },
  notifIcon: { fontSize: 20 },
  badge: {
    position: 'absolute', top: 0, right: -2, backgroundColor: COLORS.error,
    borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2,
  },
  badgeText: { fontSize: 9, color: COLORS.white, fontWeight: '700' },
});
