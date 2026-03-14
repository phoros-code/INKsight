const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve native-only packages gracefully on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Modules that should silently resolve to empty on web
    const nativeOnlyModules = [
      'expo-sqlite',
      'react-native-mmkv',
      '@react-native-community/slider',
      'react-native-worklets',
      'lottie-react-native',
      '@shopify/react-native-skia',
      'victory-native',
      'expo-haptics',
      'expo-local-authentication',
      'react-native-view-shot',
      'expo-file-system',
      'expo-sharing',
    ];
    if (nativeOnlyModules.some(m => moduleName.startsWith(m))) {
      return {
        filePath: require.resolve('./src/utils/emptyModule.js'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
