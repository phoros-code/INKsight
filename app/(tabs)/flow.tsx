import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/colors';

export default function FlowScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flow</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Nunito_700Bold', fontSize: 24, color: Colors.textDark },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textMuted, marginTop: 8 },
});
