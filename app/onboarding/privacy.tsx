import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);

  const features = [
    { icon: 'shield' as const, title: 'End-to-end encrypted locally', desc: 'Your private data is never readable by others' },
    { icon: 'wifi-off' as const, title: '100% offline, always', desc: 'Works without internet or data collection' },
    { icon: 'fingerprint' as const, title: 'Biometric lock protection', desc: 'Keep your diary safe with FaceID or TouchID' },
  ];

  return (
    <View style={styles.container}>
      {/* Header with back button and dots */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <View style={styles.progressDots}>
          <View style={[styles.dot, { backgroundColor: Colors.dotInactive }]} />
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: Colors.dotInactive }]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Icon */}
        <View style={styles.heroIcon}>
          <View style={styles.iconGlow} />
          <MaterialIcons name="lock" size={64} color={Colors.sage} />
        </View>

        {/* Content */}
        <View style={styles.textContent}>
          <Text style={styles.headline}>Your words never leave your device.</Text>
          <Text style={styles.description}>
            INKsight works entirely offline. No account required. No cloud sync. Protected by biometric lock.
          </Text>
        </View>

        {/* Feature Rows */}
        <View style={styles.featureRows}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBg}>
                <MaterialIcons name={f.icon} size={18} color={Colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/onboarding/emotion-check')}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>I Feel Safe Here</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowInfo(!showInfo)}>
          <Text style={styles.linkText}>{showInfo ? 'Hide details' : 'How does this work?'}</Text>
        </TouchableOpacity>

        {showInfo && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              INKsight uses your device's secure local storage to save your entries. 
              We don't have servers, so your data physically cannot be accessed by us or anyone else. 
              Your mind remains your own private sanctuary.
            </Text>
          </View>
        )}

        <Text style={styles.copyrightText}>Copyright © 2026 INKsight</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.sage,
    opacity: 0.15,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  headline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Lora_400Regular',
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 300,
  },
  featureRows: {
    marginTop: 40,
    paddingHorizontal: 24,
    gap: 16,
    flex: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 8,
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  featureDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  linkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  infoBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textDark,
    lineHeight: 20,
    textAlign: 'center',
  },
  copyrightText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 24,
    textAlign: 'center',
  },
});
