import { motion } from 'framer-motion';
import { LayoutDashboard, Smartphone, Palette, Settings, Layout } from 'lucide-react';
import { useStore } from '../store/useStore';
import styles from './Sidebar.module.css';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'widgets', icon: Smartphone, label: 'Widgetlar' },
  { id: 'background', icon: Palette, label: 'Arka Plan' },
  { id: 'templates', icon: Layout, label: 'Temalar' },
  { id: 'settings', icon: Settings, label: 'Ayarlar' }
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, clientCount } = useStore();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.nav}>
        {navItems.map(item => (
          <motion.button
            key={item.id}
            className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
            onClick={() => setCurrentPage(item.id)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      <div className={styles.status}>
        <div className={styles.statusHeader}>
          <span className={`${styles.dot} ${clientCount > 0 ? styles.online : ''}`} />
          <span className={styles.statusText}>
            {clientCount > 0 ? 'Bağlı' : 'Bağlantı Yok'}
          </span>
        </div>
        <div className={styles.count}>{clientCount}</div>
        <div className={styles.label}>Bağlı Cihaz</div>
      </div>
    </nav>
  );
}
