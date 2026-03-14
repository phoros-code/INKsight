import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Switch, Alert, TextInput, Platform 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

import { Colors } from '../../src/constants/colors';

// Platform-safe imports
let useSQLiteContext: any = () => ({ runAsync: async () => {}, getFirstAsync: async () => null, execAsync: async () => {} });
let MMKV: any = null;
let Haptics: any = { selectionAsync: () => {}, notificationAsync: () => {}, NotificationFeedbackType: { Success: 0, Warning: 1 } };
let Sharing: any = { shareAsync: async () => {} };
let FileSystem: any = { documentDirectory: '', writeAsStringAsync: async () => {} };
let LocalAuthentication: any = {};
let getStreakCount: any = async () => 0;
let seedDemoData: any = async () => {};

if (Platform.OS !== 'web') {
  useSQLiteContext = require('expo-sqlite').useSQLiteContext;
  MMKV = require('react-native-mmkv').MMKV;
  Haptics = require('expo-haptics');
  Sharing = require('expo-sharing');
  FileSystem = require('expo-file-system');
  LocalAuthentication = require('expo-local-authentication');
  getStreakCount = require('../../src/database/journalDB').getStreakCount;
  seedDemoData = require('../../src/utils/seedDemoData').seedDemoData;
}

// Web-safe MMKV mock
const storage = MMKV ? new MMKV() : {
  getString: (k: string) => null,
  getBoolean: (k: string) => false,
  set: (k: string, v: any) => {},
};

export default function SettingsScreen() {
  const router = useRouter();
  const db = Platform.OS !== 'web' ? useSQLiteContext() : null;
  
  // State
  const [userName, setUserName] = useState('Friend');
  const [isEditingName, setIsEditingName] = useState(false);
  const [journalStats, setJournalStats] = useState({ total: 0, firstDate: '', streak: 0 });
  
  // Toggles
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true); // Default true per spec
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = () => {
    setUserName(storage.getString('user_name') || 'Friend');
    setBiometricEnabled(storage.getBoolean('biometric_enabled') || false);
    setOfflineMode(storage.getBoolean('offline_mode') ?? true);
    setDarkMode(storage.getBoolean('dark_mode') || false);
    setNotificationsEnabled(storage.getBoolean('notifications_enabled') || false);
  };

  const loadStats = async () => {
    if (Platform.OS === 'web' || !db) return;
    try {
      const totalRes = await db.getFirstAsync('SELECT COUNT(*) as count FROM journal_entries');
      const firstRes = await db.getFirstAsync('SELECT date FROM journal_entries ORDER BY date ASC LIMIT 1');
      const streakValue = await getStreakCount(db);
      
      setJournalStats({
        total: totalRes?.count || 0,
        firstDate: firstRes?.date ? format(new Date(firstRes.date), 'MMMM yyyy') : 'Just started',
        streak: streakValue
      });
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    storage.set('user_name', userName.trim() || 'Friend');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // --- Toggle Handlers ---

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Not Available', 'Biometric authentication is not set up on this device.');
        return;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable lock',
      });
      
      if (result.success) {
        setBiometricEnabled(true);
        storage.set('biometric_enabled', true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
       setBiometricEnabled(false);
       storage.set('biometric_enabled', false);
    }
  };

  const toggleOffline = (val: boolean) => {
    setOfflineMode(val);
    storage.set('offline_mode', val);
    if (!val) {
      Alert.alert('Warning', 'INKsight is designed to be privacy-first. We recommend keeping offline mode ON.');
    }
  };

  // --- Actions ---

  const handleExportData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const entries = await db.getAllAsync('SELECT * FROM journal_entries ORDER BY date DESC');
      const checkins = await db.getAllAsync('SELECT * FROM daily_checkins ORDER BY date DESC');
      
      const exportObject = {
        exportedAt: new Date().toISOString(),
        entries,
        checkins
      };

      const fileUri = FileSystem.documentDirectory + `INKsight_Backup_${format(new Date(), 'yyyyMMdd')}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportObject, null, 2));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export INKsight Data'
        });
      } else {
        Alert.alert('Sharing not available', 'Unable to export file on this device.');
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export your data.');
      console.error(e);
    }
  };

  const handleDeleteAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete All Data',
      'This will permanently erase all journal entries, patterns, and settings on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.prompt('Confirm Deletion', 'Type DELETE to confirm', [
               { text: 'Cancel', style: 'cancel' },
               {
                 text: 'Confirm',
                 style: 'destructive',
                 onPress: async (text: string | undefined) => {
                    if (text === 'DELETE') {
                      try {
                        await db.execAsync('DELETE FROM journal_entries; DELETE FROM daily_checkins; DELETE FROM pattern_insights;');
                        loadStats();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('Data Erased', 'Your journal is completely clear.');
                      } catch(e) {
                        console.error('Del err', e);
                      }
                    } else {
                      Alert.alert('Cancelled', 'You did not type DELETE. Your data is safe.');
                    }
                 }
               }
            ]);
          }
        }
      ]
    );
  };

  const handleLoadDemoData = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Load Demo Data',
      'This will inject 30 days of journal entries and patterns for demo purposes. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Load Data', 
          onPress: async () => {
            try {
               await seedDemoData(db);
               loadStats();
               Alert.alert('Success', 'Demo data loaded! Check your Home and Insights tabs.');
            } catch(e) {
               console.error(e);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={[styles.pageTitle, { marginBottom: 0 }]}>Settings</Text>
        <TouchableOpacity onPress={() => router.push('/modals/safe-space')}>
           <Feather name="heart" size={24} color="#A0ADB8" />
        </TouchableOpacity>
      </View>

      {/* PROFILE CARD */}
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.avatar} onPress={() => setIsEditingName(true)}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
           {isEditingName ? (
             <TextInput
               style={styles.nameInput}
               value={userName}
               onChangeText={setUserName}
               onBlur={handleNameSave}
               autoFocus
               returnKeyType="done"
               maxLength={15}
             />
           ) : (
             <TouchableOpacity onPress={() => setIsEditingName(true)}>
               <Text style={styles.userName}>{userName}</Text>
             </TouchableOpacity>
           )}
           <Text style={styles.subText}>Journaling since {journalStats.firstDate}</Text>
           <Text style={styles.statsText}>{journalStats.total} entries · {journalStats.streak}-day streak</Text>
        </View>
      </View>

      {/* SECTION 1: PRIVACY & SECURITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>
        <View style={styles.sectionBox}>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primary }]}>
                <Feather name="lock" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.rowText}>Biometric Lock</Text>
            </View>
            <Switch 
              value={biometricEnabled} 
              onValueChange={toggleBiometric}
              trackColor={{ false: '#E0DAD3', true: Colors.secondary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.secondary }]}>
                <Feather name="smartphone" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.rowText}>Offline Only Mode</Text>
            </View>
            <Switch 
              value={offlineMode} 
              onValueChange={toggleOffline}
              trackColor={{ false: '#E0DAD3', true: Colors.secondary }}
            />
          </View>

        </View>
      </View>

      {/* SECTION 2: YOUR DATA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR DATA</Text>
        <View style={styles.sectionBox}>
          
          <TouchableOpacity style={styles.row} onPress={handleExportData}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.secondary }]}>
                <Feather name="upload" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.rowText}>Export My Journal</Text>
                <Text style={styles.rowSubtext}>{journalStats.total} entries found</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#A0ADB8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={handleDeleteAll}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.accent }]}>
                <Feather name="trash-2" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.rowText, { color: Colors.accent }]}>Delete All Data</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#A0ADB8" />
          </TouchableOpacity>

          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.row} onPress={handleLoadDemoData}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#7DBFA7' }]}>
                <Feather name="database" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.rowText}>Load Demo Data (Dev)</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#A0ADB8" />
          </TouchableOpacity>

        </View>
      </View>

      {/* SECTION 3: EXPERIENCE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EXPERIENCE</Text>
        <View style={styles.sectionBox}>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#A0ADB8' }]}>
                <Feather name="moon" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.rowText}>Dark Mode</Text>
            </View>
            <Switch 
              value={darkMode} 
              onValueChange={v => { setDarkMode(v); storage.set('dark_mode', v); }}
              trackColor={{ false: '#E0DAD3', true: Colors.secondary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#A0ADB8' }]}>
                <Feather name="bell" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.rowText}>Gentle Reminders</Text>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={v => { setNotificationsEnabled(v); storage.set('notifications_enabled', v); }}
              trackColor={{ false: '#E0DAD3', true: Colors.secondary }}
            />
          </View>

        </View>
      </View>

      {/* CRISIS SUPPORT CARD */}
      <View style={styles.crisisCard}>
        <View style={styles.crisisLeftBorder} />
        <View style={styles.crisisContent}>
           <Text style={styles.crisisTitle}>💙 You're not alone</Text>
           <Text style={styles.crisisDesc}>If you're feeling overwhelmed, immediate help is available.</Text>
           <Text style={styles.helplineText}>iCall Helpline: 9152987821</Text>
           <Text style={styles.helplineText}>Vandrevala Foundation: 1860-2662-345</Text>
        </View>
      </View>

      <Text style={styles.footerText}>INKsight v1.0.0 · Made with 💙</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#2C3E50',
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 32,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 4,
  },
  nameInput: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    padding: 0,
  },
  subText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  statsText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: '#A0ADB8',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 10,
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 54,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: '#2C3E50',
  },
  rowSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#A0ADB8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0EB',
    marginLeft: 60,
  },
  crisisCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF2F9', // Fallback, would be nice with gradient
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 30,
    overflow: 'hidden',
  },
  crisisLeftBorder: {
    width: 4,
    backgroundColor: Colors.secondary,
  },
  crisisContent: {
    flex: 1,
    padding: 20,
  },
  crisisTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#2C3E50',
    marginBottom: 6,
  },
  crisisDesc: {
    fontFamily: 'Lora_400Regular',
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  helplineText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 4,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#A0ADB8',
    textAlign: 'center',
  },
});
