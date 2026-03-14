import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Platform, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { webStore } from '../../src/database/webDataStore';
import { seedWebDemoData } from '../../src/utils/seedDemoData';
import { useTheme, THEMES, ThemeName } from '../../src/constants/ThemeContext';

// localStorage helpers
function getLS(key: string, fallback: any = null) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function setLS(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeName, setTheme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const entryCount = Platform.OS === 'web' ? webStore.getEntryCount() : 0;
  const streak = Platform.OS === 'web' ? webStore.getStreakCount() : 0;

  // ─── Profile State ───────────────────────
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [userName, setUserName] = useState(() => getLS('inksight_user_name', 'User'));
  const [editingName, setEditingName] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(() => getLS('inksight_pfp', null));
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(() => getLS('inksight_reminders', false));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── Passcode State ──────────────────────
  const passcodeRef = useRef<TextInput | null>(null);
  const [passcodeEnabled, setPasscodeEnabled] = useState(() => getLS('inksight_passcode_enabled', false));
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeConfirm, setPasscodeConfirm] = useState('');
  const [passcodeStep, setPasscodeStep] = useState<'set' | 'confirm' | 'done'>('set');
  const [showResetPasscode, setShowResetPasscode] = useState(false);
  const [biometrics, setBiometrics] = useState(false);

  // ─── Export State ────────────────────────
  const [showExportPanel, setShowExportPanel] = useState(false);

  // ─── Cloud Sync State ────────────────────
  const [showCloudPanel, setShowCloudPanel] = useState(false);

  // ─── Support Resources ───────────────────
  const [showSupportLinks, setShowSupportLinks] = useState(false);

  const saveName = (n: string) => { setUserName(n); setLS('inksight_user_name', n); setEditingName(false); };
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  // Handle PFP upload
  const handlePfpUpload = () => {
    if (Platform.OS !== 'web') return;
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setProfilePic(dataUrl);
            setLS('inksight_pfp', dataUrl);
          };
          reader.readAsDataURL(file);
        }
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  };

  // Logout handler
  const handleLogout = async () => {
    webStore.clearAll();
    try {
      localStorage.removeItem('inksight_demo_seeded');
      localStorage.removeItem('inksight_user_name');
      localStorage.removeItem('inksight_pfp');
      localStorage.removeItem('inksight_passcode');
      localStorage.removeItem('inksight_passcode_enabled');
      localStorage.removeItem('inksight_locked');
      await AsyncStorage.removeItem('onboarding_complete');
    } catch {}
    router.replace('/splash');
  };

  // Passcode handlers
  const handlePasscodeToggle = (val: boolean) => {
    if (val) {
      setShowPasscodeSetup(true);
      setPasscodeStep('set');
      setPasscodeInput('');
      setPasscodeConfirm('');
    } else {
      setPasscodeEnabled(false);
      setLS('inksight_passcode_enabled', false);
      try { localStorage.removeItem('inksight_passcode'); localStorage.removeItem('inksight_locked'); } catch {}
    }
  };

  // Auto-submit passcode when 4 digits are entered
  useEffect(() => {
    if (passcodeInput.length === 4) {
      handlePasscodeSet();
    }
  }, [passcodeInput]);

  const handlePasscodeSet = () => {
    if (passcodeInput.length !== 4) return;
    if (passcodeStep === 'set') {
      setPasscodeStep('confirm');
      setPasscodeConfirm(passcodeInput);
      setPasscodeInput('');
    } else if (passcodeStep === 'confirm') {
      if (passcodeInput === passcodeConfirm) {
        setLS('inksight_passcode', passcodeInput);
        setLS('inksight_passcode_enabled', true);
        setLS('inksight_locked', true);
        setPasscodeEnabled(true);
        setShowPasscodeSetup(false);
        setPasscodeStep('done');
      } else {
        setPasscodeStep('set');
        setPasscodeInput('');
        setPasscodeConfirm('');
        if (Platform.OS === 'web') alert('Passcodes do not match. Try again.');
      }
    }
  };

  const handleResetPasscode = () => {
    try { localStorage.removeItem('inksight_passcode'); localStorage.removeItem('inksight_locked'); } catch {}
    setPasscodeEnabled(false);
    setLS('inksight_passcode_enabled', false);
    setShowResetPasscode(false);
    if (Platform.OS === 'web') alert('Passcode has been reset successfully.');
  };

  // Export handlers
  const handleExport = (range: 'today' | '7days' | '30days', format: 'pdf' | 'csv') => {
    const end = new Date();
    const start = new Date();
    if (range === '7days') start.setDate(start.getDate() - 7);
    else if (range === '30days') start.setDate(start.getDate() - 30);
    
    const entries = webStore.getEntriesByRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);

    if (format === 'csv') {
      let csv = 'Date,Content,Mood Score,Emotions,Tags\n';
      entries.forEach(e => {
        const emotions = (() => { try { return JSON.parse(e.detected_emotions || '[]').map((em: any) => em.emotion).join('; '); } catch { return ''; } })();
        const tags = (() => { try { return JSON.parse(e.tags || '[]').join('; '); } catch { return ''; } })();
        csv += `"${e.date}","${(e.content || '').replace(/"/g, '""')}",${e.mood_score || ''},"${emotions}","${tags}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `inksight_journal_${range}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      // Generate PDF via print
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const entriesHtml = entries.map(e => {
        const emotions = (() => { try { return JSON.parse(e.detected_emotions || '[]'); } catch { return []; } })();
        return `
          <div style="border:1px solid #F1F5F9;border-radius:12px;padding:20px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-weight:700;color:#1E293B;">${e.date}</span>
              <span style="font-size:12px;color:#94A3B8;">Mood: ${e.mood_score || '-'}/10</span>
            </div>
            <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;font-family:Georgia,serif;">${e.content || ''}</p>
            ${emotions.length > 0 ? `<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">${emotions.map((em: any) => `<span style="background:#F8FAFC;padding:2px 10px;border-radius:8px;font-size:11px;color:#64748B;">${em.emotion}</span>`).join('')}</div>` : ''}
          </div>
        `;
      }).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>INKsight Journal Export</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1E293B}
      .header{text-align:center;padding-bottom:24px;border-bottom:2px solid #F1F5F9;margin-bottom:24px}
      .logo{font-size:28px;font-weight:700;color:#D4956A}.logo span{color:#7DBFA7}
      .meta{font-size:12px;color:#94A3B8;margin-top:8px}
      @media print{@page{margin:15mm;size:A4}.no-print{display:none!important}}</style></head>
      <body><div class="no-print" style="text-align:center;margin-bottom:24px;"><button onclick="window.print()" style="background:#D4956A;color:#FFF;border:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">📄 Save as PDF</button></div>
      <div class="header"><div class="logo">INK<span>sight</span></div><div class="meta">Journal Export • ${range === 'today' ? 'Today' : range === '7days' ? 'Last 7 Days' : 'Last 30 Days'} • ${entries.length} entries</div></div>
      ${entriesHtml}
      <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #F1F5F9;font-size:11px;color:#94A3B8;">Generated by INKsight • phoros-code.github.io/INKsight</div>
      </body></html>`;
      
      const w = window.open('', '_blank', 'width=850,height=1100');
      if (w) { w.document.write(html); w.document.close(); setTimeout(() => { try { w.print(); } catch {} }, 1200); }
    }
  };

  // Cloud sync handler
  const handleCloudSync = (service: string) => {
    if (Platform.OS === 'web') {
      const allData = localStorage.getItem('inksight_web_data') || '{}';
      const blob = new Blob([allData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inksight_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert(`Data exported for ${service} sync. Upload this file to your ${service} storage.`);
    }
  };

  const handleLoadDemoData = () => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem('inksight_demo_seeded'); } catch {}
      webStore.clearAll();
      seedWebDemoData();
      setDemoLoaded(true);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleClearData = () => {
    if (Platform.OS === 'web') {
      if (!confirm('Are you sure you want to clear all journal data? This cannot be undone.')) return;
      webStore.clearAll();
      try { localStorage.removeItem('inksight_demo_seeded'); } catch {}
      setDemoLoaded(false);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  // Theme
  const bg = theme.background;
  const cardBg = theme.card;
  const textMain = theme.textMain;
  const textMuted = theme.textMuted;
  const primary = theme.primary;
  const isDark = theme.isDark;
  const borderColor = isDark ? '#FFFFFF0D' : '#00000008';

  const themeOptions: { key: ThemeName; label: string; preview: string; primaryColor: string }[] = [
    { key: 'sunset', label: 'Sunset Solace', preview: '#F5F2EE', primaryColor: '#E8A87C' },
    { key: 'midnight', label: 'Midnight Moss', preview: '#1E2A3A', primaryColor: '#7DBFA7' },
    { key: 'lavender', label: 'Lavender Lullaby', preview: '#F4F0F7', primaryColor: '#9A97C1' },
  ];

  const SUPPORT_RESOURCES = [
    { name: 'iCall (India)', phone: '9152987821', desc: 'Mon-Sat, 8am-10pm IST' },
    { name: 'Vandrevala Foundation', phone: '18005990019', desc: '24/7, Free' },
    { name: 'AASRA', phone: '9820466726', desc: '24/7 Crisis Helpline' },
    { name: 'Crisis Text Line', phone: '', desc: 'Text HOME to 741741', link: 'https://www.crisistextline.org' },
    { name: '988 Suicide & Crisis Lifeline (US)', phone: '988', desc: '24/7, Free' },
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

        {/* ═══════ PROFILE CARD ═══════ */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: cardBg, borderColor }]}
          onPress={() => setProfileExpanded(!profileExpanded)}
          activeOpacity={0.8}
        >
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profileAvatar as any} />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: primary }]}>
              <Text style={[styles.profileAvatarText, { color: theme.primaryButtonText }]}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textMain }]}>{userName}</Text>
            <Text style={[styles.profileMeta, { color: textMuted }]}>Journaling since March 2025</Text>
            <Text style={[styles.profileStats, { color: primary }]}>{entryCount} entries · {streak}-day streak</Text>
          </View>
          <MaterialIcons name={profileExpanded ? 'expand-less' : 'chevron-right'} size={24} color={textMuted} />
        </TouchableOpacity>

        {/* Profile Expanded Panel */}
        {profileExpanded && (
          <View style={[styles.expandedPanel, { backgroundColor: isDark ? '#1A2535' : '#F8F7F5', borderColor }]}>
            {/* Edit Name */}
            <View style={styles.panelRow}>
              <MaterialIcons name="person" size={18} color={textMuted} />
              {editingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={[styles.nameInput, { color: textMain, borderColor: primary }]}
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Your name"
                    placeholderTextColor={textMuted + '80'}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => saveName(userName)} style={[styles.miniBtn, { backgroundColor: primary }]}>
                    <MaterialIcons name="check" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditingName(true)} style={styles.panelRowContent}>
                  <Text style={[styles.panelLabel, { color: textMain }]}>Edit Name</Text>
                  <Text style={[styles.panelValue, { color: textMuted }]}>{userName}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Change PFP */}
            <TouchableOpacity style={styles.panelRow} onPress={handlePfpUpload}>
              <MaterialIcons name="camera-alt" size={18} color={textMuted} />
              <Text style={[styles.panelLabel, { color: textMain }]}>Change Profile Picture</Text>
              <MaterialIcons name="chevron-right" size={20} color={textMuted} />
            </TouchableOpacity>

            {/* Journal Reminders */}
            <View style={styles.panelRow}>
              <MaterialIcons name="notifications-active" size={18} color={textMuted} />
              <Text style={[styles.panelLabel, { color: textMain, flex: 1 }]}>Daily Journal Reminder</Text>
              <Switch
                value={remindersEnabled}
                onValueChange={(v) => { setRemindersEnabled(v); setLS('inksight_reminders', v); }}
                trackColor={{ false: isDark ? '#4A5568' : '#CBD5E1', true: primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Logout */}
            {!showLogoutConfirm ? (
              <TouchableOpacity style={styles.panelRow} onPress={() => setShowLogoutConfirm(true)}>
                <MaterialIcons name="logout" size={18} color="#E07A5F" />
                <Text style={[styles.panelLabel, { color: '#E07A5F' }]}>Log Out & Reset</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.logoutConfirm, { backgroundColor: '#E07A5F10', borderColor: '#E07A5F30' }]}>
                <Text style={[styles.logoutWarning, { color: '#E07A5F' }]}>This will delete all data and start fresh. Are you sure?</Text>
                <View style={styles.logoutBtns}>
                  <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: '#E07A5F' }]} onPress={handleLogout}>
                    <Text style={styles.logoutBtnText}>Yes, Log Out</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} onPress={() => setShowLogoutConfirm(false)}>
                    <Text style={[styles.logoutBtnText, { color: textMain }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ═══════ PRIVACY & SECURITY ═══════ */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>PRIVACY & SECURITY</Text>
          <View style={styles.sectionItems}>
            {/* Passcode Lock */}
            <View style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="lock" size={20} color={textMuted} />
                <Text style={[styles.settingLabel, { color: textMain }]}>Passcode Lock</Text>
              </View>
              <Switch
                value={passcodeEnabled}
                onValueChange={handlePasscodeToggle}
                trackColor={{ false: isDark ? '#4A5568' : '#CBD5E1', true: primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Passcode Setup UI */}
            {showPasscodeSetup && (
              <View style={[styles.passcodePanel, { backgroundColor: isDark ? '#1A2535' : '#F8F7F5', borderColor }]}>
                <Text style={[styles.passcodeTitle, { color: textMain }]}>
                  {passcodeStep === 'set' ? '🔐 Set a 4-digit passcode' : '🔁 Confirm your passcode'}
                </Text>
                <TouchableOpacity activeOpacity={1} style={styles.passcodeInputRow} onPress={() => passcodeRef.current?.focus()}>
                  {[0, 1, 2, 3].map(i => (
                    <View key={i} style={[styles.passcodeDot, { borderColor: primary, backgroundColor: passcodeInput.length > i ? primary : 'transparent' }]} />
                  ))}
                </TouchableOpacity>
                <TextInput
                  ref={passcodeRef}
                  style={[styles.hiddenInput, { color: textMain }]}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={passcodeInput}
                  onChangeText={(t) => { const nums = t.replace(/\D/g, ''); setPasscodeInput(nums); }}
                  autoFocus
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.passcodeBtn, { backgroundColor: primary, opacity: passcodeInput.length === 4 ? 1 : 0.5 }]}
                  onPress={handlePasscodeSet}
                  disabled={passcodeInput.length !== 4}
                >
                  <Text style={styles.passcodeBtnText}>{passcodeStep === 'set' ? 'Next' : 'Confirm'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPasscodeSetup(false)}>
                  <Text style={[styles.passcodeCancelText, { color: textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Reset Passcode */}
            {passcodeEnabled && !showPasscodeSetup && (
              <TouchableOpacity
                style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}
                onPress={() => setShowResetPasscode(true)}
              >
                <View style={styles.settingLeft}>
                  <MaterialIcons name="lock-reset" size={20} color={textMuted} />
                  <Text style={[styles.settingLabel, { color: textMain }]}>Reset Passcode</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={textMuted} />
              </TouchableOpacity>
            )}

            {showResetPasscode && (
              <View style={[styles.logoutConfirm, { backgroundColor: primary + '10', borderColor: primary + '30' }]}>
                <Text style={[styles.logoutWarning, { color: primary }]}>Reset your passcode? You'll need to set a new one.</Text>
                <View style={styles.logoutBtns}>
                  <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: primary }]} onPress={handleResetPasscode}>
                    <Text style={styles.logoutBtnText}>Yes, Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} onPress={() => setShowResetPasscode(false)}>
                    <Text style={[styles.logoutBtnText, { color: textMain }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Biometrics */}
            <View style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="fingerprint" size={20} color={textMuted} />
                <Text style={[styles.settingLabel, { color: textMain }]}>Face ID / Biometrics</Text>
              </View>
              <Switch
                value={biometrics}
                onValueChange={setBiometrics}
                trackColor={{ false: isDark ? '#4A5568' : '#CBD5E1', true: primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ═══════ YOUR DATA ═══════ */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>YOUR DATA</Text>
          <View style={styles.sectionItems}>
            {/* Sync to Cloud */}
            <TouchableOpacity style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]} onPress={() => setShowCloudPanel(!showCloudPanel)}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="cloud-upload" size={20} color={textMuted} />
                <Text style={[styles.settingLabel, { color: textMain }]}>Sync to Cloud</Text>
              </View>
              <MaterialIcons name={showCloudPanel ? 'expand-less' : 'chevron-right'} size={24} color={textMuted} />
            </TouchableOpacity>

            {showCloudPanel && (
              <View style={[styles.expandedPanel, { backgroundColor: isDark ? '#1A2535' : '#F8F7F5', borderColor }]}>
                <Text style={[styles.panelHint, { color: textMuted }]}>Export your data to back it up to cloud storage</Text>
                {['Google Drive', 'iCloud', 'OneDrive', 'Dropbox'].map(service => (
                  <TouchableOpacity key={service} style={styles.panelRow} onPress={() => handleCloudSync(service)}>
                    <MaterialIcons name="cloud-done" size={18} color={primary} />
                    <Text style={[styles.panelLabel, { color: textMain }]}>Backup for {service}</Text>
                    <MaterialIcons name="file-download" size={18} color={textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Export Journal */}
            <TouchableOpacity style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]} onPress={() => setShowExportPanel(!showExportPanel)}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="file-download" size={20} color={textMuted} />
                <Text style={[styles.settingLabel, { color: textMain }]}>Export Journal (PDF/CSV)</Text>
              </View>
              <MaterialIcons name={showExportPanel ? 'expand-less' : 'chevron-right'} size={24} color={textMuted} />
            </TouchableOpacity>

            {showExportPanel && (
              <View style={[styles.expandedPanel, { backgroundColor: isDark ? '#1A2535' : '#F8F7F5', borderColor }]}>
                <Text style={[styles.panelHint, { color: textMuted }]}>Choose a date range and format</Text>
                {([['today', 'Today'], ['7days', 'Last 7 Days'], ['30days', 'Last 30 Days']] as const).map(([range, label]) => (
                  <View key={range} style={styles.exportRow}>
                    <Text style={[styles.panelLabel, { color: textMain, flex: 1 }]}>{label}</Text>
                    <TouchableOpacity style={[styles.exportBtn, { backgroundColor: primary + '15' }]} onPress={() => handleExport(range, 'pdf')}>
                      <Text style={[styles.exportBtnText, { color: primary }]}>📄 PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.exportBtn, { backgroundColor: primary + '15' }]} onPress={() => handleExport(range, 'csv')}>
                      <Text style={[styles.exportBtnText, { color: primary }]}>📊 CSV</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ═══════ EXPERIENCE ═══════ */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: textMuted }]}>EXPERIENCE</Text>
          <View style={styles.sectionItems}>
            <TouchableOpacity style={[styles.settingRow, { backgroundColor: cardBg, borderColor }]} onPress={() => setShowThemePicker(!showThemePicker)}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="palette" size={20} color={textMuted} />
                <Text style={[styles.settingLabel, { color: textMain }]}>App Theme</Text>
              </View>
              <View style={styles.navValueRow}>
                <Text style={[styles.navValueText, { color: primary }]}>{theme.label}</Text>
                <MaterialIcons name={showThemePicker ? 'expand-less' : 'expand-more'} size={24} color={textMuted} />
              </View>
            </TouchableOpacity>

            {showThemePicker && (
              <View style={[styles.themePickerContainer, { backgroundColor: isDark ? '#1A2535' : '#F8F7F5', borderColor }]}>
                {themeOptions.map(opt => {
                  const isActive = themeName === opt.key;
                  return (
                    <TouchableOpacity key={opt.key} style={[styles.themeOption, { backgroundColor: cardBg, borderColor: isActive ? opt.primaryColor : borderColor }, isActive && { borderWidth: 2 }]} onPress={() => setTheme(opt.key)} activeOpacity={0.8}>
                      <View style={styles.themePreviewRow}>
                        <View style={[styles.themeSwatch, { backgroundColor: opt.preview, borderWidth: 1, borderColor: '#00000015' }]} />
                        <View style={[styles.themeSwatch, { backgroundColor: opt.primaryColor }]} />
                      </View>
                      <Text style={[styles.themeOptionLabel, { color: isActive ? opt.primaryColor : textMain }]}>{opt.label}</Text>
                      {isActive && <View style={[styles.activeCheck, { backgroundColor: opt.primaryColor }]}><MaterialIcons name="check" size={12} color="#FFF" /></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ═══════ DEVELOPER ═══════ */}
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

        {/* ═══════ YOU'RE NOT ALONE ═══════ */}
        <View style={[styles.crisisCard, { backgroundColor: isDark ? '#253447' : '#F0F6FB', borderLeftColor: primary }]}>
          <View style={styles.crisisRow}>
            <View style={[styles.crisisIcon, { backgroundColor: isDark ? '#1E2A3A' : '#FFFFFFCC' }]}>
              <MaterialIcons name="favorite" size={24} color={primary} />
            </View>
            <View style={styles.crisisContent}>
              <Text style={[styles.crisisTitle, { color: textMain }]}>You're not alone</Text>
              <Text style={[styles.crisisDesc, { color: textMuted }]}>
                Feeling overwhelmed? Reach out to trained professionals who are here to help, anytime.
              </Text>
              <TouchableOpacity style={[styles.crisisBtn, { backgroundColor: primary }]} onPress={() => setShowSupportLinks(!showSupportLinks)} activeOpacity={0.9}>
                <Text style={[styles.crisisBtnText, { color: theme.primaryButtonText }]}>{showSupportLinks ? 'Hide Resources' : 'Connect to Support'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showSupportLinks && (
            <View style={styles.supportList}>
              {SUPPORT_RESOURCES.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.supportItem, { backgroundColor: isDark ? '#1E2A3A' : '#FFFFFF', borderColor }]}
                  onPress={() => {
                    if (r.phone && Platform.OS === 'web') {
                      window.open(`tel:${r.phone}`, '_self');
                    } else if (r.link && Platform.OS === 'web') {
                      window.open(r.link, '_blank');
                    }
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.supportName, { color: textMain }]}>{r.name}</Text>
                    <Text style={[styles.supportDesc, { color: textMuted }]}>{r.desc}</Text>
                  </View>
                  {r.phone ? (
                    <View style={[styles.callBadge, { backgroundColor: primary + '15' }]}>
                      <MaterialIcons name="phone" size={14} color={primary} />
                      <Text style={[styles.callText, { color: primary }]}>{r.phone}</Text>
                    </View>
                  ) : (
                    <MaterialIcons name="open-in-new" size={18} color={primary} />
                  )}
                </TouchableOpacity>
              ))}
              <View style={[styles.emergencyBanner, { backgroundColor: '#E07A5F15' }]}>
                <MaterialIcons name="warning" size={18} color="#E07A5F" />
                <Text style={{ color: '#E07A5F', fontFamily: 'Inter_500Medium', fontSize: 12, flex: 1 }}>
                  If in immediate danger, call your local emergency services (112 / 911)
                </Text>
              </View>
            </View>
          )}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 },
  headerTitle: { fontFamily: 'Nunito_700Bold', fontSize: 24, fontWeight: '700' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileAvatarText: { fontFamily: 'Nunito_700Bold', fontSize: 24 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: 'Nunito_600SemiBold', fontSize: 18, fontWeight: '600' },
  profileMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  profileStats: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4, fontWeight: '500' },

  expandedPanel: { marginHorizontal: 16, borderRadius: 16, padding: 12, gap: 4, borderWidth: 1, marginTop: 8 },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  panelRowContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, fontWeight: '500', flex: 1 },
  panelValue: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  panelHint: { fontFamily: 'Inter_400Regular', fontSize: 12, paddingHorizontal: 12, marginBottom: 4 },
  nameEditRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  miniBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  logoutConfirm: { marginHorizontal: 16, borderRadius: 12, padding: 16, borderWidth: 1, marginTop: 8, gap: 12 },
  logoutWarning: { fontFamily: 'Inter_500Medium', fontSize: 13, fontWeight: '500', textAlign: 'center' },
  logoutBtns: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  logoutBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  logoutBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, fontWeight: '600', color: '#FFF' },

  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, textTransform: 'uppercase' as any, letterSpacing: 1.5, marginBottom: 12, paddingHorizontal: 8, fontWeight: '600' },
  sectionItems: { gap: 8 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 52, borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontFamily: 'Inter_500Medium', fontSize: 15, fontWeight: '500' },
  navValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navValueText: { fontFamily: 'Inter_500Medium', fontSize: 13, fontWeight: '500' },

  // Passcode
  passcodePanel: { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center', gap: 16 },
  passcodeTitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, fontWeight: '600' },
  passcodeInputRow: { flexDirection: 'row', gap: 16 },
  passcodeDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  hiddenInput: { position: 'absolute', opacity: 0.01, width: 1, height: 1 },
  passcodeBtn: { paddingHorizontal: 32, paddingVertical: 10, borderRadius: 12 },
  passcodeBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, fontWeight: '600', color: '#FFF' },
  passcodeCancelText: { fontFamily: 'Inter_500Medium', fontSize: 13, fontWeight: '500', marginTop: 4 },

  // Export
  exportRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12 },
  exportBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  exportBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, fontWeight: '600' },

  // Theme
  themePickerContainer: { borderRadius: 16, padding: 12, gap: 8, borderWidth: 1 },
  themeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  themePreviewRow: { flexDirection: 'row', gap: 4 },
  themeSwatch: { width: 24, height: 24, borderRadius: 6 },
  themeOptionLabel: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, fontWeight: '600' },
  activeCheck: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Crisis
  crisisCard: { marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 20, borderLeftWidth: 4 },
  crisisRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  crisisIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  crisisContent: { flex: 1 },
  crisisTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  crisisDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  crisisBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start' },
  crisisBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, fontWeight: '500' },

  supportList: { marginTop: 16, gap: 8 },
  supportItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  supportName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, fontWeight: '600' },
  supportDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  callBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  callText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, fontWeight: '600' },
  emergencyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginTop: 4 },

  versionSection: { alignItems: 'center', paddingVertical: 24 },
  versionText: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 2, fontWeight: '500' },
  versionSub: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
});
