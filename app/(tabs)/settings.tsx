import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { Colors } from '../../src/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { webStore } from '../../src/database/webDataStore';
import { seedWebDemoData } from '../../src/utils/seedDemoData';
import { useTheme, THEMES, ThemeName } from '../../src/constants/ThemeContext';

export default function SettingsScreen() {
  const { theme, themeName, setTheme } = useTheme();
  const [passcodeLock, setPasscodeLock] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const entryCount = Platform.OS === 'web' ? webStore.getEntryCount() : 0;
  const streak = Platform.OS === 'web' ? webStore.getStreakCount() : 0;

  const handleLoadDemoData = () => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem('inksight_demo_seeded'); } catch {}
      webStore.clearAll();
      seedWebDemoData();
      setDemoLoaded(true);
      setTimeout(() => window.location.reload(), 500);
    } else {
      Alert.alert('Demo Data', 'Demo data loading is only available on web.');
    }
  };

  const handleClearData = () => {
    if (Platform.OS === 'web') {
      webStore.clearAll();
      try { localStorage.removeItem('inksight_demo_seeded'); } catch {}
      setDemoLoaded(false);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  // Dynamic styles based on active theme
  const bg = theme.background;
  const cardBg = theme.card;
  const textMain = theme.textMain;
  const textMuted = theme.textMuted;
  const primary = theme.primary;
  const isDark = theme.isDark;
  const borderColor = isDark ? '#FFFFFF0D' : '#00000008';

  const settingSections = [
    {
      title: 'PRIVACY & SECURITY',
      items: [
        { icon: 'lock' as const, label: 'Passcode Lock', type: 'toggle', value: passcodeLock, onToggle: setPasscodeLock },
        { icon: 'fingerprint' as const, label: 'Face ID / Biometrics', type: 'toggle', value: biometrics, onToggle: setBiometrics },
      ],
    },
    {
      title: 'YOUR DATA',
      items: [
        { icon: 'cloud-upload' as const, label: 'Sync to iCloud', type: 'nav' },
        { icon: 'file-download' as const, label: 'Export Journal (PDF/CSV)', type: 'nav' },
      ],
    },
  ];

  const themeOptions: { key: ThemeName; label: string; preview: string; primaryColor: string }[] = [
    { key: 'sunset', label: 'Sunset Solace', preview: '#F5F2EE', primaryColor: '#E8A87C' },
    { key: 'midnight', label: 'Midnight Moss', preview: '#1E2A3A', primaryColor: '#7DBFA7' },
    { key: 'lavender', label: 'Lavender Lullaby', preview: '#F4F0F7', primaryColor: '#9A97C1' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={[styles.headerTitle, { color: textMain }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* User Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.profileAvatar, { backgroundColor: primary }]}>
            <Text style={[styles.profileAvatarText, { color: theme.primaryButtonText }]}>V</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textMain }]}>Vala</Text>
            <Text style={[styles.profileMeta, { color: textMuted }]}>Journaling since March 2025</Text>
            <Text style={[styles.profileStats, { color: primary }]}>{entryCount} entries · {streak}-day streak</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={textMuted} />
        </View>

        {/* Setting Sections */}
        {settingSections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: textMuted }]}>{section.title}</Text>
            <View style={styles.sectionItems}>
              {section.items.map((item, ii) => (
                <View key={ii} style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}>
                  <View style={styles.settingLeft}>
                    <MaterialIcons name={item.icon} size={20} color={textMuted} />
                    <Text style={[styles.settingLabel, { color: textMain }]}>{item.label}</Text>
                  </View>
                  {item.type === 'toggle' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: isDark ? '#4A5568' : '#CBD5E1', true: primary }}
                      thumbColor="#FFFFFF"
                    />
                  )}
                  {item.type === 'nav' && (
                    <MaterialIcons name="chevron-right" size={24} color={textMuted} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* EXPERIENCE — Theme Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>EXPERIENCE</Text>
          <View style={styles.sectionItems}>
            <TouchableOpacity
              style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}
              onPress={() => setShowThemePicker(!showThemePicker)}
            >
              <View style={styles.settingLeft}>
                <MaterialIcons name="palette" size={20} color={textMuted} />
                <Text style={[styles.settingLabel, { color: textMain }]}>App Theme</Text>
              </View>
              <View style={styles.navValueRow}>
                <Text style={[styles.navValueText, { color: primary }]}>{theme.label}</Text>
                <MaterialIcons
                  name={showThemePicker ? 'expand-less' : 'expand-more'}
                  size={24}
                  color={textMuted}
                />
              </View>
            </TouchableOpacity>

            {/* Theme Picker Expanded */}
            {showThemePicker && (
              <View style={[styles.themePickerContainer, { backgroundColor: isDark ? '#1A2535' : '#F8F7F5', borderColor }]}>
                {themeOptions.map(opt => {
                  const isActive = themeName === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.themeOption,
                        { backgroundColor: cardBg, borderColor: isActive ? opt.primaryColor : borderColor },
                        isActive && { borderWidth: 2 },
                      ]}
                      onPress={() => setTheme(opt.key)}
                      activeOpacity={0.8}
                    >
                      {/* Color preview */}
                      <View style={styles.themePreviewRow}>
                        <View style={[styles.themeSwatch, { backgroundColor: opt.preview, borderWidth: 1, borderColor: '#00000015' }]} />
                        <View style={[styles.themeSwatch, { backgroundColor: opt.primaryColor }]} />
                      </View>
                      <Text style={[styles.themeOptionLabel, { color: isActive ? opt.primaryColor : textMain }]}>
                        {opt.label}
                      </Text>
                      {isActive && (
                        <View style={[styles.activeCheck, { backgroundColor: opt.primaryColor }]}>
                          <MaterialIcons name="check" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Developer Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>DEVELOPER</Text>
          <View style={styles.sectionItems}>
            <TouchableOpacity style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]} onPress={handleLoadDemoData}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="science" size={20} color={primary} />
                <Text style={[styles.settingLabel, { color: primary }]}>Load Demo Data (Dev)</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]} onPress={handleClearData}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="delete-outline" size={20} color="#E07A5F" />
                <Text style={[styles.settingLabel, { color: '#E07A5F' }]}>Clear All Data</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#E07A5F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Crisis Support Card */}
        <View style={[styles.crisisCard, { backgroundColor: isDark ? '#253447' : '#F0F6FB', borderLeftColor: primary }]}>
          <View style={styles.crisisRow}>
            <View style={[styles.crisisIcon, { backgroundColor: isDark ? '#1E2A3A' : '#FFFFFFCC' }]}>
              <MaterialIcons name="favorite" size={24} color={primary} />
            </View>
            <View style={styles.crisisContent}>
              <Text style={[styles.crisisTitle, { color: textMain }]}>You're not alone</Text>
              <Text style={[styles.crisisDesc, { color: textMuted }]}>
                Feeling overwhelmed? Connect with trained professionals at the iCall helpline anytime.
              </Text>
              <TouchableOpacity style={[styles.crisisBtn, { backgroundColor: primary }]} activeOpacity={0.9}>
                <Text style={[styles.crisisBtnText, { color: theme.primaryButtonText }]}>Connect to Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionSection}>
          <Text style={[styles.versionText, { color: textMuted }]}>INKSIGHT PREMIUM V2.4.1</Text>
          <Text style={[styles.versionSub, { color: textMuted + '99' }]}>Made with care for your mind.</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 24 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16,
  },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 24, fontWeight: '700' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 16, padding: 16, borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarText: { fontFamily: 'Nunito_700Bold', fontSize: 24 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, fontWeight: '600' },
  profileMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  profileStats: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4, fontWeight: '500' },

  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 13,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingHorizontal: 8,
    fontWeight: '600',
  },
  sectionItems: { gap: 8 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 52, borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontFamily: 'Inter_500Medium', fontSize: 15, fontWeight: '500' },
  navValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navValueText: { fontFamily: 'Inter_500Medium', fontSize: 13, fontWeight: '500' },

  // Theme Picker
  themePickerContainer: {
    borderRadius: 16, padding: 12, gap: 8,
    borderWidth: 1,
  },
  themeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1,
  },
  themePreviewRow: { flexDirection: 'row', gap: 4 },
  themeSwatch: { width: 24, height: 24, borderRadius: 6 },
  themeOptionLabel: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, fontWeight: '600' },
  activeCheck: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  crisisCard: {
    marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 20,
    borderLeftWidth: 4,
  },
  crisisRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  crisisIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  crisisContent: { flex: 1 },
  crisisTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  crisisDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  crisisBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, alignSelf: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  crisisBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, fontWeight: '500' },

  versionSection: { alignItems: 'center', paddingVertical: 24 },
  versionText: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 2, fontWeight: '500' },
  versionSub: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
});
