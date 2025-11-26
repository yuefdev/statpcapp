import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { WidgetConfig, CpuData, GpuData } from '../../types';
import BaseWidget from './BaseWidget';

interface TemperatureWidgetProps {
  config: WidgetConfig;
  cpuData: CpuData;
  gpuData: GpuData;
}

const TemperatureWidget: React.FC<TemperatureWidgetProps> = ({ config, cpuData, gpuData }) => {
  const { style } = config;

  const tempIcon = (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        stroke={style.accentColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const getTempColor = (temp: number) => {
    if (temp < 50) return '#22c55e';
    if (temp < 70) return '#f59e0b';
    if (temp < 85) return '#f97316';
    return '#ef4444';
  };

  return (
    <BaseWidget 
      config={config} 
      title="SICAKLIK" 
      icon={tempIcon}
    >
      <View style={styles.content}>
        {/* CPU Temperature */}
        <View style={styles.tempItem}>
          <Text style={[styles.label, { color: style.titleColor }]}>CPU</Text>
          <Text style={[styles.value, { color: getTempColor(cpuData.temperature) }]}>
            {cpuData.temperature}°
          </Text>
        </View>

        {/* GPU Temperature */}
        <View style={styles.tempItem}>
          <Text style={[styles.label, { color: style.titleColor }]}>GPU</Text>
          <Text style={[styles.value, { color: getTempColor(gpuData.temperature) }]}>
            {gpuData.temperature}°
          </Text>
        </View>
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  tempItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default TemperatureWidget;
