import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { WidgetConfig, NetworkData } from '../../types';
import BaseWidget from './BaseWidget';

interface NetworkWidgetProps {
  config: WidgetConfig;
  data: NetworkData;
}

const NetworkWidget: React.FC<NetworkWidgetProps> = ({ config, data }) => {
  const { style } = config;

  const networkIcon = (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
        stroke={style.accentColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1000000) {
      return `${(kbps / 1000000).toFixed(1)} GB/s`;
    }
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} MB/s`;
    }
    return `${kbps.toFixed(0)} KB/s`;
  };

  const formatTotal = (kb: number) => {
    if (kb >= 1000000000) {
      return `${(kb / 1000000000).toFixed(1)} TB`;
    }
    if (kb >= 1000000) {
      return `${(kb / 1000000).toFixed(1)} GB`;
    }
    if (kb >= 1000) {
      return `${(kb / 1000).toFixed(1)} MB`;
    }
    return `${kb.toFixed(0)} KB`;
  };

  return (
    <BaseWidget 
      config={config} 
      title="NETWORK" 
      icon={networkIcon}
    >
      <View style={styles.content}>
        {/* Download */}
        <View style={styles.speedRow}>
          <View style={styles.speedItem}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 3v18M5 12l7 7 7-7"
                stroke="#22c55e"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <View style={styles.speedInfo}>
              <Text style={[styles.speedValue, { color: '#22c55e' }]}>
                {formatSpeed(data.downloadSpeed)}
              </Text>
              <Text style={[styles.speedLabel, { color: style.titleColor }]}>
                İndirme
              </Text>
            </View>
          </View>

          {/* Upload */}
          <View style={styles.speedItem}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21V3M5 10l7-7 7 7"
                stroke="#ef4444"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <View style={styles.speedInfo}>
              <Text style={[styles.speedValue, { color: '#ef4444' }]}>
                {formatSpeed(data.uploadSpeed)}
              </Text>
              <Text style={[styles.speedLabel, { color: style.titleColor }]}>
                Yükleme
              </Text>
            </View>
          </View>
        </View>

        {/* Totals & Ping */}
        <View style={styles.statsRow}>
          <Text style={[styles.stat, { color: style.titleColor }]}>
            ↓ {formatTotal(data.totalDownload)} | ↑ {formatTotal(data.totalUpload)}
          </Text>
          {data.ping > 0 && (
            <Text style={[styles.ping, { color: data.ping < 50 ? '#22c55e' : data.ping < 100 ? '#f59e0b' : '#ef4444' }]}>
              {data.ping} ms
            </Text>
          )}
        </View>
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  speedItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedInfo: {
    marginLeft: 8,
  },
  speedValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  speedLabel: {
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    fontSize: 10,
  },
  ping: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NetworkWidget;
