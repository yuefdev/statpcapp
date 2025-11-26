import { useEffect } from 'react';
import { useStore } from './store/useStore';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Widgets from './pages/Widgets';
import Background from './pages/Background';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import styles from './App.module.css';

const { ipcRenderer } = window.require('electron');

export default function App() {
  const { currentPage, setHardwareData, setSettings, setClientCount, setTemplates } = useStore();

  useEffect(() => {
    // Load initial settings
    ipcRenderer.invoke('settings:get').then(setSettings);
    ipcRenderer.invoke('settings:getTemplates').then(setTemplates);

    // Listen for updates
    ipcRenderer.on('hardware-data', (_: any, data: any) => setHardwareData(data));
    ipcRenderer.on('clients', (_: any, count: number) => setClientCount(count));

    return () => {
      ipcRenderer.removeAllListeners('hardware-data');
      ipcRenderer.removeAllListeners('clients');
    };
  }, []);

  const pages: Record<string, JSX.Element> = {
    dashboard: <Dashboard />,
    widgets: <Widgets />,
    background: <Background />,
    templates: <Templates />,
    settings: <Settings />
  };

  return (
    <div className={styles.app}>
      <TitleBar />
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.content}>
          {pages[currentPage]}
        </main>
      </div>
    </div>
  );
}
