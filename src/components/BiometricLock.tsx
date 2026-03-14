import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { BreathingCircle } from './ui/BreathingCircle';

interface BiometricLockProps {
  onUnlock: () => void;
}

export const BiometricLock: React.FC<BiometricLockProps> = ({ onUnlock }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const authenticate = async () => {
    setErrorMsg(null);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        // Fallback or bypass if biometrics are not set up on device
        console.warn('Biometrics not available or not enrolled.');
        onUnlock();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock INKsight',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onUnlock();
      } else {
        setErrorMsg('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Biometric Auth Error:', err);
      setErrorMsg('An error occurred.');
    }
  };

  useEffect(() => {
    // Auto-trigger on mount
    authenticate();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <BreathingCircle size={160} color={Colors.emotionCalm} duration={3000} />
          <Feather name="fingerprint" size={80} color={Colors.secondary} style={styles.icon} />
        </View>

        <Text style={styles.title}>INKsight</Text>
        <Text style={styles.subtext}>
          {errorMsg ? errorMsg : 'Touch to unlock'}
        </Text>

        {errorMsg && (
          <TouchableOpacity style={styles.retryButton} onPress={authenticate}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    width: 200,
    marginBottom: 40,
  },
  icon: {
    position: 'absolute',
  },
  title: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtext: {
    fontFamily: 'Lora',
    fontStyle: 'italic',
    fontSize: 15,
    color: '#8AA8C4',
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
  },
  retryText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#FFFFFF',
    fontSize: 16,
  },
});
