import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SystemData, WidgetStyleType } from '../../types';

interface UnifiedWidgetProps {
  systemData: SystemData;
  accentColor?: string;
  style?: WidgetStyleType;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 168, g: 85, b: 247 };
};

// Mini circular gauge
const MiniGauge: React.FC<{ value: number; color: string; size?: number }> = ({ value, color, size = 36 }) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (value / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

// Progress bar component
const ProgressBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <View style={progressStyles.container}>
    <View style={[progressStyles.fill, { width: `${value}%`, backgroundColor: color }]} />
  </View>
);

const progressStyles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    flex: 1,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

const UnifiedWidget: React.FC<UnifiedWidgetProps> = ({ 
  systemData, 
  accentColor = '#a855f7',
  style = 'modern'
}) => {
  const rgb = hexToRgb(accentColor);

  // Farklı renkler her metrik için
  const colors = {
    cpu: '#a855f7',    // Mor
    gpu: '#22c55e',    // Yeşil
    ram: '#06b6d4',    // Cyan
    clock: '#f59e0b',  // Amber
  };

  // Saat formatı
  const now = new Date();
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' });

  // Stil bazlı container
  const getContainerStyle = () => {
    switch (style) {
      case 'neon':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          borderWidth: 1,
          borderColor: accentColor,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 15,
          elevation: 10,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        };
      case 'cyber':
        return {
          backgroundColor: 'rgba(5, 10, 25, 0.95)',
          borderWidth: 1,
          borderColor: accentColor,
        };
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'gradient':
        return {
          backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
          borderWidth: 1,
          borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
        };
      default: // modern
        return {
          backgroundColor: 'rgba(25, 20, 45, 0.95)',
        };
    }
  };

  return (
    <View style={[styles.container, getContainerStyle()]}>
      {/* Header - Saat */}
      <View style={styles.header}>
        <Text style={styles.time}>{timeStr}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: `${accentColor}30` }]} />

      {/* CPU Section */}
      <View style={styles.metricRow}>
        <View style={styles.metricLeft}>
          <MiniGauge value={systemData.cpu.usage} color={colors.cpu} />
          <View style={styles.metricInfo}>
            <Text style={[styles.metricLabel, { color: colors.cpu }]}>CPU</Text>
            <Text style={styles.metricName} numberOfLines={1}>
              {systemData.cpu.name || 'Processor'}
            </Text>
          </View>
        </View>
        <View style={styles.metricRight}>
          <Text style={styles.metricValue}>{Math.round(systemData.cpu.usage)}%</Text>
          <Text style={styles.metricSub}>{systemData.cpu.temperature}°C</Text>
        </View>
      </View>

      {/* GPU Section */}
      <View style={styles.metricRow}>
        <View style={styles.metricLeft}>
          <MiniGauge value={systemData.gpu.usage} color={colors.gpu} />
          <View style={styles.metricInfo}>
            <Text style={[styles.metricLabel, { color: colors.gpu }]}>GPU</Text>
            <Text style={styles.metricName} numberOfLines={1}>
              {systemData.gpu.name || 'Graphics'}
            </Text>
          </View>
        </View>
        <View style={styles.metricRight}>
          <Text style={styles.metricValue}>{Math.round(systemData.gpu.usage)}%</Text>
          <Text style={styles.metricSub}>{systemData.gpu.temperature}°C</Text>
        </View>
      </View>

      {/* RAM Section */}
      <View style={styles.metricRow}>
        <View style={styles.metricLeft}>
          <MiniGauge value={systemData.ram.usagePercent} color={colors.ram} />
          <View style={styles.metricInfo}>
            <Text style={[styles.metricLabel, { color: colors.ram }]}>RAM</Text>
            <Text style={styles.metricName}>
              {(systemData.ram.used / 1024).toFixed(1)} / {(systemData.ram.total / 1024).toFixed(0)} GB
            </Text>
          </View>
        </View>
        <View style={styles.metricRight}>
          <Text style={styles.metricValue}>{Math.round(systemData.ram.usagePercent)}%</Text>
          <Text style={styles.metricSub}>{systemData.ram.frequency} MHz</Text>
        </View>
      </View>

      {/* Bottom Progress Bars */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.cpu }]}>CPU</Text>
          <ProgressBar value={systemData.cpu.usage} color={colors.cpu} />
        </View>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.gpu }]}>GPU</Text>
          <ProgressBar value={systemData.gpu.usage} color={colors.gpu} />
        </View>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.ram }]}>RAM</Text>
          <ProgressBar value={systemData.ram.usagePercent} color={colors.ram} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    margin: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  time: {
    fontSize: 48,
    fontWeight: '200',
    color: '#ffffff',
    letterSpacing: 2,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricInfo: {
    marginLeft: 12,
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  metricName: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ffffff',
  },
  metricSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  progressSection: {
    marginTop: 16,
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    width: 30,
    letterSpacing: 0.5,
  },
});

export default UnifiedWidget;
