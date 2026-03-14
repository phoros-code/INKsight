import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../src/components/ui/FloatingTabBar';
import { Colors } from '../../src/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="flow" options={{ title: 'Flow' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Profile hidden — Settings is the main profile/settings screen */}
      <Tabs.Screen name="profile" options={{ title: 'Profile', href: null }} />
    </Tabs>
  );
}
