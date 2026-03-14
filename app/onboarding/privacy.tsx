import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeHaptics as Haptics } from '../../src/utils/webSafe';
import { Colors } from '../../src/constants/colors';
import { BreathingCircle } from '../../src/components/ui/BreathingCircle';

export default function PrivacyScreen() {
  const router = useRouter();

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/emotion-check');
  };

  const handlePrivacyDetails = () => {
    // Open a modal later if needed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <BreathingCircle size={100} color={Colors.secondary} duration={4000} />
          <Feather name="lock" size={48} color={Colors.secondary} style={styles.lockIcon} />
        </View>
        <Text style={styles.heading}>Your words never leave your device.</Text>
      </View>

      <View style={styles.featureList}>
        <View style={styles.featureRow}>
          <View style={styles.featureIconBox}>
            <Feather name="shield" size={20} color={Colors.primary} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>End-to-end encrypted locally</Text>
            <Text style={styles.featureDesc}>Secured with your biometric data.</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIconBox}>
            <Feather name="wifi-off" size={20} color={Colors.primary} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>100% offline, always</Text>
            <Text style={styles.featureDesc}>No clouds, no servers. It lives here.</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIconBox}>
            <Feather name="eye-off" size={20} color={Colors.primary} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>No account. No tracking.</Text>
            <Text style={styles.featureDesc}>Just open the app and start writing.</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.secondaryLink} onPress={handlePrivacyDetails}>
          <Text style={styles.secondaryLinkText}>How does this work?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
          <Text style={styles.ctaText}>I Feel Safe Here</Text>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 50,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIcon: {
    position: 'absolute',
  },
  heading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 34,
  },
  featureList: {
    flex: 1,
    justifyContent: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bottomSection: {
    alignItems: 'center',
  },
  secondaryLink: {
    marginBottom: 24,
  },
  secondaryLinkText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    height: 56,
    width: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  ctaText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4DEE8',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
});
