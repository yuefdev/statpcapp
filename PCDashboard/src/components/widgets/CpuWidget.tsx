import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import LinearGradientBg from 'react-native-linear-gradient';
import { WidgetConfig, CpuData, WidgetStyleType } from '../../types';

interface CpuWidgetProps {
  config: WidgetConfig & { color?: string; style?: string };
  data: CpuData;
  globalStyle?: WidgetStyleType;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 168, g: 85, b: 247 };
};

const adjustColor = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const CpuWidget: React.FC<CpuWidgetProps> = ({ config, data, globalStyle }) => {
  const accentColor = (config as any).color || config.style?.accentColor || '#a855f7';
  const widgetStyle = (globalStyle || (config as any).style || 'modern') as WidgetStyleType;
  const rgb = hexToRgb(accentColor);
  const gradientEnd = adjustColor(accentColor, 50);

  // Animasyonlar
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(-150)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (widgetStyle === 'neon') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.timing(borderAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: false })
      ).start();
    }
    if (widgetStyle === 'gradient') {
      Animated.loop(
        Animated.timing(shimmerAnim, { toValue: 250, duration: 2000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }
    if (widgetStyle === 'cyber') {
      Animated.loop(
        Animated.timing(scanlineAnim, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: false })
      ).start();
    }
    if (widgetStyle === 'glass') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -3, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [widgetStyle]);

  const size = 55;
  const strokeWidth = widgetStyle === 'minimal' ? 3 : 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (data.usage / 100) * circumference;

  // Stil bazlı container
  const getContainerStyle = () => {
    const base = { flex: 1, padding: 14 };
    switch (widgetStyle) {
      case 'modern':
        return { ...base, backgroundColor: 'rgba(25, 20, 45, 0.95)', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 };
      case 'glass':
        return { ...base, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' };
      case 'neon':
        return { ...base, backgroundColor: 'rgba(0, 0, 0, 0.92)', borderRadius: 16, borderWidth: 2, borderColor: accentColor, shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 };
      case 'minimal':
        return { ...base, backgroundColor: 'transparent', borderRadius: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.15)', padding: 12 };
      case 'gradient':
        return { ...base, borderRadius: 20, overflow: 'hidden' as const };
      case 'cyber':
        return { ...base, backgroundColor: 'rgba(5, 10, 25, 0.95)', borderRadius: 4, borderWidth: 1, borderColor: accentColor, shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 };
      default:
        return { ...base, backgroundColor: 'rgba(25, 20, 45, 0.95)', borderRadius: 20 };
    }
  };

  // Gauge render
  const renderGauge = () => (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="cpuGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={accentColor} />
          <Stop offset="100%" stopColor={gradientEnd} />
        </LinearGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={widgetStyle === 'minimal' || widgetStyle === 'cyber' ? accentColor : "url(#cpuGrad)"}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap={widgetStyle === 'cyber' ? 'butt' : 'round'}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );

  // Progress bar render
  const renderProgressBar = () => {
    if (widgetStyle === 'cyber') {
      const segments = 12;
      const filledSegments = Math.floor((data.usage / 100) * segments);
      return (
        <View style={styles.cyberBarContainer}>
          {Array.from({ length: segments }).map((_, i) => (
            <View key={i} style={[styles.cyberSegment, { backgroundColor: i < filledSegments ? accentColor : 'rgba(255,255,255,0.1)' }]} />
          ))}
        </View>
      );
    }
    return (
      <View style={[styles.progressBarContainer, widgetStyle === 'minimal' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', height: 3 }]}>
        <View style={[
          styles.progressBar,
          { width: `${Math.min(data.usage, 100)}%`, backgroundColor: accentColor },
          widgetStyle === 'neon' && { shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 }
        ]} />
      </View>
    );
  };

  // Ana içerik
  const content = (
    <View style={styles.content}>
      {/* Modern - üst glow */}
      {widgetStyle === 'modern' && <View style={[styles.innerGlow, { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)` }]} />}
      {/* Modern - sol accent bar */}
      {widgetStyle === 'modern' && <View style={[styles.accentBar, { backgroundColor: accentColor }]} />}
      
      {/* Glass efektleri */}
      {widgetStyle === 'glass' && <View style={styles.glassShine} />}
      {widgetStyle === 'glass' && <View style={[styles.glassAccent, { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)` }]} />}
      
      {/* Neon outer glow */}
      {widgetStyle === 'neon' && <View style={[styles.neonOuterGlow, { borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` }]} />}
      
      {/* Minimal accent */}
      {widgetStyle === 'minimal' && <View style={[styles.minimalAccent, { backgroundColor: accentColor }]} />}

      {/* Cyber efektleri */}
      {widgetStyle === 'cyber' && (
        <>
          <Animated.View style={[styles.scanline, { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`, top: scanlineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 140] }) }]} />
          <View style={styles.gridOverlay}>
            {[0, 1, 2, 3, 4, 5].map(i => <View key={i} style={[styles.gridLine, { top: i * 25 }]} />)}
          </View>
          <View style={[styles.cornerTR, { borderTopColor: '#0a0a1a' }]} />
          <View style={[styles.cornerBL, { borderBottomColor: '#0a0a1a' }]} />
        </>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { color: accentColor },
          widgetStyle === 'cyber' && styles.cyberTitle,
          widgetStyle === 'neon' && { textShadowColor: accentColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
          widgetStyle === 'minimal' && { letterSpacing: 3, fontSize: 11 }
        ]}>
          {widgetStyle === 'cyber' ? '[ CPU ]' : 'CPU'}
        </Text>
        <Text style={[
          styles.subtitle,
          widgetStyle === 'cyber' && { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`, letterSpacing: 2 }
        ]}>
          {widgetStyle === 'cyber' ? 'PROC.UNIT' : 'CENTRAL PROCESSING UNIT'}
        </Text>
      </View>

      {/* CPU Name */}
      <Text style={[
        styles.cpuName,
        widgetStyle === 'cyber' && { fontFamily: 'monospace' }
      ]} numberOfLines={1}>
        {widgetStyle === 'cyber' ? '> ' : ''}{data.name || 'Unknown CPU'}
      </Text>

      {/* Usage with Gauge */}
      <View style={styles.gaugeRow}>
        <Text style={[
          styles.usageText,
          widgetStyle === 'minimal' && { fontWeight: '200', fontSize: 26 },
          widgetStyle === 'glass' && { fontWeight: '300' },
          widgetStyle === 'neon' && { textShadowColor: accentColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
          widgetStyle === 'cyber' && { fontFamily: 'monospace' }
        ]}>
          {widgetStyle === 'cyber' ? '> ' : ''}{Math.round(data.usage)}%
        </Text>
        {renderGauge()}
      </View>

      {renderProgressBar()}
    </View>
  );

  // Wrapper based on style
  if (widgetStyle === 'gradient') {
    return (
      <LinearGradientBg
        colors={[`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={getContainerStyle()}
      >
        <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerAnim }] }]} />
        <View style={[styles.gradientBorder, { borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)` }]} />
        {content}
      </LinearGradientBg>
    );
  }

  if (widgetStyle === 'glass') {
    return (
      <Animated.View style={[getContainerStyle(), { transform: [{ translateY: floatAnim }] }]}>
        {content}
      </Animated.View>
    );
  }

  if (widgetStyle === 'neon') {
    return (
      <Animated.View style={[getContainerStyle(), { opacity: pulseAnim }]}>
        {content}
      </Animated.View>
    );
  }

  return <View style={getContainerStyle()}>{content}</View>;
};

const styles = StyleSheet.create({
  content: { flex: 1, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: 'bold', marginRight: 8 },
  cyberTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 7, letterSpacing: 0.5 },
  cpuName: { color: '#ffffff', fontSize: 11, marginBottom: 8, opacity: 0.8 },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  usageText: { color: '#ffffff', fontSize: 30, fontWeight: 'bold' },
  progressBarContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },
  // Modern
  innerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  accentBar: { position: 'absolute', left: 0, top: 14, bottom: 14, width: 4, borderRadius: 2 },
  // Glass
  glassShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  glassAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  // Neon
  neonOuterGlow: { position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: 21, borderWidth: 1 },
  // Minimal
  minimalAccent: { position: 'absolute', left: 0, top: 0, width: 2, height: 24 },
  // Gradient
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: 'rgba(255, 255, 255, 0.15)', transform: [{ skewX: '-20deg' }] },
  gradientBorder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, borderWidth: 2 },
  // Cyber
  cyberBarContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 6 },
  cyberSegment: { flex: 1, marginHorizontal: 1 },
  scanline: { position: 'absolute', left: 0, right: 0, height: 2 },
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderRightWidth: 16, borderTopWidth: 16, borderRightColor: 'transparent' },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, borderStyle: 'solid', borderLeftWidth: 16, borderBottomWidth: 16, borderLeftColor: 'transparent' },
});

export default CpuWidget;
