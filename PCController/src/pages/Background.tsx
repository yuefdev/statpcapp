import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Image, Sparkles, Film, Upload, Droplets } from 'lucide-react';
import { useStore } from '../store/useStore';
import styles from './Background.module.css';

const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');

const BG_TYPES = [
  { id: 'color', icon: Palette, label: 'Düz Renk' },
  { id: 'image', icon: Image, label: 'Fotoğraf' },
  { id: 'gif', icon: Sparkles, label: 'GIF' },
  { id: 'video', icon: Film, label: 'Video' }
];

const COLORS = [
  '#0a0a1a', '#1a1a2e', '#16213e', '#0f3460', '#2d132c', '#1a1a1a',
  '#000000', '#0d1b2a', '#1b263b', '#2c003e', '#3d0066', 
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)'
];

// Dosyayı base64'e çevir
const fileToBase64 = (filePath: string): string | null => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'webm': 'video/webm'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (e) {
    console.error('File read error:', e);
    return null;
  }
};

export default function Background() {
  const { settings, setSettings } = useStore();
  const [bgType, setBgType] = useState(settings?.background.type || 'color');
  const [customColor, setCustomColor] = useState('#0a0a1a');
  const [fileName, setFileName] = useState('');
  const [blur, setBlur] = useState(settings?.background.blur || 0);
  const [previewDataUri, setPreviewDataUri] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sıkıştırma durumunu dinle
  useEffect(() => {
    const handleCompressionStatus = (_: any, data: { status: string; progress?: number; message?: string }) => {
      if (data.status === 'compressing') {
        setIsCompressing(true);
      } else if (data.status === 'done' || data.status === 'error') {
        setIsCompressing(false);
      } else if (data.status === 'busy') {
        // Zaten sıkıştırma devam ediyor
        console.log(data.message);
      }
    };
    
    ipcRenderer.on('compression-status', handleCompressionStatus);
    return () => {
      ipcRenderer.removeListener('compression-status', handleCompressionStatus);
    };
  }, []);

  // Dosya yolu değiştiğinde base64'e çevir
  useEffect(() => {
    if (settings?.background.type !== 'color' && settings?.background.value) {
      const val = settings.background.value;
      // Eğer zaten base64 ise direkt kullan
      if (val.startsWith('data:')) {
        setPreviewDataUri(val);
      } else {
        // Dosya yolu ise base64'e çevir
        const dataUri = fileToBase64(val);
        setPreviewDataUri(dataUri);
      }
    } else {
      setPreviewDataUri(null);
    }
  }, [settings?.background.value, settings?.background.type]);

  if (!settings) return null;

  const handleSetBackground = async (type: string, value: string, blurValue?: number) => {
    const result = await ipcRenderer.invoke('settings:setBackground', { 
      type, 
      value, 
      blur: blurValue ?? blur 
    });
    setSettings(result);
  };

  const handleBlurChange = async (newBlur: number) => {
    setBlur(newBlur);
    const result = await ipcRenderer.invoke('settings:setBackground', { 
      type: settings.background.type, 
      value: settings.background.value, 
      blur: newBlur 
    });
    setSettings(result);
  };

  const handleSelectFile = async () => {
    // Sıkıştırma devam ediyorsa dosya seçimine izin verme
    if (isCompressing) {
      console.log('Sıkıştırma devam ediyor, lütfen bekleyin...');
      return;
    }
    
    const file = await ipcRenderer.invoke('dialog:selectFile');
    if (file) {
      setFileName(file.split('\\').pop() || '');
      // Önce base64'e çevir ve önizleme için ayarla
      const dataUri = fileToBase64(file);
      if (dataUri) {
        setPreviewDataUri(dataUri);
      }
      handleSetBackground(bgType, file);
    }
  };

  const renderPreview = () => {
    const bg = settings.background;
    const blurStyle = { filter: `blur(${(bg.blur || 0) / 5}px)` };
    
    if (bg.type === 'color') {
      return <div className={styles.previewBg} style={{ background: bg.value, ...blurStyle }} />;
    }
    
    if (bg.type === 'video' && previewDataUri) {
      return (
        <video 
          ref={videoRef}
          className={styles.previewVideo}
          src={previewDataUri}
          autoPlay
          loop
          muted
          playsInline
          style={blurStyle}
          key={previewDataUri}
        />
      );
    }
    
    if ((bg.type === 'image' || bg.type === 'gif') && previewDataUri) {
      return (
        <div 
          className={styles.previewBg} 
          style={{ backgroundImage: `url('${previewDataUri}')`, ...blurStyle }}
        />
      );
    }

    return (
      <div className={styles.placeholder}>
        <span>📱</span>
        Arka plan önizlemesi
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.page}
    >
      <h1 className={styles.title}>
        <span>🎨</span> Arka Plan Ayarları
      </h1>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>📁 Tip Seçin</h3>
        <div className={styles.typeGrid}>
          {BG_TYPES.map(type => (
            <motion.button
              key={type.id}
              className={`${styles.typeBtn} ${bgType === type.id ? styles.active : ''}`}
              onClick={() => setBgType(type.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <type.icon size={28} />
              <span>{type.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>👁️ Önizleme</h3>
          <div className={styles.preview}>
            {renderPreview()}
          </div>
          
          {/* Blur Slider */}
          <div className={styles.blurSection}>
            <div className={styles.blurHeader}>
              <Droplets size={16} />
              <span>Blur Efekti: %{blur}</span>
            </div>
            <input
              type="range"
              className={styles.slider}
              min="0"
              max="100"
              value={blur}
              onChange={(e) => handleBlurChange(Number(e.target.value))}
            />
            <div className={styles.blurHint}>
              0% = Net • 100% = Maksimum Blur
            </div>
          </div>
        </div>

        <div>
          {bgType === 'color' ? (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>🎨 Renk Seçin</h3>
              <div className={styles.colorGrid}>
                {COLORS.map((color, i) => (
                  <motion.button
                    key={i}
                    className={`${styles.colorBtn} ${settings.background.value === color ? styles.active : ''}`}
                    style={{ background: color }}
                    onClick={() => handleSetBackground('color', color)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  />
                ))}
              </div>
              
              <div className={styles.customColor}>
                <input
                  type="text"
                  className={styles.colorInput}
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#HEX veya gradient..."
                />
                <div 
                  className={styles.colorPreview}
                  style={{ background: customColor }}
                />
              </div>
              
              <motion.button
                className={styles.applyBtn}
                onClick={() => handleSetBackground('color', customColor)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ✓ Uygula
              </motion.button>
            </div>
          ) : (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📁 Dosya Seçin</h3>
              <motion.div
                className={`${styles.fileUpload} ${isCompressing ? styles.disabled : ''}`}
                onClick={handleSelectFile}
                whileHover={isCompressing ? {} : { borderColor: 'var(--purple)' }}
                style={isCompressing ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
              >
                {isCompressing ? (
                  <>
                    <div className={styles.spinner} />
                    <div className={styles.uploadText}>
                      🎬 Video sıkıştırılıyor...
                    </div>
                    <div className={styles.uploadHint}>
                      Lütfen bekleyin, bu işlem birkaç dakika sürebilir
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={40} className={styles.uploadIcon} />
                    <div className={styles.uploadText}>
                      {fileName || 'Dosya seçmek için tıklayın'}
                    </div>
                    <div className={styles.uploadHint}>
                      Desteklenen: JPG, PNG, GIF, WEBP, MP4, WEBM
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
