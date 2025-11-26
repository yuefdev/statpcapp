/**
 * PC Dashboard - Kiosk Mode App
 * Tüm ayarlar PC'den kontrol edilir
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View, LogBox } from 'react-native';
import { DashboardScreen } from './src/screens';

// Uyarıları gizle (production için)
LogBox.ignoreLogs(['Warning: ...']);

function App() {
  useEffect(() => {
    // Uygulama başladığında immersive mode'a geç
    StatusBar.setHidden(true);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} translucent={true} backgroundColor="transparent" />
      <DashboardScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});

export default App;
