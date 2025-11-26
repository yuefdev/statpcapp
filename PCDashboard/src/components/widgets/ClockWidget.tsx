import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import LinearGradientBg from 'react-native-linear-gradient';
import { WidgetConfig, WidgetStyleType } from '../../types';

interface ClockWidgetProps {
  config: WidgetConfig & { color?: string; style?: string; size?: number };
  globalStyle?: WidgetStyleType;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 59, g: 130, b: 246 };
};

const ClockWidget: React.FC<ClockWidgetProps> = ({ config, globalStyle }) => {
  const [time, setTime] = useState(new Date());
  const accentColor = (config as any).color || config.style?.accentColor || '#3b82f6';
  const widgetStyle = (globalStyle || (config as any).style || 'modern') as WidgetStyleType;
  const rgb = hexToRgb(accentColor);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(-150)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const colonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Colon blink for cyber style
    if (widgetStyle === 'cyber') {
      Animated.loop(Animated.sequence([
        Animated.timing(colonAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(colonAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])).start();
    }
    if (widgetStyle === 'neon') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    }
    if (widgetStyle === 'gradient') {
      Animated.loop(Animated.timing(shimmerAnim, { toValue: 250, duration: 2000, easing: Easing.linear, useNativeDriver: true })).start();
    }
    if (widgetStyle === 'cyber') {
      Animated.loop(Animated.timing(scanlineAnim, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: false })).start();
    }
    if (widgetStyle === 'glass') {
      Animated.loop(Animated.sequence([
        Animated.timing(floatAnim, { toValue: -3, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    }
  }, [widgetStyle]);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const formatTime = () => `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const formatDate = () => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${days[time.getDay()]}, ${time.getDate()} ${months[time.getMonth()]}`;
  };

  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const getContainerStyle = () => {
    const base = { flex: 1, padding: 14 };
    switch (widgetStyle) {
      case 'modern': return { ...base, backgroundColor: 'rgba(25, 20, 45, 0.95)', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 };
      case 'glass': return { ...base, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' };
      case 'neon': return { ...base, backgroundColor: 'rgba(0, 0, 0, 0.92)', borderRadius: 16, borderWidth: 2, borderColor: accentColor, shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 };
      case 'minimal': return { ...base, backgroundColor: 'transparent', borderRadius: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.15)', padding: 12 };
      case 'gradient': return { ...base, borderRadius: 20, overflow: 'hidden' as const };
      case 'cyber': return { ...base, backgroundColor: 'rgba(5, 10, 25, 0.95)', borderRadius: 4, borderWidth: 1, borderColor: accentColor, shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 };
      default: return { ...base, backgroundColor: 'rgba(25, 20, 45, 0.95)', borderRadius: 20 };
    }
  };

  // Analog clock for modern/glass/neon
  const renderAnalogClock = () => {
    if (widgetStyle === 'minimal' || widgetStyle === 'cyber') return null;
    const size = 65;
    const center = size / 2;
    const radius = size / 2 - 4;

    return (
      <View style={styles.analogContainer}>
        <Svg width={size} height={size}>
          <Circle cx={center} cy={center} r={radius} stroke={accentColor} strokeWidth={widgetStyle === 'neon' ? 2 : 1.5} fill="rgba(0,0,0,0.2)" />
          {[...Array(12)].map((_, i) => {
            const angle = i * 30 * (Math.PI / 180);
            const x1 = center + (radius - 5) * Math.sin(angle);
            const y1 = center - (radius - 5) * Math.cos(angle);
            const x2 = center + (radius - 2) * Math.sin(angle);
            const y2 = center - (radius - 2) * Math.cos(angle);
            return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accentColor} strokeWidth={i % 3 === 0 ? 2 : 1} />;
          })}
          <G rotation={hourAngle} origin={`${center}, ${center}`}>
            <Line x1={center} y1={center} x2={center} y2={center - radius * 0.45} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
          </G>
          <G rotation={minuteAngle} origin={`${center}, ${center}`}>
            <Line x1={center} y1={center} x2={center} y2={center - radius * 0.65} stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
          </G>
          <G rotation={secondAngle} origin={`${center}, ${center}`}>
            <Line x1={center} y1={center + 6} x2={center} y2={center - radius * 0.7} stroke={accentColor} strokeWidth={1} strokeLinecap="round" />
          </G>
          <Circle cx={center} cy={center} r={3} fill={accentColor} />
        </Svg>
      </View>
    );
  };

  // Digital display for cyber style
  const renderCyberClock = () => {
    if (widgetStyle !== 'cyber') return null;
    return (
      <View style={styles.cyberClockContainer}>
        <Text style={[styles.cyberTime, { color: accentColor }]}>
          {hours.toString().padStart(2, '0')}
          <Animated.Text style={{ opacity: colonAnim }}>:</Animated.Text>
          {minutes.toString().padStart(2, '0')}
          <Animated.Text style={{ opacity: colonAnim }}>:</Animated.Text>
          {seconds.toString().padStart(2, '0')}
        </Text>
        <Text style={[styles.cyberDate, { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)` }]}>
          {`> ${time.getFullYear()}.${(time.getMonth() + 1).toString().padStart(2, '0')}.${time.getDate().toString().padStart(2, '0')}`}
        </Text>
      </View>
    );
  };

  const content = (
    <View style={styles.content}>
      {widgetStyle === 'modern' && <View style={[styles.innerGlow, { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)` }]} />}
      {widgetStyle === 'modern' && <View style={[styles.accentBar, { backgroundColor: accentColor }]} />}
      {widgetStyle === 'glass' && <View style={styles.glassShine} />}
      {widgetStyle === 'glass' && <View style={[styles.glassAccent, { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)` }]} />}
      {widgetStyle === 'neon' && <View style={[styles.neonOuterGlow, { borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` }]} />}
      {widgetStyle === 'minimal' && <View style={[styles.minimalAccent, { backgroundColor: accentColor }]} />}
      {widgetStyle === 'cyber' && (
        <>
          <Animated.View style={[styles.scanline, { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`, top: scanlineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 140] }) }]} />
          <View style={styles.gridOverlay}>{[0, 1, 2, 3, 4, 5].map(i => <View key={i} style={[styles.gridLine, { top: i * 25 }]} />)}</View>
          <View style={[styles.cornerTR, { borderTopColor: '#0a0a1a' }]} />
          <View style={[styles.cornerBL, { borderBottomColor: '#0a0a1a' }]} />
        </>
      )}

      <View style={styles.header}>
        <Text style={[styles.title, { color: accentColor }, widgetStyle === 'cyber' && styles.cyberTitle, widgetStyle === 'neon' && { textShadowColor: accentColor, textShadowRadius: 10 }, widgetStyle === 'minimal' && styles.minimalTitle]}>
          {widgetStyle === 'cyber' ? '[ CLOCK ]' : 'CLOCK'}
        </Text>
        <Text style={[styles.subtitle, widgetStyle === 'cyber' && { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`, letterSpacing: 2 }]}>
          {widgetStyle === 'cyber' ? 'SYS.TIME' : 'LOCAL TIME'}
        </Text>
      </View>

      <View style={styles.clockContent}>
        {renderAnalogClock()}
        {renderCyberClock()}
        
        {widgetStyle !== 'cyber' && (
          <View style={styles.digitalContainer}>
            <Text style={[styles.digitalTime, widgetStyle === 'minimal' && styles.minimalTime, widgetStyle === 'glass' && styles.glassTime, widgetStyle === 'neon' && { textShadowColor: accentColor, textShadowRadius: 8 }]}>
              {formatTime()}
            </Text>
            <Text style={[styles.seconds, { color: accentColor }]}>:{seconds.toString().padStart(2, '0')}</Text>
          </View>
        )}
        {widgetStyle !== 'cyber' && <Text style={styles.date}>{formatDate()}</Text>}
      </View>
    </View>
  );

  if (widgetStyle === 'gradient') {
    return (
      <LinearGradientBg colors={[`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={getContainerStyle()}>
        <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerAnim }] }]} />
        <View style={[styles.gradientBorder, { borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)` }]} />
        {content}
      </LinearGradientBg>
    );
  }
  if (widgetStyle === 'glass') return <Animated.View style={[getContainerStyle(), { transform: [{ translateY: floatAnim }] }]}>{content}</Animated.View>;
  if (widgetStyle === 'neon') return <Animated.View style={[getContainerStyle(), { opacity: pulseAnim }]}>{content}</Animated.View>;
  return <View style={getContainerStyle()}>{content}</View>;
};

const styles = StyleSheet.create({
  content: { flex: 1, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  title: { fontSize: 12, fontWeight: 'bold', marginRight: 8 },
  cyberTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  minimalTitle: { letterSpacing: 3, fontSize: 10 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 7 },
  clockContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  analogContainer: { alignItems: 'center', marginBottom: 6 },
  digitalContainer: { flexDirection: 'row', alignItems: 'baseline' },
  digitalTime: { color: '#ffffff', fontSize: 26, fontWeight: '300', letterSpacing: 1 },
  minimalTime: { fontWeight: '200', fontSize: 24 },
  glassTime: { fontWeight: '200' },
  seconds: { fontSize: 16, fontWeight: '300' },
  date: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  cyberClockContainer: { alignItems: 'center' },
  cyberTime: { fontSize: 28, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 2 },
  cyberDate: { fontSize: 11, fontFamily: 'monospace', marginTop: 4 },
  innerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 50, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  accentBar: { position: 'absolute', left: -14, top: '15%', bottom: '15%', width: 4, borderRadius: 2 },
  glassShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  glassAccent: { position: 'absolute', left: -14, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  neonOuterGlow: { position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: 21, borderWidth: 1 },
  minimalAccent: { position: 'absolute', left: -12, top: 0, width: 3, height: '35%' },
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: 'rgba(255, 255, 255, 0.15)', transform: [{ skewX: '-20deg' }] },
  gradientBorder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, borderWidth: 2 },
  scanline: { position: 'absolute', left: 0, right: 0, height: 2 },
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderRightWidth: 16, borderTopWidth: 16, borderRightColor: 'transparent' },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, borderStyle: 'solid', borderLeftWidth: 16, borderBottomWidth: 16, borderLeftColor: 'transparent' },
});

export default ClockWidget;
