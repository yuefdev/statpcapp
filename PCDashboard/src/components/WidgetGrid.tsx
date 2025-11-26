import React from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { WidgetConfig, SystemData, WidgetStyleType } from '../types';
import {
  CpuWidget,
  GpuWidget,
  RamWidget,
  DiskWidget,
  NetworkWidget,
  TemperatureWidget,
  FanWidget,
  ClockWidget,
} from './widgets';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PADDING = 12;

interface WidgetGridProps {
  widgets: WidgetConfig[];
  systemData: SystemData;
  animatedStyle?: any;
  globalStyle?: WidgetStyleType;
}

// Position string'den style hesapla
const getPositionStyle = (position: string | { x: number; y: number; width: number; height: number }, size: number = 100) => {
  // Boyut skalası - varsayılan boyutları artırdık
  const scale = size / 100;
  const baseWidth = 170 * scale;  // 140 -> 170
  const baseHeight = 130 * scale; // 80 -> 130
  
  // Eğer position bir object ise eski formatı kullan
  if (typeof position === 'object' && position !== null) {
    const cellWidth = (SCREEN_WIDTH - PADDING * 2) / 4;
    const cellHeight = (SCREEN_HEIGHT - PADDING * 2) / 6;
    return {
      position: 'absolute' as const,
      left: position.x * cellWidth + PADDING,
      top: position.y * cellHeight + PADDING,
      width: position.width * cellWidth - 8,
      height: position.height * cellHeight - 8,
    };
  }
  
  // String position formatı (yeni format)
  const positions: Record<string, any> = {
    'tl': { top: PADDING, left: PADDING },
    'tc': { top: PADDING, left: (SCREEN_WIDTH - baseWidth) / 2 },
    'tr': { top: PADDING, right: PADDING },
    'ml': { top: (SCREEN_HEIGHT - baseHeight) / 2, left: PADDING },
    'mc': { top: (SCREEN_HEIGHT - baseHeight) / 2, left: (SCREEN_WIDTH - baseWidth) / 2 },
    'mr': { top: (SCREEN_HEIGHT - baseHeight) / 2, right: PADDING },
    'bl': { bottom: PADDING, left: PADDING },
    'bc': { bottom: PADDING, left: (SCREEN_WIDTH - baseWidth) / 2 },
    'br': { bottom: PADDING, right: PADDING },
  };
  
  return {
    position: 'absolute' as const,
    width: baseWidth,
    minHeight: baseHeight,
    ...positions[position] || positions['tl'],
  };
};

const WidgetGrid: React.FC<WidgetGridProps> = ({ widgets, systemData, animatedStyle, globalStyle = 'modern' }) => {

  const renderWidget = (config: WidgetConfig) => {
    if (!config.enabled) return null;

    const positionStyle = getPositionStyle(config.position, (config as any).size || 100);

    const widgetComponent = () => {
      switch (config.type) {
        case 'cpu':
          return <CpuWidget config={config} data={systemData.cpu} globalStyle={globalStyle} />;
        case 'gpu':
          return <GpuWidget config={config} data={systemData.gpu} globalStyle={globalStyle} />;
        case 'ram':
          return <RamWidget config={config} data={systemData.ram} globalStyle={globalStyle} />;
        case 'disk':
          return <DiskWidget config={config} data={systemData.disks} />;
        case 'network':
          return <NetworkWidget config={config} data={systemData.network} />;
        case 'temperature':
          return (
            <TemperatureWidget 
              config={config} 
              cpuData={systemData.cpu} 
              gpuData={systemData.gpu} 
            />
          );
        case 'fan':
          return <FanWidget config={config} data={systemData.fans} />;
        case 'clock':
          return <ClockWidget config={config} globalStyle={globalStyle} />;
        default:
          return null;
      }
    };

    return (
      <View key={config.id} style={positionStyle}>
        {widgetComponent()}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {widgets.map(renderWidget)}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

export default WidgetGrid;
