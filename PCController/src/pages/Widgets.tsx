import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Monitor, HardDrive, Clock, Move, Paintbrush } from 'lucide-react';
import { useStore } from '../store/useStore';
import styles from './Widgets.module.css';

const { ipcRenderer } = window.require('electron');

const WIDGET_ICONS: Record<string, any> = {
  cpu: Cpu,
  gpu: Monitor,
  ram: HardDrive,
  clock: Clock
};

const WIDGET_NAMES: Record<string, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  clock: 'CLOCK'
};

const WIDGET_SUBTITLES: Record<string, Record<string, string>> = {
  cpu: { normal: 'CENTRAL PROCESSING UNIT', cyber: 'PROC.UNIT' },
  gpu: { normal: 'GRAPHICS PROCESSING UNIT', cyber: 'GRAPH.UNIT' },
  ram: { normal: 'RANDOM ACCESS MEMORY', cyber: 'MEM.UNIT' },
  clock: { normal: 'LOCAL TIME', cyber: 'SYS.TIME' }
};

const COLORS = [
  '#a855f7', '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ffffff'
];

// Portrait pozisyonları
const PORTRAIT_POSITIONS = [
  { id: 'tl', label: '↖', pos: 'Sol Üst' },
  { id: 'tc', label: '↑', pos: 'Orta Üst' },
  { id: 'tr', label: '↗', pos: 'Sağ Üst' },
  { id: 'ml', label: '←', pos: 'Sol' },
  { id: 'mc', label: '●', pos: 'Orta' },
  { id: 'mr', label: '→', pos: 'Sağ' },
  { id: 'bl', label: '↙', pos: 'Sol Alt' },
  { id: 'bc', label: '↓', pos: 'Orta Alt' },
  { id: 'br', label: '↘', pos: 'Sağ Alt' }
];

// Landscape pozisyonları (yatay mod)
const LANDSCAPE_POSITIONS = [
  { id: 'l', label: '◀', pos: 'Sol' },
  { id: 'cl', label: '◁', pos: 'Sol Orta' },
  { id: 'cr', label: '▷', pos: 'Sağ Orta' },
  { id: 'r', label: '▶', pos: 'Sağ' }
];

// Pozisyon hesaplama için grid noktaları (yüzde olarak) - Portrait
// Widget'lar kenardan taşmayacak şekilde konumlanır
const PORTRAIT_POSITION_COORDS: Record<string, { x: number; y: number }> = {
  tl: { x: 5, y: 12 },
  tc: { x: 50, y: 12 },
  tr: { x: 95, y: 12 },
  ml: { x: 5, y: 42 },
  mc: { x: 50, y: 42 },
  mr: { x: 95, y: 42 },
  bl: { x: 5, y: 72 },
  bc: { x: 50, y: 72 },
  br: { x: 95, y: 72 }
};

// Landscape pozisyonları (yüzde olarak)
const LANDSCAPE_POSITION_COORDS: Record<string, { x: number; y: number }> = {
  l: { x: 5, y: 50 },
  cl: { x: 35, y: 50 },
  cr: { x: 65, y: 50 },
  r: { x: 95, y: 50 }
};

// Stil konfigürasyonları - telefondaki ile tıpatıp aynı
const getStyleConfig = (styleName: string, color: string) => {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 168, g: 85, b: 247 };
  };
  
  const rgb = hexToRgb(color);
  
  const configs: Record<string, any> = {
    modern: {
      background: `linear-gradient(135deg, rgba(25, 20, 45, 0.95), rgba(25, 20, 45, 0.95))`,
      border: 'none',
      borderRadius: '20px',
      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
      innerGlow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
      accentBar: color,
    },
    glass: {
      background: `rgba(255, 255, 255, 0.08)`,
      border: `1px solid rgba(255, 255, 255, 0.2)`,
      borderRadius: '24px',
      boxShadow: 'none',
      glassShine: 'rgba(255, 255, 255, 0.3)',
      glassAccent: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
    },
    neon: {
      background: 'rgba(0, 0, 0, 0.92)',
      border: `2px solid ${color}`,
      borderRadius: '16px',
      boxShadow: `0 0 20px ${color}80, 0 0 40px ${color}30`,
      outerGlow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
    },
    minimal: {
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '0',
      boxShadow: 'none',
      minimalAccent: color,
    },
    gradient: {
      background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15))`,
      border: `2px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
      borderRadius: '20px',
      boxShadow: `0 10px 40px rgba(0, 0, 0, 0.3)`,
    },
    cyber: {
      background: 'rgba(5, 10, 25, 0.95)',
      border: `1px solid ${color}`,
      borderRadius: '4px',
      boxShadow: `0 0 10px ${color}50`,
    }
  };
  
  return { ...configs[styleName], rgb } || { ...configs.modern, rgb };
};

export default function Widgets() {
  const { settings, selectedWidget, setSelectedWidget, updateWidget, setSettings } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  if (!settings) return null;

  // Orientation'a göre pozisyon listesi
  const isLandscape = settings.orientation === 'landscape';
  const POSITIONS = isLandscape ? LANDSCAPE_POSITIONS : PORTRAIT_POSITIONS;
  const POSITION_COORDS = isLandscape ? LANDSCAPE_POSITION_COORDS : PORTRAIT_POSITION_COORDS;

  const selected = settings.widgets.find(w => w.id === selectedWidget);

  const handleUpdate = async (id: string, props: any) => {
    updateWidget(id, props);
    const result = await ipcRenderer.invoke('settings:updateWidget', id, props);
    setLocalSettings(result);
  };

  const handleGlobalStyleChange = async (style: string) => {
    const result = await ipcRenderer.invoke('settings:setGlobalStyle', style);
    setSettings(result);
  };

  const handleGlobalOpacityChange = async (opacity: number) => {
    console.log('🎚️ Slider değişti:', opacity);
    const result = await ipcRenderer.invoke('settings:setGlobalOpacity', opacity);
    console.log('📩 IPC sonucu:', result?.globalOpacity);
    setSettings(result);
  };

  // Kullanılan pozisyonları al (sürüklenen widget hariç)
  const getOccupiedPositions = useCallback((excludeWidgetId?: string): Set<string> => {
    const occupied = new Set<string>();
    settings.widgets
      .filter(w => w.enabled && w.id !== excludeWidgetId)
      .forEach(w => occupied.add(w.position));
    return occupied;
  }, [settings.widgets]);

  // En yakın BOŞ pozisyonu bul
  const findNearestPosition = useCallback((x: number, y: number, excludeWidgetId?: string): string => {
    const occupiedPositions = getOccupiedPositions(excludeWidgetId);
    let nearestPos = 'tl';
    let minDistance = Infinity;

    Object.entries(POSITION_COORDS).forEach(([posId, coords]) => {
      // Dolu pozisyonları atla
      if (occupiedPositions.has(posId)) return;
      
      const distance = Math.sqrt(
        Math.pow(x - coords.x, 2) + Math.pow(y - coords.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestPos = posId;
      }
    });

    return nearestPos;
  }, [getOccupiedPositions]);

  // Sürükleme başlat
  const handleDragStart = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    setDraggedWidget(widgetId);
    setSelectedWidget(widgetId);
    
    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDragPosition({ x, y });
      setHoveredPosition(findNearestPosition(x, y, widgetId));
    }
  };

  // Sürükleme devam
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggedWidget || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    setDragPosition({ x, y });
    setHoveredPosition(findNearestPosition(x, y, draggedWidget));
  }, [draggedWidget, findNearestPosition]);

  // Sürükleme bitir
  const handleDragEnd = useCallback(() => {
    if (draggedWidget && hoveredPosition) {
      handleUpdate(draggedWidget, { position: hoveredPosition });
    }
    setDraggedWidget(null);
    setDragPosition(null);
    setHoveredPosition(null);
  }, [draggedWidget, hoveredPosition]);

  // Mouse leave - sürüklemeyi iptal et
  const handleMouseLeave = useCallback(() => {
    if (draggedWidget) {
      setDraggedWidget(null);
      setDragPosition(null);
      setHoveredPosition(null);
    }
  }, [draggedWidget]);

  const getPositionStyle = (pos: string, scale: number = 1) => {
    // Sabit preview scale - widget boyutu ne olursa olsun önizlemede sabit görünsün
    const previewScale = 0.5;
    const actualScale = scale * previewScale;
    
    // Portrait layout - kenardan taşmayacak şekilde
    // Sol kenar widget'ları sola yaslanmış, sağ kenar sağa yaslanmış
    const portraitStyles: Record<string, any> = {
      tl: { top: '12%', left: '5%', transformOrigin: 'top left' },
      tc: { top: '12%', left: '50%', transformOrigin: 'top center' },
      tr: { top: '12%', left: '95%', transformOrigin: 'top right' },
      ml: { top: '42%', left: '5%', transformOrigin: 'center left' },
      mc: { top: '42%', left: '50%', transformOrigin: 'center center' },
      mr: { top: '42%', left: '95%', transformOrigin: 'center right' },
      bl: { top: '72%', left: '5%', transformOrigin: 'center left' },
      bc: { top: '72%', left: '50%', transformOrigin: 'center center' },
      br: { top: '72%', left: '95%', transformOrigin: 'center right' }
    };

    // Landscape pozisyonları
    const landscapeStyles: Record<string, any> = {
      l: { top: '50%', left: '5%', transformOrigin: 'center left' },
      cl: { top: '50%', left: '35%', transformOrigin: 'center center' },
      cr: { top: '50%', left: '65%', transformOrigin: 'center center' },
      r: { top: '50%', left: '95%', transformOrigin: 'center right' },
      tl: { top: '50%', left: '5%', transformOrigin: 'center left' },
      tr: { top: '50%', left: '35%', transformOrigin: 'center center' },
      bl: { top: '50%', left: '65%', transformOrigin: 'center center' },
      br: { top: '50%', left: '95%', transformOrigin: 'center right' }
    };

    // Transform - pozisyona göre farklı translate
    const portraitTransforms: Record<string, string> = {
      tl: `translate(0, 0) scale(${actualScale})`,           // sol üst - sola yasla
      tc: `translate(-50%, 0) scale(${actualScale})`,        // orta üst - ortala
      tr: `translate(-100%, 0) scale(${actualScale})`,       // sağ üst - sağa yasla
      ml: `translate(0, -50%) scale(${actualScale})`,        // sol orta
      mc: `translate(-50%, -50%) scale(${actualScale})`,     // tam orta
      mr: `translate(-100%, -50%) scale(${actualScale})`,    // sağ orta
      bl: `translate(0, -50%) scale(${actualScale})`,        // sol alt
      bc: `translate(-50%, -50%) scale(${actualScale})`,     // orta alt
      br: `translate(-100%, -50%) scale(${actualScale})`     // sağ alt
    };

    const landscapeScale = 0.55;
    const lActualScale = scale * landscapeScale;
    const landscapeTransforms: Record<string, string> = {
      l: `translate(0, -50%) scale(${lActualScale})`,
      cl: `translate(-50%, -50%) scale(${lActualScale})`,
      cr: `translate(-50%, -50%) scale(${lActualScale})`,
      r: `translate(-100%, -50%) scale(${lActualScale})`,
      tl: `translate(0, -50%) scale(${lActualScale})`,
      tr: `translate(-50%, -50%) scale(${lActualScale})`,
      bl: `translate(-50%, -50%) scale(${lActualScale})`,
      br: `translate(-100%, -50%) scale(${lActualScale})`
    };

    const baseStyles = isLandscape ? landscapeStyles : portraitStyles;
    const transforms = isLandscape ? landscapeTransforms : portraitTransforms;
    
    return {
      ...baseStyles[pos],
      transform: transforms[pos]
    } || { ...portraitStyles.tl, transform: portraitTransforms.tl };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.page}
    >
      <h1 className={styles.title}>
        <span>📱</span> Widget Ayarları
      </h1>

      <div className={styles.editor}>
        <div className={styles.previewSection}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              📺 Önizleme ({isLandscape ? 'Yatay' : 'Dikey'} Mod) 
              <span className={styles.dragHint}>- Widget'ları sürükle!</span>
            </h3>
            <div 
              ref={previewRef}
              className={`${styles.preview} ${isLandscape ? styles.landscape : ''} ${draggedWidget ? styles.dragging : ''}`}
              style={{ 
                background: settings.background.type === 'color' ? settings.background.value : '#0a0a1a',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleMouseLeave}
            >
              {/* Arka plan medya önizleme */}
              {settings.background.type === 'image' && settings.background.value && (
                <img
                  src={settings.background.value.startsWith('data:') 
                    ? settings.background.value 
                    : `file://${settings.background.value}`}
                  alt="Background"
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    filter: `blur(${settings.background.blur * 0.5}px)`,
                    opacity: 0.9
                  }}
                />
              )}
              {settings.background.type === 'video' && settings.background.value && (
                <video
                  key={settings.background.value}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    filter: `blur(${settings.background.blur * 0.5}px)`,
                    opacity: 0.9
                  }}
                >
                  <source 
                    src={settings.background.value.startsWith('data:') 
                      ? settings.background.value 
                      : `file://${settings.background.value}`} 
                    type="video/mp4" 
                  />
                </video>
              )}
              {settings.background.type === 'gif' && settings.background.value && (
                <img
                  src={settings.background.value.startsWith('data:') 
                    ? settings.background.value 
                    : `file://${settings.background.value}`}
                  alt="GIF Background"
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    filter: `blur(${settings.background.blur * 0.5}px)`,
                    opacity: 0.9
                  }}
                />
              )}
              
              {/* Gradient overlay for better widget visibility */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
                pointerEvents: 'none'
              }} />
              
              {/* Pozisyon göstergeleri (sürüklerken görünür) */}
              {draggedWidget && (
                <div className={styles.positionOverlay}>
                  {Object.entries(POSITION_COORDS).map(([posId, coords]) => {
                    const isOccupied = getOccupiedPositions(draggedWidget).has(posId);
                    return (
                      <div
                        key={posId}
                        className={`${styles.dropZone} ${hoveredPosition === posId ? styles.active : ''} ${isOccupied ? styles.occupied : ''}`}
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className={styles.dropZoneInner}>
                          {isOccupied && <span className={styles.occupiedIcon}>✕</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {settings.widgets.filter(w => w.enabled).map(widget => {
                const Icon = WIDGET_ICONS[widget.type];
                const styleConfig = getStyleConfig(settings.globalStyle || 'modern', widget.color);
                const isSelected = selectedWidget === widget.id;
                const isDragging = draggedWidget === widget.id;
                const isClock = widget.type === 'clock';
                const isCyber = settings.globalStyle === 'cyber';
                const isNeon = settings.globalStyle === 'neon';
                const isMinimal = settings.globalStyle === 'minimal';
                const isGlass = settings.globalStyle === 'glass';
                const isModern = settings.globalStyle === 'modern' || !settings.globalStyle;
                const isGradient = settings.globalStyle === 'gradient';
                const mockValue = 45;
                
                // Sürüklenirken pozisyon
                const widgetOpacity = widget.opacity ?? 1;
                const widgetStyle = isDragging && dragPosition
                  ? {
                      left: `${dragPosition.x}%`,
                      top: `${dragPosition.y}%`,
                      transform: `translate(-50%, -50%) scale(${widget.size / 100})`,
                      transformOrigin: 'center center',
                      zIndex: 100,
                      opacity: 0.9,
                      cursor: 'grabbing',
                    }
                  : {
                      ...getPositionStyle(widget.position, widget.size / 100),
                      opacity: widgetOpacity,
                      cursor: 'grab',
                    };
                
                return (
                  <motion.div
                    key={widget.id}
                    className={`${styles.previewWidget} ${isSelected ? styles.selected : ''} ${isDragging ? styles.isDragging : ''}`}
                    style={{
                      ...widgetStyle,
                      background: styleConfig.background,
                      border: styleConfig.border,
                      borderBottom: styleConfig.borderBottom,
                      borderRadius: styleConfig.borderRadius,
                      boxShadow: isDragging ? `0 10px 40px rgba(0,0,0,0.5), 0 0 0 2px ${widget.color}` : styleConfig.boxShadow,
                      outline: isSelected && !isDragging ? `2px solid ${widget.color}` : 'none',
                      outlineOffset: '2px',
                      padding: isMinimal ? '10px' : '12px',
                      overflow: 'hidden',
                      minWidth: isClock ? '110px' : '100px',
                      minHeight: isClock ? '115px' : '85px',
                      transition: isDragging ? 'none' : 'all 0.3s ease',
                      userSelect: 'none',
                    }}
                    onMouseDown={(e) => handleDragStart(e, widget.id)}
                    onClick={() => !draggedWidget && setSelectedWidget(widget.id)}
                    animate={isDragging ? {} : undefined}
                  >
                    {/* Modern - Inner Glow */}
                    {isModern && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                        background: styleConfig.innerGlow,
                        borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
                        pointerEvents: 'none'
                      }} />
                    )}
                    
                    {/* Modern - Accent Bar */}
                    {isModern && (
                      <div style={{
                        position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '4px',
                        background: styleConfig.accentBar,
                        borderRadius: '2px'
                      }} />
                    )}
                    
                    {/* Glass - Top shine */}
                    {isGlass && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                        background: styleConfig.glassShine,
                        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                        pointerEvents: 'none'
                      }} />
                    )}
                    
                    {/* Glass - Left accent */}
                    {isGlass && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                        background: styleConfig.glassAccent,
                        borderTopLeftRadius: '24px', borderBottomLeftRadius: '24px'
                      }} />
                    )}
                    
                    {/* Neon - Outer glow border */}
                    {isNeon && (
                      <div style={{ 
                        position: 'absolute', top: '-5px', left: '-5px', right: '-5px', bottom: '-5px',
                        borderRadius: '21px', border: `1px solid ${styleConfig.outerGlow}`,
                        pointerEvents: 'none'
                      }} />
                    )}
                    
                    {/* Minimal - Accent bar */}
                    {isMinimal && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0, width: '2px', height: '20px',
                        background: styleConfig.minimalAccent
                      }} />
                    )}
                    
                    {/* Gradient - Shimmer effect */}
                    {isGradient && (
                      <motion.div
                        style={{
                          position: 'absolute', top: 0, bottom: 0, width: '60px',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                          transform: 'skewX(-20deg)',
                        }}
                        animate={{ left: ['-60px', '150px'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    
                    {/* Cyber - Grid lines */}
                    {isCyber && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                        {[0, 1, 2, 3, 4].map(i => (
                          <div key={i} style={{
                            position: 'absolute', left: 0, right: 0, height: '1px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            top: `${i * 22}px`
                          }} />
                        ))}
                      </div>
                    )}
                    
                    {/* Cyber - Scanline animation */}
                    {isCyber && (
                      <motion.div
                        style={{
                          position: 'absolute', left: 0, right: 0, height: '2px',
                          background: `rgba(${styleConfig.rgb.r}, ${styleConfig.rgb.g}, ${styleConfig.rgb.b}, 0.4)`,
                        }}
                        animate={{ top: ['0px', '100px'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    
                    {/* Cyber - Corner cuts */}
                    {isCyber && (
                      <>
                        <div style={{
                          position: 'absolute', top: 0, right: 0,
                          width: 0, height: 0,
                          borderStyle: 'solid',
                          borderWidth: '12px 12px 0 0',
                          borderColor: '#0a0a1a transparent transparent transparent'
                        }} />
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0,
                          width: 0, height: 0,
                          borderStyle: 'solid',
                          borderWidth: '0 0 12px 12px',
                          borderColor: 'transparent transparent #0a0a1a transparent'
                        }} />
                      </>
                    )}
                    
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: isClock ? '4px' : '3px', position: 'relative', zIndex: 10 }}>
                      <span style={{ 
                        color: widget.color,
                        fontSize: isCyber ? '9px' : isMinimal ? '9px' : '10px',
                        fontWeight: isCyber || isNeon ? '700' : isMinimal ? '500' : 'bold',
                        letterSpacing: isCyber ? '2px' : isMinimal ? '2px' : '0.5px',
                        textShadow: isNeon ? `0 0 10px ${widget.color}` : 'none',
                        fontFamily: isCyber ? 'monospace' : 'inherit',
                      }}>
                        {isCyber ? `[ ${WIDGET_NAMES[widget.type]} ]` : WIDGET_NAMES[widget.type]}
                      </span>
                      <span style={{
                        color: isCyber ? `rgba(${styleConfig.rgb.r}, ${styleConfig.rgb.g}, ${styleConfig.rgb.b}, 0.6)` : 'rgba(255,255,255,0.4)',
                        fontSize: '5px',
                        marginLeft: '5px',
                        letterSpacing: isCyber ? '1px' : '0.5px',
                      }}>
                        {WIDGET_SUBTITLES[widget.type]?.[isCyber ? 'cyber' : 'normal'] || ''}
                      </span>
                    </div>
                    
                    {/* Clock Widget Content */}
                    {isClock ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative', zIndex: 10 }}>
                        {/* Analog clock for non-cyber styles */}
                        {!isCyber && (
                          <svg width="50" height="50" style={{ marginBottom: '4px' }}>
                            {/* Clock face */}
                            <circle cx="25" cy="25" r="22" stroke={widget.color} strokeWidth={isNeon ? '2' : '1.5'} fill="rgba(0,0,0,0.2)" />
                            {/* Hour markers */}
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
                              const angle = (i * 30 - 90) * (Math.PI / 180);
                              const x1 = 25 + 17 * Math.cos(angle);
                              const y1 = 25 + 17 * Math.sin(angle);
                              const x2 = 25 + 20 * Math.cos(angle);
                              const y2 = 25 + 20 * Math.sin(angle);
                              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={widget.color} strokeWidth={i % 3 === 0 ? '2' : '1'} />;
                            })}
                            {/* Hour hand (pointing to 2) */}
                            <line x1="25" y1="25" x2="25" y2="12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" transform="rotate(60 25 25)" />
                            {/* Minute hand (pointing to 6) */}
                            <line x1="25" y1="25" x2="25" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" transform="rotate(192 25 25)" />
                            {/* Second hand */}
                            <line x1="25" y1="28" x2="25" y2="6" stroke={widget.color} strokeWidth="1" strokeLinecap="round" transform="rotate(90 25 25)" />
                            {/* Center dot */}
                            <circle cx="25" cy="25" r="2.5" fill={widget.color} />
                          </svg>
                        )}
                        
                        {/* Cyber digital clock */}
                        {isCyber ? (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              color: widget.color,
                              fontSize: '20px',
                              fontWeight: '700',
                              fontFamily: 'monospace',
                              letterSpacing: '1px',
                            }}>
                              14:32:15
                            </div>
                            <div style={{
                              color: `rgba(${styleConfig.rgb.r}, ${styleConfig.rgb.g}, ${styleConfig.rgb.b}, 0.6)`,
                              fontSize: '8px',
                              fontFamily: 'monospace',
                              marginTop: '3px',
                            }}>
                              {'> 2025.11.26'}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                              <span style={{ 
                                color: '#ffffff',
                                fontSize: isMinimal ? '18px' : '20px',
                                fontWeight: isMinimal ? '200' : isGlass ? '200' : '300',
                                letterSpacing: '1px',
                                textShadow: isNeon ? `0 0 8px ${widget.color}` : 'none',
                              }}>14:32</span>
                              <span style={{ color: widget.color, fontSize: '12px', fontWeight: '300' }}>:15</span>
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '7px', marginTop: '2px' }}>Çarşamba, 26 Kas</span>
                          </>
                        )}
                      </div>
                    ) : (
                      /* Non-clock widget content */
                      <>
                        {/* Device name for CPU/GPU */}
                        {(widget.type === 'cpu' || widget.type === 'gpu') && (
                          <div style={{
                            color: '#ffffff',
                            fontSize: '7px',
                            opacity: 0.8,
                            marginBottom: '6px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontFamily: isCyber ? 'monospace' : 'inherit',
                            position: 'relative', zIndex: 10,
                          }}>
                            {isCyber ? '> ' : ''}{widget.type === 'cpu' ? 'Intel Core i7-9750H' : 'NVIDIA RTX 3060'}
                          </div>
                        )}
                        
                        {/* Value with gauge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', position: 'relative', zIndex: 10 }}>
                          <span style={{ 
                            color: '#ffffff',
                            fontSize: isMinimal ? '20px' : '24px',
                            fontWeight: isMinimal ? '200' : isGlass ? '300' : '700',
                            textShadow: isNeon ? `0 0 8px ${widget.color}` : 'none',
                            fontFamily: isCyber ? 'monospace' : 'inherit',
                          }}>
                            {isCyber ? '> ' : ''}{mockValue}%
                          </span>
                          
                          {/* Circular gauge */}
                          <svg width="40" height="40">
                            <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.1)" strokeWidth={isMinimal ? '2' : '4'} fill="none" />
                            <circle 
                              cx="20" cy="20" r="16" 
                              stroke={widget.color} 
                              strokeWidth={isMinimal ? '2' : '4'} 
                              fill="none"
                              strokeDasharray={`${(mockValue / 100) * 100.5} 100.5`}
                              strokeLinecap={isCyber ? 'butt' : 'round'}
                              transform="rotate(-90 20 20)"
                              style={{ filter: isNeon ? `drop-shadow(0 0 4px ${widget.color})` : 'none' }}
                            />
                          </svg>
                        </div>
                        
                        {/* Progress bar */}
                        {isCyber ? (
                          /* Cyber segmented bar */
                          <div style={{ display: 'flex', justifyContent: 'space-between', height: '5px', position: 'relative', zIndex: 10 }}>
                            {[...Array(12)].map((_, i) => (
                              <div key={i} style={{
                                flex: 1,
                                marginRight: i < 11 ? '2px' : 0,
                                background: i < Math.floor((mockValue / 100) * 12) ? widget.color : 'rgba(255,255,255,0.1)',
                              }} />
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            height: isMinimal ? '3px' : '4px',
                            background: isMinimal ? 'transparent' : 'rgba(255,255,255,0.1)',
                            border: isMinimal ? '1px solid rgba(255,255,255,0.2)' : 'none',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            position: 'relative', zIndex: 10,
                          }}>
                            <div style={{
                              width: `${mockValue}%`,
                              height: '100%',
                              background: isGradient 
                                ? `linear-gradient(90deg, ${widget.color}, ${widget.color}80)` 
                                : widget.color,
                              borderRadius: '2px',
                              boxShadow: isNeon ? `0 0 10px ${widget.color}` : 'none',
                            }} />
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.settingsSection}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>🎛️ Widgetlar</h3>
            <div className={styles.widgetList}>
              {settings.widgets.map(widget => {
                const Icon = WIDGET_ICONS[widget.type];
                const widgetNames: Record<string, string> = {
                  cpu: 'CPU Widget',
                  gpu: 'GPU Widget',
                  ram: 'RAM Widget',
                  clock: 'Saat Widget'
                };
                return (
                  <motion.div
                    key={widget.id}
                    className={`${styles.widgetItem} ${selectedWidget === widget.id ? styles.selected : ''}`}
                    onClick={() => setSelectedWidget(widget.id)}
                    whileHover={{ x: 4 }}
                  >
                    <div className={styles.widgetIcon} style={{ background: `${widget.color}22`, color: widget.color }}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.widgetInfo}>
                      <div className={styles.widgetName}>{widgetNames[widget.type]}</div>
                      <div className={styles.widgetMeta}>{widget.size}%</div>
                    </div>
                    <button
                      className={`${styles.toggle} ${widget.enabled ? styles.on : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdate(widget.id, { enabled: !widget.enabled });
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Paintbrush size={16} /> Global Stil</h3>
            <p className={styles.styleHint}>Tüm widget'lara uygulanır</p>
            <div className={styles.styleGrid}>
              {[
                { id: 'modern', icon: '🎨', label: 'Modern' },
                { id: 'glass', icon: '🧊', label: 'Glass' },
                { id: 'neon', icon: '💡', label: 'Neon' },
                { id: 'minimal', icon: '✨', label: 'Minimal' },
                { id: 'gradient', icon: '🌈', label: 'Gradient' },
                { id: 'cyber', icon: '🤖', label: 'Cyber' },
                { id: 'unified', icon: '📊', label: 'Unified' }
              ].map(style => (
                <motion.button
                  key={style.id}
                  className={`${styles.styleBtn} ${settings.globalStyle === style.id ? styles.active : ''}`}
                  onClick={() => handleGlobalStyleChange(style.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={styles.styleIcon}>{style.icon}</span>
                  <span>{style.label}</span>
                </motion.button>
              ))}
            </div>
            
            <div className={styles.settingGroup} style={{ marginTop: '16px' }}>
              <label className={styles.settingLabel}>
                🔆 Global Opaklık: {Math.round((settings.globalOpacity ?? 1) * 100)}%
              </label>
              <input
                type="range"
                className={styles.slider}
                min={10}
                max={100}
                step={1}
                value={Math.round((settings.globalOpacity ?? 1) * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  handleGlobalOpacityChange(val);
                }}
              />
            </div>
          </div>

          {selected && (
            <motion.div
              className={styles.widgetSettings}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>Widget Rengi</label>
                <div className={styles.colorGrid}>
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className={`${styles.colorBtn} ${selected.color === color ? styles.active : ''}`}
                      style={{ background: color }}
                      onClick={() => handleUpdate(selected.id, { color })}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>Boyut: {selected.size}%</label>
                <input
                  type="range"
                  className={styles.slider}
                  min="50"
                  max="150"
                  value={selected.size}
                  onChange={(e) => handleUpdate(selected.id, { size: parseInt(e.target.value) })}
                />
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>Opaklık: {Math.round((selected.opacity ?? 1) * 100)}%</label>
                <input
                  type="range"
                  className={styles.slider}
                  min="10"
                  max="100"
                  value={Math.round((selected.opacity ?? 1) * 100)}
                  onChange={(e) => handleUpdate(selected.id, { opacity: parseInt(e.target.value) / 100 })}
                />
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>
                  <Move size={14} /> Pozisyon
                </label>
                <div className={styles.positionGrid}>
                  {POSITIONS.map(pos => {
                    const isOccupied = getOccupiedPositions(selected.id).has(pos.id);
                    const isCurrentPos = selected.position === pos.id;
                    return (
                      <button
                        key={pos.id}
                        className={`${styles.posBtn} ${isCurrentPos ? styles.active : ''} ${isOccupied ? styles.disabled : ''}`}
                        onClick={() => !isOccupied && handleUpdate(selected.id, { position: pos.id })}
                        title={isOccupied ? `${pos.pos} - Dolu` : pos.pos}
                        disabled={isOccupied}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
