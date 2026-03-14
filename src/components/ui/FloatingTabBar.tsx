/**
 * FloatingTabBar — Stitch: settings_premium_glassmorphism tab bar.
 * Dark pill (ink-dark/95), 5 tabs, center FAB with teal bg.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

// Tab config: name → icon
const TAB_CONFIG: Record<string, { icon: string; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  insights: { icon: 'bar-chart-2', label: 'Insights' },
  journal: { icon: 'plus', label: '' }, // Center FAB
  flow: { icon: 'trending-up', label: 'Flow' },
  settings: { icon: 'settings', label: 'Settings' },
};

// Tab display order
const TAB_ORDER = ['index', 'insights', 'journal', 'flow', 'settings'];

export const FloatingTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TAB_ORDER.map((tabName, idx) => {
          // Find the matching route
          const routeIndex = state.routes.findIndex(r => r.name === tabName);
          if (routeIndex < 0) return null;

          const route = state.routes[routeIndex];
          const config = TAB_CONFIG[tabName] || { icon: 'circle', label: tabName };
          const isFocused = state.index === routeIndex;
          const isFAB = tabName === 'journal';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isFAB) {
            // Stitch: w-12 h-12 bg-primary rounded-full -mt-8 border-4 border-background-light
            return (
              <TouchableOpacity
                key={tabName}
                onPress={onPress}
                style={styles.fabBtn}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tabName}
              onPress={onPress}
              style={styles.tabBtn}
              activeOpacity={0.7}
            >
              <Feather
                name={config.icon as any}
                size={24}
                color={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: '5%' as any,
    right: '5%' as any,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { position: 'fixed' as any, zIndex: 9990 } : {}),
  },
  // Stitch: bg-ink-dark/95 backdrop-blur-md rounded-full px-6 py-3
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(44, 62, 80, 0.95)',
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%' as any,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stitch: w-12 h-12 bg-primary rounded-full -mt-8 shadow-lg border-4 border-background-light
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7DBFA7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -32,
    borderWidth: 4,
    borderColor: '#F5F2EE',
    shadowColor: '#7DBFA7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
