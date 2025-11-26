import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { WidgetConfig, FanData } from '../../types';
import BaseWidget from './BaseWidget';

interface FanWidgetProps {
  config: WidgetConfig;
  data: FanData[];
}

const FanWidget: React.FC<FanWidgetProps> = ({ config, data }) => {
  const { style } = config;

  const fanIcon = (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={style.accentColor} strokeWidth={2} />
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
        stroke={style.accentColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.5}
      />
    </Svg>
  );

  const getSpeedColor = (percentage: number) => {
    if (percentage < 40) return '#22c55e';
    if (percentage < 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <BaseWidget 
      config={config} 
      title="FAN" 
      icon={fanIcon}
    >
      <View style={styles.content}>
        {data.length === 0 ? (
          <Text style={[styles.noData, { color: style.titleColor }]}>
            Fan verisi yok
          </Text>
        ) : (
          data.slice(0, 3).map((fan, index) => (
            <View key={fan.name || index} style={styles.fanItem}>
              <Text 
                style={[styles.fanName, { color: style.titleColor }]}
                numberOfLines={1}
              >
                {fan.name || `Fan ${index + 1}`}
              </Text>
              <Text style={[styles.fanRpm, { color: getSpeedColor(fan.percentage) }]}>
                {fan.rpm} RPM
              </Text>
            </View>
          ))
        )}
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  noData: {
    fontSize: 12,
    textAlign: 'center',
  },
  fanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  fanName: {
    fontSize: 10,
    flex: 1,
    marginRight: 8,
  },
  fanRpm: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FanWidget;
