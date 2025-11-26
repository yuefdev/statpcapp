import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, error }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Bağlandı';
      case 'connecting':
        return 'Bağlanıyor...';
      case 'error':
        return error || 'Hata';
      default:
        return 'Bağlantı Yok';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
              stroke={getStatusColor()}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M22 4L12 14.01l-3-3"
              stroke={getStatusColor()}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'connecting':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="10"
              stroke={getStatusColor()}
              strokeWidth={2}
              strokeDasharray="30 10"
            />
          </Svg>
        );
      case 'error':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={getStatusColor()} strokeWidth={2} />
            <Path
              d="M15 9l-6 6M9 9l6 6"
              stroke={getStatusColor()}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        );
      default:
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={getStatusColor()} strokeWidth={2} />
            <Path d="M12 8v4M12 16h.01" stroke={getStatusColor()} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        );
    }
  };

  if (status === 'connected') {
    return null; // Bağlandığında gösterme
  }

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: `${getStatusColor()}20` }]}>
        {getStatusIcon()}
        <Text style={[styles.text, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  text: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConnectionStatus;
