import { useEffect, useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { AmoledProtectionConfig } from '../types';

interface UseAmoledProtectionReturn {
  offsetX: Animated.Value;
  offsetY: Animated.Value;
  opacity: Animated.Value;
  isBlackout: boolean;
}

export const useAmoledProtection = (config: AmoledProtectionConfig): UseAmoledProtectionReturn => {
  const offsetX = useRef(new Animated.Value(0)).current;
  const offsetY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const isBlackoutRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performPixelShift = useCallback(() => {
    const intensity = config.shakeIntensity;
    const newX = (Math.random() - 0.5) * intensity * 2;
    const newY = (Math.random() - 0.5) * intensity * 2;

    Animated.parallel([
      Animated.timing(offsetX, {
        toValue: newX,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(offsetY, {
        toValue: newY,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [config.shakeIntensity, offsetX, offsetY]);

  const performShake = useCallback(() => {
    const intensity = config.shakeIntensity;
    
    Animated.sequence([
      Animated.timing(offsetX, {
        toValue: intensity,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(offsetX, {
        toValue: -intensity,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(offsetX, {
        toValue: intensity / 2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(offsetX, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [config.shakeIntensity, offsetX]);

  const performBlackout = useCallback(() => {
    isBlackoutRef.current = true;

    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(config.duration * 1000),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isBlackoutRef.current = false;
    });
  }, [config.duration, opacity]);

  const runProtection = useCallback(() => {
    if (!config.enabled) return;

    switch (config.mode) {
      case 'pixelShift':
        performPixelShift();
        break;
      case 'shake':
        performShake();
        break;
      case 'blackout':
        performBlackout();
        break;
    }
  }, [config.enabled, config.mode, performPixelShift, performShake, performBlackout]);

  useEffect(() => {
    if (!config.enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // İlk çalıştırma için küçük bir delay
    const initialTimeout = setTimeout(() => {
      runProtection();
    }, 1000);

    // Periyodik çalıştırma
    intervalRef.current = setInterval(() => {
      runProtection();
    }, config.interval * 60 * 1000); // dakika -> milisaniye

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.enabled, config.interval, runProtection]);

  return {
    offsetX,
    offsetY,
    opacity,
    isBlackout: isBlackoutRef.current,
  };
};

export default useAmoledProtection;
