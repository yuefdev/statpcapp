import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WidgetConfig, WidgetStyle } from '../../types';

interface BaseWidgetProps {
  config: WidgetConfig;
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  value?: string | number;
  unit?: string;
  animatedStyle?: any;
}

const BaseWidget: React.FC<BaseWidgetProps> = ({
  config,
  children,
  title,
  icon,
  value,
  unit,
  animatedStyle,
}) => {
  const { style } = config;

  const containerStyle = {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderRadius: style.borderRadius,
    opacity: style.opacity,
  };

  return (
    <Animated.View style={[styles.container, containerStyle, animatedStyle]}>
      {style.showTitle && (
        <View style={styles.header}>
          {style.showIcon && icon && (
            <View style={styles.iconContainer}>{icon}</View>
          )}
          <Text style={[styles.title, { color: style.titleColor, fontSize: style.fontSize - 2 }]}>
            {config.customTitle || title}
          </Text>
        </View>
      )}
      
      {value !== undefined && (
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: style.textColor, fontSize: style.fontSize + 8 }]}>
            {value}
          </Text>
          {unit && (
            <Text style={[styles.unit, { color: style.titleColor, fontSize: style.fontSize }]}>
              {unit}
            </Text>
          )}
        </View>
      )}

      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    margin: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
  },
  unit: {
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
});

export default BaseWidget;
