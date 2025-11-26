import React from 'react';
import { View, StyleSheet, Dimensions, Animated, useWindowDimensions } from 'react-native';
import { WidgetConfig, SystemData, WidgetStyleType, OrientationType } from '../types';
import {
  CpuWidget,
  GpuWidget,
  RamWidget,
  DiskWidget,
  NetworkWidget,
  TemperatureWidget,
  FanWidget,
  ClockWidget,
  UnifiedWidget,
} from './widgets';

const PADDING = 12;

interface WidgetGridProps {
  widgets: WidgetConfig[];
  systemData: SystemData;
  animatedStyle?: any;
  globalStyle?: WidgetStyleType;
  globalOpacity?: number;
  orientation?: OrientationType;
}

// Position string'den style hesapla
const getPositionStyle = (
  position: string | { x: number; y: number; width: number; height: number }, 
  size: number = 100,
  screenWidth: number,
  screenHeight: number,
  isLandscape: boolean = false,
  widgetIndex: number = 0,
  totalWidgets: number = 4
) => {
  // Boyut skalası
  const scale = size / 100;
  
  // Landscape modda daha küçük widget'lar (yan yana sığması için)
  const baseWidth = isLandscape ? (120 * scale) : (140 * scale);
  const baseHeight = isLandscape ? (100 * scale) : (110 * scale);
  
  // Eğer position bir object ise eski formatı kullan
  if (typeof position === 'object' && position !== null) {
    const cellWidth = (screenWidth - PADDING * 2) / 4;
    const cellHeight = (screenHeight - PADDING * 2) / 6;
    return {
      position: 'absolute' as const,
      left: position.x * cellWidth + PADDING,
      top: position.y * cellHeight + PADDING,
      width: position.width * cellWidth - 8,
      height: position.height * cellHeight - 8,
    };
  }

  // Portrait layout: Note 3 (1080x1920) oranına göre - önizleme ile birebir aynı
  if (!isLandscape) {
    // 3x3 grid: %20, %50, %80 (yatay) ve %10, %40, %70 (dikey)
    const col1 = screenWidth * 0.20 - baseWidth / 2;
    const col2 = screenWidth * 0.50 - baseWidth / 2;
    const col3 = screenWidth * 0.80 - baseWidth / 2;
    
    const row1 = screenHeight * 0.10;
    const row2 = screenHeight * 0.40 - baseHeight / 2;
    const row3 = screenHeight * 0.70 - baseHeight / 2;
    
    const portraitPositions: Record<string, any> = {
      'tl': { top: row1, left: col1 },
      'tc': { top: row1, left: col2 },
      'tr': { top: row1, left: col3 },
      'ml': { top: row2, left: col1 },
      'mc': { top: row2, left: col2 },
      'mr': { top: row2, left: col3 },
      'bl': { top: row3, left: col1 },
      'bc': { top: row3, left: col2 },
      'br': { top: row3, left: col3 },
    };
    
    const posStyle = portraitPositions[position] || portraitPositions['tl'];
    
    return {
      position: 'absolute' as const,
      width: baseWidth,
      minHeight: baseHeight,
      ...posStyle,
    };
  }

  // Landscape için 4 eşit bölge hesapla - önizleme ile aynı
  const sectionWidth = screenWidth / 4;
  const centerY = (screenHeight - baseHeight) / 2;
  
  // Landscape pozisyonlar - yatay 4 widget yerleşimi (%15, %38, %62, %85)
  const landscapePositions: Record<string, any> = {
    'l':  { top: centerY, left: screenWidth * 0.15 - baseWidth / 2 },
    'cl': { top: centerY, left: screenWidth * 0.38 - baseWidth / 2 },
    'cr': { top: centerY, left: screenWidth * 0.62 - baseWidth / 2 },
    'r':  { top: centerY, left: screenWidth * 0.85 - baseWidth / 2 },
    
    // Portrait pozisyonlarını landscape'e map et
    'tl': { top: centerY, left: screenWidth * 0.15 - baseWidth / 2 },
    'tr': { top: centerY, left: screenWidth * 0.38 - baseWidth / 2 },
    'bl': { top: centerY, left: screenWidth * 0.62 - baseWidth / 2 },
    'br': { top: centerY, left: screenWidth * 0.85 - baseWidth / 2 },
    'mc': { top: centerY, left: (screenWidth - baseWidth) / 2 },
  };
  
  return {
    position: 'absolute' as const,
    width: baseWidth,
    minHeight: baseHeight,
    ...landscapePositions[position] || landscapePositions['l'],
  };
};

const WidgetGrid: React.FC<WidgetGridProps> = ({ 
  widgets, 
  systemData, 
  animatedStyle, 
  globalStyle = 'modern',
  globalOpacity = 1,
  orientation = 'portrait'
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = orientation === 'landscape';

  // Unified stil - tek bir birleşik widget göster
  if (globalStyle === 'unified') {
    return (
      <Animated.View style={[styles.unifiedContainer, animatedStyle, { opacity: globalOpacity }]}>
        <UnifiedWidget 
          systemData={systemData} 
          style="modern"
        />
      </Animated.View>
    );
  }

  const renderWidget = (config: WidgetConfig) => {
    if (!config.enabled) return null;

    const positionStyle = getPositionStyle(
      config.position, 
      (config as any).size || 100,
      screenWidth,
      screenHeight,
      isLandscape
    );

    // Widget opaklığı - global opaklık ile çarp
    const widgetOpacity = ((config as any).opacity ?? 1) * globalOpacity;

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
      <View key={config.id} style={[positionStyle, { opacity: widgetOpacity }]}>
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
  unifiedContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default WidgetGrid;
