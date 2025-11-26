import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import Video from 'react-native-video';
import { BackgroundConfig } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DynamicBackgroundProps {
  config: BackgroundConfig;
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ config }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: config.opacity,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [config.opacity, fadeAnim]);

  const getImageResizeMode = () => {
    switch (config.fit) {
      case 'contain':
        return 'contain';
      case 'stretch':
        return 'stretch';
      case 'center':
        return 'center';
      default:
        return 'cover';
    }
  };

  const renderBackground = () => {
    switch (config.type) {
      case 'color':
        return (
          <Animated.View 
            style={[
              styles.background, 
              { backgroundColor: config.value, opacity: fadeAnim }
            ]} 
          />
        );

      case 'image':
        // Base64 veya URL olabilir
        if (!config.value) return <View style={[styles.background, { backgroundColor: '#0f172a' }]} />;
        return (
          <Animated.View style={[styles.background, { opacity: fadeAnim }]}>
            <Image
              source={{ uri: config.value }}
              style={styles.media}
              resizeMode={getImageResizeMode()}
              blurRadius={config.blur || 0}
            />
          </Animated.View>
        );

      case 'gif':
        if (!config.value) return <View style={[styles.background, { backgroundColor: '#0f172a' }]} />;
        return (
          <Animated.View style={[styles.background, { opacity: fadeAnim }]}>
            <Image
              source={{ uri: config.value }}
              style={styles.media}
              resizeMode={getImageResizeMode()}
            />
          </Animated.View>
        );

      case 'video':
        if (!config.value) return <View style={[styles.background, { backgroundColor: '#0f172a' }]} />;
        return (
          <Animated.View style={[styles.background, { opacity: fadeAnim }]}>
            <Video
              source={{ uri: config.value }}
              style={styles.media}
              resizeMode={getImageResizeMode() as any}
              repeat={true}
              muted={true}
              playInBackground={false}
              playWhenInactive={false}
            />
          </Animated.View>
        );

      default:
        return (
          <View style={[styles.background, { backgroundColor: '#0f172a' }]} />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderBackground()}
      {/* Overlay for better widget visibility */}
      <View style={[styles.overlay, { opacity: 0.3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
});

export default DynamicBackground;
