import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, RefreshCw, Gauge } from 'lucide-react';
import { useStore } from '../store/useStore';
import styles from './Settings.module.css';

const { ipcRenderer } = window.require('electron');

export default function Settings() {
  const { settings, setSettings } = useStore();
  const [refreshRate, setRefreshRate] = useState(settings?.server.refreshRate || 1000);

  const handleAdbSetup = async () => {
    await ipcRenderer.invoke('adb:setup');
  };

  const handleRestartApp = async () => {
    await ipcRenderer.invoke('adb:restartApp');
  };

  const handleSaveRefreshRate = async () => {
    const result = await ipcRenderer.invoke('settings:setRefreshRate', refreshRate);
    setSettings(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.page}
    >
      <h1 className={styles.title}>
        <span>⚙️</span> Genel Ayarlar
      </h1>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Smartphone size={18} /> ADB Bağlantısı
        </h3>
        <p className={styles.description}>
          Telefonunuzu USB ile bağlayın ve ADB'yi yapılandırın.
          USB Hata Ayıklama modunun açık olduğundan emin olun.
        </p>
        <div className={styles.buttonGroup}>
          <motion.button
            className={styles.btnPrimary}
            onClick={handleAdbSetup}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={16} /> ADB Yenile
          </motion.button>
          <motion.button
            className={styles.btnSecondary}
            onClick={handleRestartApp}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Smartphone size={16} /> Uygulamayı Yeniden Başlat
          </motion.button>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Gauge size={18} /> Güncelleme Hızı
        </h3>
        <p className={styles.description}>
          Donanım verilerinin ne sıklıkla güncelleneceğini ayarlayın.
          Düşük değerler daha fazla CPU kullanır.
        </p>
        
        <div className={styles.sliderContainer}>
          <input
            type="range"
            className={styles.slider}
            min="500"
            max="3000"
            step="100"
            value={refreshRate}
            onChange={(e) => setRefreshRate(parseInt(e.target.value))}
          />
          <span className={styles.sliderValue}>{refreshRate}ms</span>
        </div>
        
        <motion.button
          className={styles.btnPrimary}
          onClick={handleSaveRefreshRate}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          💾 Kaydet
        </motion.button>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>ℹ️ Hakkında</h3>
        <div className={styles.about}>
          <div className={styles.aboutItem}>
            <span>Versiyon</span>
            <span>1.0.0</span>
          </div>
          <div className={styles.aboutItem}>
            <span>Port</span>
            <span>{settings?.server.port}</span>
          </div>
          <div className={styles.aboutItem}>
            <span>Teknoloji</span>
            <span>Electron + React + TypeScript</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
