import React, { useEffect, useState, useRef, memo } from 'react';
import { View, StyleSheet, StatusBar, BackHandler, Animated, ImageBackground, Image, NativeModules, Dimensions } from 'react-native';
import Video from 'react-native-video';
import { ConnectionStatus, WidgetGrid } from '../components';
import { useSocket, useAmoledProtection } from '../hooks';
import LinearGradient from 'react-native-linear-gradient';

// Orientation locker - native modül kontrolü
let Orientation: any = null;
try {
  // Önce modülü require et
  const OrientationModule = require('react-native-orientation-locker');
  Orientation = OrientationModule.default || OrientationModule;
  console.log('✅ Orientation Locker yüklendi');
} catch (e) {
  console.warn('⚠️ react-native-orientation-locker yüklenemedi:', e);
}

// RNFS'i güvenli şekilde yükle - native modül yoksa null döner
let RNFS: typeof import('react-native-fs') | null = null;
try {
  if (NativeModules.RNFSManager) {
    RNFS = require('react-native-fs');
  }
} catch {
  console.warn('react-native-fs yüklenemedi, dosya önbellekleme devre dışı');
}

// Video arka plan component'i - memo ile gereksiz re-render engellenir
// Key: URI değişmedikçe component yeniden oluşturulmaz
const VideoBackground = memo(({ uri }: { uri: string }) => {
  console.log('🎬 Video component MOUNT:', uri?.substring(0, 60));
  
  return (
    <Video
      source={{ uri }}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
      repeat={true}
      muted={true}
      playInBackground={false}
      playWhenInactive={false}
      bufferConfig={{
        minBufferMs: 15000,
        maxBufferMs: 50000,
        bufferForPlaybackMs: 2500,
        bufferForPlaybackAfterRebufferMs: 5000,
      }}
      onError={(error) => console.error('🎬 Video hatası:', error)}
      onLoad={(data) => console.log('🎬 Video yüklendi:', data)}
    />
  );
}, (prevProps, nextProps) => prevProps.uri === nextProps.uri);

// GIF arka plan component'i - memo ile gereksiz re-render engellenir
const GifBackground = memo(({ uri }: { uri: string }) => {
  return (
    <Image
      source={{ uri }}
      style={styles.gifBackground}
      resizeMode="cover"
    />
  );
}, (prevProps, nextProps) => prevProps.uri === nextProps.uri);

const DashboardScreen: React.FC = () => {
  // PC'ye bağlan (server.ts'den URL alınır)
  const { systemData, settings, connectionStatus, lastError } = useSocket();
  const { offsetX, offsetY, opacity } = useAmoledProtection(settings.amoledProtection);

  const [localMediaUri, setLocalMediaUri] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<'color' | 'image' | 'gif' | 'video'>('color');
  const currentFileRef = useRef<string | null>(null);
  const taskIdRef = useRef<number>(0);

  // Orientation kontrolü - PC'den gelen ayara göre
  useEffect(() => {
    if (!Orientation) {
      console.warn('⚠️ Orientation değiştirilemedi - modül yüklü değil');
      return;
    }
    
    const orientation = settings.orientation || 'portrait';
    console.log('📱 Orientation değişiyor:', orientation);
    
    try {
      if (orientation === 'landscape') {
        Orientation.lockToLandscape();
      } else {
        Orientation.lockToPortrait();
      }
    } catch (e) {
      console.error('Orientation kilitleme hatası:', e);
    }
    
    return () => {
      if (Orientation) {
        try {
          Orientation.unlockAllOrientations();
        } catch {}
      }
    };
  }, [settings.orientation]);
  
  // Stabil background state - sadece background gerçekten değiştiğinde güncellenir
  const [stableBackground, setStableBackground] = useState({
    type: 'color' as 'color' | 'image' | 'gif' | 'video' | 'gradient',
    uri: null as string | null,
    blur: 0,
    colors: ['#0a0a1a', '#0a0a1a', '#0a0a1a'] as string[] | null
  });
  const lastBgValueRef = useRef<string | null>(null);

  // Base64 medya dosyalarını cihazda önbelleğe yaz (RNFS varsa)
  useEffect(() => {
    const bgValue = settings.background?.value;
    const originalType = settings.background?.type || 'color';

    if (!bgValue || typeof bgValue !== 'string' || !bgValue.startsWith('data:')) {
      setLocalMediaUri(null);
      setDetectedType(originalType);
      return;
    }

    const headerMatch = bgValue.match(/^data:(.*?);base64,/);
    if (!headerMatch) {
      setLocalMediaUri(null);
      setDetectedType(originalType);
      return;
    }

    const mime = headerMatch[1];
    let inferredType: 'color' | 'image' | 'gif' | 'video' = originalType;
    let extension = 'bin';
    if (mime.startsWith('video/')) {
      inferredType = 'video';
      extension = mime.split('/')[1] || 'mp4';
    } else if (mime === 'image/gif') {
      inferredType = 'gif';
      extension = 'gif';
    } else if (mime.startsWith('image/')) {
      inferredType = 'image';
      extension = mime.split('/')[1] || 'png';
    }

    // RNFS yoksa - video için özellikle sorunlu, diğerleri için data URI dene
    if (!RNFS) {
      console.log('📱 RNFS yok, inline data URI kullanılıyor (video çalışmayabilir)');
      // Video için data URI çalışmaz, uyar
      if (inferredType === 'video') {
        console.warn('⚠️ Video oynatmak için react-native-fs gerekli! Android rebuild yapın.');
      }
      setLocalMediaUri(bgValue);
      setDetectedType(inferredType);
      return;
    }

    const base64Data = bgValue.slice(headerMatch[0].length);
    const filePath = `${RNFS.CachesDirectoryPath}/bg_${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;
    const taskId = Date.now();
    taskIdRef.current = taskId;

    console.log(`📝 Medya dosyaya yazılıyor: ${inferredType}, ${(base64Data.length / 1024 / 1024).toFixed(2)} MB`);

    RNFS.writeFile(filePath, base64Data, 'base64')
      .then(() => {
        if (taskIdRef.current !== taskId) {
          return RNFS?.unlink(filePath).catch(() => {});
        }

        if (currentFileRef.current && currentFileRef.current !== filePath) {
          RNFS?.unlink(currentFileRef.current).catch(() => {});
        }

        currentFileRef.current = filePath;
        const fileUri = `file://${filePath}`;
        console.log(`✅ Medya kaydedildi: ${fileUri}`);
        setLocalMediaUri(fileUri);
        setDetectedType(inferredType);
      })
      .catch((err) => {
        console.error('🎞️ Medya yazma hatası:', err);
        // Fallback: data URI kullan (video hariç)
        if (inferredType !== 'video') {
          setLocalMediaUri(bgValue);
        } else {
          setLocalMediaUri(null);
        }
        setDetectedType(inferredType);
      });

    return () => {
      taskIdRef.current += 1; // eski yazımı geçersiz kıl
    };
  }, [settings.background?.value, settings.background?.type]);

  useEffect(() => {
    return () => {
      if (currentFileRef.current && RNFS) {
        RNFS.unlink(currentFileRef.current).catch(() => {});
      }
    };
  }, []);

  // Debug log
  useEffect(() => {
    console.log('🖼️ Background state değişti:', {
      type: settings.background?.type,
      valueLength: settings.background?.value?.length,
      valueStart: settings.background?.value?.substring(0, 60),
      blur: settings.background?.blur
    });
  }, [settings.background]);

  // Arka plan türünü ve değerlerini hesapla
  const normalizeUri = (uri?: string | null) => {
    if (!uri) return null;
    if (/^(file|content|https?|data):/.test(uri)) return uri;
    if (uri.startsWith('/')) return `file://${uri}`;
    return uri;
  };

  // Background değişikliğini tespit et ve stabil state'i güncelle
  useEffect(() => {
    const bgValue = settings.background?.value;
    const bgBlur = settings.background?.blur || 0;
    
    // Sadece background value gerçekten değiştiyse güncelle
    const currentValue = localMediaUri || bgValue || '#0a0a1a';
    if (lastBgValueRef.current === currentValue && stableBackground.blur === bgBlur) {
      return; // Değişiklik yok, güncelleme yapma
    }
    lastBgValueRef.current = currentValue;
    
    const rawValue = currentValue;
    let bgType = detectedType || settings.background?.type || 'color';

    if (!localMediaUri && typeof rawValue === 'string' && rawValue.startsWith('data:')) {
      if (rawValue.startsWith('data:video/')) {
        bgType = 'video';
      } else if (rawValue.startsWith('data:image/gif')) {
        bgType = 'gif';
      } else if (rawValue.startsWith('data:image/')) {
        bgType = 'image';
      }
    }

    console.log('🎨 Background güncelleniyor:', { bgType, blur: bgBlur });

    if (bgType === 'video') {
      setStableBackground({
        type: 'video',
        uri: normalizeUri(rawValue),
        blur: bgBlur,
        colors: null
      });
      return;
    }

    if (bgType === 'gif') {
      setStableBackground({
        type: 'gif',
        uri: normalizeUri(rawValue),
        blur: bgBlur,
        colors: null
      });
      return;
    }

    if (bgType === 'image') {
      setStableBackground({
        type: 'image',
        uri: normalizeUri(rawValue),
        blur: bgBlur,
        colors: null
      });
      return;
    }

    if (typeof rawValue === 'string' && rawValue.includes('linear-gradient')) {
      const match = rawValue.match(/#[a-fA-F0-9]{6}/g);
      if (match && match.length >= 2) {
        setStableBackground({
          type: 'gradient',
          uri: null,
          blur: bgBlur,
          colors: [match[0], match[1], match[0]]
        });
        return;
      }
    }

    setStableBackground({
      type: 'color',
      uri: null,
      blur: bgBlur,
      colors: [rawValue as string, rawValue as string, rawValue as string]
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMediaUri, detectedType, settings.background?.value, settings.background?.blur, settings.background?.type]);

  // Geri tuşunu devre dışı bırak
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Geri tuşunu engelle
    });

    return () => backHandler.remove();
  }, []);

  // Animated style for AMOLED protection
  const animatedStyle = {
    transform: [
      { translateX: offsetX },
      { translateY: offsetY },
    ],
    opacity: opacity,
  };

  // Video URI'sini stable tut - sadece gerçekten video varsa
  const videoUri = stableBackground.type === 'video' ? stableBackground.uri : null;
  const isVideo = stableBackground.type === 'video' && !!stableBackground.uri;
  const isGif = stableBackground.type === 'gif' && !!stableBackground.uri;
  const isImage = stableBackground.type === 'image' && !!stableBackground.uri;
  const isColorOrGradient = !isVideo && !isGif && !isImage;

  // TEK BİR CONTAINER - Tüm arka plan türleri burada, conditional unmount YOK
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} translucent backgroundColor="transparent" />

      {/* 1. Gradient/Color Arka Plan - her zaman render, görünürlük kontrollü */}
      {isColorOrGradient && stableBackground.colors && (
        <LinearGradient
          colors={stableBackground.colors as [string, string, ...string[]]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Geometrik desen (sadece color/gradient için) */}
      {isColorOrGradient && (
        <View style={styles.patternOverlay}>
          <View style={[styles.geometricShape, styles.shape1]} />
          <View style={[styles.geometricShape, styles.shape2]} />
          <View style={[styles.geometricShape, styles.shape3]} />
        </View>
      )}

      {/* 2. Video Arka Plan - KEY ile stable tutulur, URI değişmedikçe unmount olmaz */}
      {videoUri && (
        <View style={styles.absoluteFill} key="video-container">
          <VideoBackground uri={videoUri} />
          <View style={styles.videoOverlay} />
        </View>
      )}

      {/* 3. GIF Arka Plan */}
      {isGif && stableBackground.uri && (
        <View style={styles.absoluteFill}>
          <GifBackground uri={stableBackground.uri} />
          <View style={styles.videoOverlay} />
        </View>
      )}

      {/* 4. Image Arka Plan */}
      {isImage && stableBackground.uri && (
        <ImageBackground
          source={{ uri: stableBackground.uri }}
          style={styles.absoluteFill}
          resizeMode="cover"
          blurRadius={stableBackground.blur * 0.25}
        >
          <View style={styles.overlay30} />
        </ImageBackground>
      )}

      {/* Bağlantı Durumu - her zaman üstte */}
      <ConnectionStatus status={connectionStatus} error={lastError} />

      {/* Widget Grid - her zaman üstte */}
      <Animated.View style={[styles.content, animatedStyle]}>
        <WidgetGrid 
          widgets={settings.widgets} 
          systemData={systemData}
          globalStyle={settings.globalStyle}
          globalOpacity={settings.globalOpacity ?? 1}
          orientation={settings.orientation}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gifBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlay30: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.3,
  },
  patternOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  geometricShape: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(100, 100, 150, 0.1)',
  },
  shape1: {
    width: 200,
    height: 200,
    right: 20,
    top: '30%',
    transform: [{ rotate: '45deg' }],
  },
  shape2: {
    width: 150,
    height: 150,
    right: 50,
    top: '40%',
    transform: [{ rotate: '30deg' }],
  },
  shape3: {
    width: 100,
    height: 100,
    right: 80,
    top: '50%',
    transform: [{ rotate: '60deg' }],
  },
  content: {
    flex: 1,
  },
});

export default DashboardScreen;
