import { Minus, Square, X } from 'lucide-react';
import styles from './TitleBar.module.css';

const { ipcRenderer } = window.require('electron');

export default function TitleBar() {
  return (
    <div className={styles.titlebar}>
      <span className={styles.title}>⚡ PC Dashboard Controller</span>
      <div className={styles.buttons}>
        <button onClick={() => ipcRenderer.send('window:minimize')} className={styles.btn}>
          <Minus size={14} />
        </button>
        <button onClick={() => ipcRenderer.send('window:maximize')} className={styles.btn}>
          <Square size={12} />
        </button>
        <button onClick={() => ipcRenderer.send('window:close')} className={`${styles.btn} ${styles.close}`}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
