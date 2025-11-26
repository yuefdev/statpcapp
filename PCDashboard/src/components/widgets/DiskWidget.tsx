import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { WidgetConfig, DiskData } from '../../types';
import BaseWidget from './BaseWidget';

interface DiskWidgetProps {
  config: WidgetConfig;
  data: DiskData[];
}

const DiskWidget: React.FC<DiskWidgetProps> = ({ config, data }) => {
  const { style } = config;

  const diskIcon = (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={style.accentColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={style.accentColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const getUsageColor = (usage: number) => {
    if (usage < 70) return '#22c55e';
    if (usage < 90) return '#f59e0b';
    return '#ef4444';
  };

  const formatBytes = (gb: number) => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    return `${gb.toFixed(0)} GB`;
  };

  const formatSpeed = (mbps: number) => {
    if (mbps >= 1000) {
      return `${(mbps / 1000).toFixed(1)} GB/s`;
    }
    return `${mbps.toFixed(0)} MB/s`;
  };

  return (
    <BaseWidget 
      config={config} 
      title="DİSK" 
      icon={diskIcon}
    >
      <View style={styles.content}>
        {data.length === 0 ? (
          <Text style={[styles.noData, { color: style.titleColor }]}>
            Disk verisi yok
          </Text>
        ) : (
          data.slice(0, 3).map((disk, index) => (
            <View key={disk.name} style={styles.diskItem}>
              <View style={styles.diskHeader}>
                <Text style={[styles.diskName, { color: style.textColor }]}>
                  {disk.name}
                </Text>
                <Text style={[styles.diskUsage, { color: getUsageColor(disk.usagePercent) }]}>
                  {disk.usagePercent.toFixed(0)}%
                </Text>
              </View>
              
              <View style={[styles.progressBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${disk.usagePercent}%`,
                      backgroundColor: getUsageColor(disk.usagePercent),
                    }
                  ]} 
                />
              </View>

              <View style={styles.diskStats}>
                <Text style={[styles.diskStat, { color: style.titleColor }]}>
                  {formatBytes(disk.used / 1024)} / {formatBytes(disk.total / 1024)}
                </Text>
                {disk.readSpeed > 0 && (
                  <Text style={[styles.diskStat, { color: style.titleColor }]}>
                    R: {formatSpeed(disk.readSpeed)} W: {formatSpeed(disk.writeSpeed)}
                  </Text>
                )}
              </View>
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
  },
  noData: {
    fontSize: 12,
    textAlign: 'center',
  },
  diskItem: {
    marginBottom: 8,
  },
  diskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  diskName: {
    fontSize: 12,
    fontWeight: '600',
  },
  diskUsage: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  diskStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  diskStat: {
    fontSize: 9,
  },
});

export default DiskWidget;
