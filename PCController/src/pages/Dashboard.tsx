import { motion } from 'framer-motion';
import { Cpu, Monitor, HardDrive } from 'lucide-react';
import { useStore } from '../store/useStore';
import styles from './Dashboard.module.css';

type StatDefinition = {
  id: 'cpu' | 'gpu' | 'ram';
  label: string;
  value: number;
  icon: typeof Cpu;
  tag: string;
  status: string;
  delta: string;
  model: string;
  metaLabel: string;
  metaValue: string;
  metaSecondaryLabel: string;
  metaSecondaryValue: string;
  chipLabel: string;
  chipValue: string;
  detailLabel: string;
  detailValue: string;
};

const clampPercent = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
};

const mbToGb = (value?: number | null) => (value ?? 0) / 1024;

export default function Dashboard() {
  const { hardwareData } = useStore();

  const cpuCores = hardwareData?.cpu.cores ?? [];
  const cpuPeak = cpuCores.length ? Math.max(...cpuCores) : null;
  const coreCount = cpuCores.length || 0;

  const gpuVramUsed = hardwareData?.gpu.vramUsed ?? 0;
  const gpuVramTotal = hardwareData?.gpu.vramTotal ?? 0;
  const gpuVramUsedGb = mbToGb(gpuVramUsed);
  const gpuVramTotalGb = mbToGb(gpuVramTotal);

  const ramUsedMb = hardwareData?.ram.used ?? 0;
  const ramTotalMb = hardwareData?.ram.total ?? 0;
  const ramUsedGb = mbToGb(ramUsedMb);
  const ramTotalGb = mbToGb(ramTotalMb);
  const ramFreeGb = Math.max(ramTotalGb - ramUsedGb, 0);

  const stats: StatDefinition[] = [
    {
      id: 'cpu',
      label: 'CPU Kullanımı',
      value: clampPercent(hardwareData?.cpu.usage ?? 0),
      icon: Cpu,
      tag: 'THERMAL • PERFORMANCE',
      status: `${hardwareData?.cpu.temperature ?? 0}°C`,
      delta: cpuPeak !== null ? `${cpuPeak}% çekirdek tepe` : 'Aktif analiz',
      model: hardwareData?.cpu.name ?? '-',
      metaLabel: 'Çekirdek',
      metaValue: coreCount ? `${coreCount}x` : '—',
      metaSecondaryLabel: 'Tepe çekirdek',
      metaSecondaryValue: cpuPeak !== null ? `${cpuPeak}%` : '—',
      chipLabel: 'Sıcaklık',
      chipValue: `${hardwareData?.cpu.temperature ?? 0}°C`,
      detailLabel: 'Yük ort.',
      detailValue: `${clampPercent(hardwareData?.cpu.usage ?? 0)}%`
    },
    {
      id: 'gpu',
      label: 'GPU Kullanımı',
      value: clampPercent(hardwareData?.gpu.usage ?? 0),
      icon: Monitor,
      tag: 'RENDER • PIPELINE',
      status: `${hardwareData?.gpu.temperature ?? 0}°C`,
      delta: `${gpuVramUsedGb.toFixed(1)} / ${gpuVramTotalGb.toFixed(1)} GB VRAM`,
      model: hardwareData?.gpu.name ?? '-',
      metaLabel: 'VRAM Kullanımı',
      metaValue: `${gpuVramUsedGb.toFixed(1)} / ${gpuVramTotalGb.toFixed(1)} GB`,
      metaSecondaryLabel: 'Sıcaklık',
      metaSecondaryValue: `${hardwareData?.gpu.temperature ?? 0}°C`,
      chipLabel: 'Kapasite',
      chipValue: `${gpuVramTotalGb.toFixed(1)} GB`,
      detailLabel: 'Aktif VRAM',
      detailValue: `${gpuVramUsedGb.toFixed(1)} GB`
    },
    {
      id: 'ram',
      label: 'RAM Kullanımı',
      value: clampPercent(hardwareData?.ram.usagePercent ?? 0),
      icon: HardDrive,
      tag: 'MEMORY • POOL',
      status: `${ramUsedGb.toFixed(1)} / ${ramTotalGb.toFixed(1)} GB`,
      delta: `${ramFreeGb.toFixed(1)} GB boş`,
      model: 'Sistem Belleği',
      metaLabel: 'Kullanılan',
      metaValue: `${ramUsedGb.toFixed(1)} GB`,
      metaSecondaryLabel: 'Toplam',
      metaSecondaryValue: `${ramTotalGb.toFixed(1)} GB`,
      chipLabel: 'Serbest',
      chipValue: `${ramFreeGb.toFixed(1)} GB`,
      detailLabel: 'Yüzde',
      detailValue: `${clampPercent(hardwareData?.ram.usagePercent ?? 0)}%`
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.page}
    >
      <h1 className={styles.title}>
        <span>📊</span> Sistem Panosu
      </h1>

      <div className={styles.grid}>
        {stats.map((stat, index) => (
          <motion.article
            key={stat.id}
            data-theme={stat.id}
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -6, rotateX: 2 }}
          >
            <div className={styles.orbit} />
            <div className={styles.scanline} />
            <div className={styles.cornerOne} />
            <div className={styles.cornerTwo} />

            <div className={styles.cardInner}>
              <div className={styles.cardTop}>
                <span className={styles.badge}>{stat.tag}</span>
                <span className={styles.status}>{stat.status}</span>
              </div>

              <div className={styles.mainRow}>
                <div>
                  <p className={styles.label}>{stat.label}</p>
                  <div className={styles.valueRow}>
                    <span className={styles.value}>{Math.round(stat.value)}</span>
                    <span className={styles.unit}>%</span>
                  </div>
                  <p className={styles.delta}>{stat.delta}</p>
                </div>

                <div className={styles.iconShell}>
                  <span className={styles.iconRing} />
                  <stat.icon size={30} />
                </div>
              </div>

              <div className={styles.barBlock}>
                <div className={styles.barTrack}>
                  <motion.div
                    className={styles.barFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                  />
                </div>
                <span className={styles.barText}>{Math.round(stat.value)}%</span>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span>{stat.metaLabel}</span>
                  <strong>{stat.metaValue}</strong>
                </div>
                <div className={styles.metaItem}>
                  <span>{stat.metaSecondaryLabel}</span>
                  <strong>{stat.metaSecondaryValue}</strong>
                </div>
              </div>

              <div className={styles.footer}>
                <div className={styles.chip}>
                  <span>{stat.chipLabel}</span>
                  <strong>{stat.chipValue}</strong>
                </div>
                <div className={styles.chip}>
                  <span>{stat.detailLabel}</span>
                  <strong>{stat.detailValue}</strong>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
}
