import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, Smartphone, Monitor, Check, Sparkles, Palette } from 'lucide-react';
import { useStore } from '../store/useStore';
import styles from './Templates.module.css';

const { ipcRenderer } = window.require('electron');

interface TemplateConfig {
  id: string;
  name: string;
  thumbnail?: string;
  orientation: 'portrait' | 'landscape';
  background: { type: string; value: string; blur: number };
  globalStyle: string;
  widgets: any[];
}

const STYLE_ICONS: Record<string, string> = {
  modern: '🎨',
  glass: '🔮',
  neon: '⚡',
  minimal: '◻️',
  gradient: '🌈',
  cyber: '🤖'
};

export default function Templates() {
  const { settings, setSettings, templates, setTemplates } = useStore();
  const [selectedOrientation, setSelectedOrientation] = useState<'all' | 'portrait' | 'landscape'>('all');
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const tmpl = await ipcRenderer.invoke('settings:getTemplates');
    setTemplates(tmpl);
  };

  const handleApplyTemplate = async (templateId: string) => {
    setApplying(templateId);
    const result = await ipcRenderer.invoke('settings:applyTemplate', templateId);
    setSettings(result);
    setTimeout(() => setApplying(null), 500);
  };

  const handleOrientationChange = async (orientation: 'portrait' | 'landscape') => {
    const result = await ipcRenderer.invoke('settings:setOrientation', orientation);
    setSettings(result);
  };

  const filteredTemplates = templates.filter(t => 
    selectedOrientation === 'all' || t.orientation === selectedOrientation
  );

  const renderTemplatePreview = (template: TemplateConfig) => {
    const isPortrait = template.orientation === 'portrait';
    const previewStyle = {
      background: template.background.value,
      filter: template.background.blur > 0 ? `blur(${template.background.blur / 10}px)` : undefined
    };

    return (
      <div 
        className={`${styles.templatePreview} ${isPortrait ? styles.portrait : styles.landscape}`}
        style={previewStyle}
      >
        <div className={styles.widgetGrid}>
          {template.widgets.filter(w => w.enabled).slice(0, 4).map((widget, i) => (
            <div 
              key={widget.id} 
              className={styles.miniWidget}
              style={{ 
                backgroundColor: `${widget.color}22`,
                borderColor: widget.color,
                borderLeftColor: widget.color,
                borderLeftWidth: 2
              }}
            >
              <span className={styles.widgetType}>{widget.type.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!settings) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.page}
    >
      <h1 className={styles.title}>
        <span>🎭</span> Temalar & Şablonlar
      </h1>

      {/* Orientation Seçimi */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Layout size={18} />
          Ekran Yönü
        </h3>
        <div className={styles.orientationGrid}>
          <motion.button
            className={`${styles.orientationBtn} ${settings.orientation === 'portrait' ? styles.active : ''}`}
            onClick={() => handleOrientationChange('portrait')}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Smartphone size={32} />
            <span>Dikey</span>
            <small>Portrait</small>
            {settings.orientation === 'portrait' && <Check className={styles.checkIcon} size={16} />}
          </motion.button>
          
          <motion.button
            className={`${styles.orientationBtn} ${settings.orientation === 'landscape' ? styles.active : ''}`}
            onClick={() => handleOrientationChange('landscape')}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Monitor size={32} />
            <span>Yatay</span>
            <small>Landscape</small>
            {settings.orientation === 'landscape' && <Check className={styles.checkIcon} size={16} />}
          </motion.button>
        </div>
      </div>

      {/* Filtre */}
      <div className={styles.filterBar}>
        <button 
          className={`${styles.filterBtn} ${selectedOrientation === 'all' ? styles.active : ''}`}
          onClick={() => setSelectedOrientation('all')}
        >
          Tümü
        </button>
        <button 
          className={`${styles.filterBtn} ${selectedOrientation === 'portrait' ? styles.active : ''}`}
          onClick={() => setSelectedOrientation('portrait')}
        >
          <Smartphone size={14} /> Dikey
        </button>
        <button 
          className={`${styles.filterBtn} ${selectedOrientation === 'landscape' ? styles.active : ''}`}
          onClick={() => setSelectedOrientation('landscape')}
        >
          <Monitor size={14} /> Yatay
        </button>
      </div>

      {/* Template Grid */}
      <div className={styles.templateGrid}>
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            className={styles.templateCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -8, scale: 1.02 }}
          >
            {renderTemplatePreview(template)}
            
            <div className={styles.templateInfo}>
              <div className={styles.templateHeader}>
                <h4 className={styles.templateName}>{template.name}</h4>
                <span className={styles.styleIcon}>{STYLE_ICONS[template.globalStyle]}</span>
              </div>
              
              <div className={styles.templateMeta}>
                <span className={styles.orientationTag}>
                  {template.orientation === 'portrait' ? <Smartphone size={12} /> : <Monitor size={12} />}
                  {template.orientation === 'portrait' ? 'Dikey' : 'Yatay'}
                </span>
                <span className={styles.styleTag}>
                  <Palette size={12} />
                  {template.globalStyle}
                </span>
              </div>
              
              <motion.button
                className={`${styles.applyBtn} ${applying === template.id ? styles.applying : ''}`}
                onClick={() => handleApplyTemplate(template.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={applying !== null}
              >
                {applying === template.id ? (
                  <>
                    <Sparkles size={16} className={styles.spin} />
                    Uygulanıyor...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Uygula
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className={styles.empty}>
          <Layout size={48} />
          <p>Bu kategoride şablon bulunamadı</p>
        </div>
      )}
    </motion.div>
  );
}
