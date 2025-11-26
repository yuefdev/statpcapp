import { Animated, Easing } from 'react-native';

// Stil Tipleri
export type WidgetStyleType = 'modern' | 'glass' | 'neon' | 'minimal' | 'gradient' | 'cyber';

// Her stil için renk şeması
export interface StyleColors {
  background: string;
  border: string;
  text: string;
  accent: string;
  secondary: string;
}

// Rengi HEX'ten RGB'ye çevir
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Rengi açık/koyu tonlara çevir
export const adjustColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// ==========================================
// STİL TANIMLARI
// ==========================================

export const getStyleConfig = (style: WidgetStyleType, accentColor: string) => {
  const rgb = hexToRgb(accentColor);
  
  switch (style) {
    // ==========================================
    // 1. MODERN - Yumuşak gradientler, soft shadows
    // ==========================================
    case 'modern':
      return {
        container: {
          backgroundColor: `rgba(25, 20, 45, 0.95)`,
          borderRadius: 20,
          borderWidth: 0,
          borderColor: 'transparent',
          padding: 14,
          // Soft shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        },
        innerGlow: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        accentBar: {
          position: 'absolute' as const,
          left: 0,
          top: 12,
          bottom: 12,
          width: 4,
          backgroundColor: accentColor,
          borderRadius: 2,
        },
        title: { color: accentColor, fontSize: 13, fontWeight: '700' as const },
        subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 8 },
        value: { color: '#ffffff', fontSize: 32, fontWeight: '700' as const },
        label: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
      };

    // ==========================================
    // 2. GLASS - Cam efekti, blur, parlak kenarlar
    // ==========================================
    case 'glass':
      return {
        container: {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          padding: 14,
          // Glossy highlight
          shadowColor: '#fff',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 0,
          elevation: 0,
        },
        innerGlow: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        accentBar: {
          position: 'absolute' as const,
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`,
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
        },
        glassShine: {
          position: 'absolute' as const,
          top: 8,
          right: 8,
          width: 40,
          height: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 20,
        },
        title: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' as const },
        subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 8 },
        value: { color: '#ffffff', fontSize: 30, fontWeight: '300' as const },
        label: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
      };

    // ==========================================
    // 3. NEON - Parlayan kenarlar, pulsing glow
    // ==========================================
    case 'neon':
      return {
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: accentColor,
          padding: 14,
          // Neon glow
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20,
          elevation: 15,
        },
        innerGlow: null,
        accentBar: null,
        outerGlow: {
          position: 'absolute' as const,
          top: -4,
          left: -4,
          right: -4,
          bottom: -4,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
        },
        title: { color: accentColor, fontSize: 14, fontWeight: '800' as const, textShadowColor: accentColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
        subtitle: { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`, fontSize: 8 },
        value: { color: '#ffffff', fontSize: 34, fontWeight: '700' as const, textShadowColor: accentColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
        label: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
      };

    // ==========================================
    // 4. MINIMAL - Sadece çizgiler, şeffaf
    // ==========================================
    case 'minimal':
      return {
        container: {
          backgroundColor: 'transparent',
          borderRadius: 0,
          borderWidth: 0,
          borderColor: 'transparent',
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        },
        innerGlow: null,
        accentBar: {
          position: 'absolute' as const,
          left: 0,
          top: 0,
          width: 2,
          height: 24,
          backgroundColor: accentColor,
        },
        title: { color: accentColor, fontSize: 11, fontWeight: '500' as const, letterSpacing: 2 },
        subtitle: { color: 'rgba(255,255,255,0.3)', fontSize: 7, letterSpacing: 1 },
        value: { color: '#ffffff', fontSize: 28, fontWeight: '200' as const },
        label: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      };

    // ==========================================
    // 5. GRADIENT - Animasyonlu renk geçişleri
    // ==========================================
    case 'gradient':
      const gradientEnd = adjustColor(accentColor, 60);
      return {
        container: {
          backgroundColor: 'transparent',
          borderRadius: 20,
          borderWidth: 0,
          padding: 14,
          overflow: 'hidden' as const,
        },
        gradientColors: [
          `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
          `rgba(${rgb.r + 30}, ${rgb.g + 30}, ${rgb.b + 30}, 0.15)`,
        ],
        innerGlow: {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
        },
        accentBar: null,
        shimmer: {
          position: 'absolute' as const,
          top: 0,
          left: -100,
          width: 100,
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          transform: [{ skewX: '-20deg' }],
        },
        title: { color: '#ffffff', fontSize: 13, fontWeight: '700' as const },
        subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 8 },
        value: { color: '#ffffff', fontSize: 32, fontWeight: '700' as const },
        label: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
      };

    // ==========================================
    // 6. CYBER - Keskin köşeler, grid pattern, futuristik
    // ==========================================
    case 'cyber':
      return {
        container: {
          backgroundColor: 'rgba(10, 15, 30, 0.95)',
          borderRadius: 4,
          borderWidth: 1,
          borderColor: accentColor,
          padding: 14,
          // Clip corners effect
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 10,
        },
        cornerCut: {
          topRight: {
            position: 'absolute' as const,
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid' as const,
            borderRightWidth: 20,
            borderTopWidth: 20,
            borderRightColor: 'transparent',
            borderTopColor: '#0a0a1a',
          },
          bottomLeft: {
            position: 'absolute' as const,
            bottom: 0,
            left: 0,
            width: 0,
            height: 0,
            borderStyle: 'solid' as const,
            borderLeftWidth: 20,
            borderBottomWidth: 20,
            borderLeftColor: 'transparent',
            borderBottomColor: '#0a0a1a',
          }
        },
        innerGlow: null,
        accentBar: null,
        scanline: {
          position: 'absolute' as const,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
        },
        gridPattern: true,
        title: { color: accentColor, fontSize: 12, fontWeight: '700' as const, letterSpacing: 3, textTransform: 'uppercase' as const },
        subtitle: { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`, fontSize: 7, letterSpacing: 2 },
        value: { color: '#ffffff', fontSize: 30, fontWeight: '700' as const, fontFamily: 'monospace' },
        label: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'monospace' },
        dataPrefix: '> ',
      };

    default:
      return getStyleConfig('modern', accentColor);
  }
};

// ==========================================
// ANİMASYON HOOK'LARI
// ==========================================

export const createNeonPulse = () => {
  const pulseAnim = new Animated.Value(0.6);
  
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.6,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  ).start();
  
  return pulseAnim;
};

export const createGradientShimmer = () => {
  const shimmerAnim = new Animated.Value(-100);
  
  Animated.loop(
    Animated.timing(shimmerAnim, {
      toValue: 300,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();
  
  return shimmerAnim;
};

export const createCyberScanline = () => {
  const scanAnim = new Animated.Value(0);
  
  Animated.loop(
    Animated.timing(scanAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();
  
  return scanAnim;
};

export const createGlassFloat = () => {
  const floatAnim = new Animated.Value(0);
  
  Animated.loop(
    Animated.sequence([
      Animated.timing(floatAnim, {
        toValue: -3,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(floatAnim, {
        toValue: 0,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  ).start();
  
  return floatAnim;
};
