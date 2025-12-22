import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Check, MapPin, X, HardDrive, Plus } from 'lucide-react';
import { offlineMapManager, AVAILABLE_REGIONS, MapRegion } from '../services/offlineMapManager';
import { OfflineMap } from '../services/offlineMapDB';

interface OfflineMapDownloaderProps {
  onClose: () => void;
}

interface DownloadState {
  regionId: string;
  progress: number;
  loaded: number;
  total: number;
  isDownloading: boolean;
  error?: string;
}

const OfflineMapDownloader: React.FC<OfflineMapDownloaderProps> = ({ onClose }) => {
  const [downloadedMaps, setDownloadedMaps] = useState<OfflineMap[]>([]);
  const [downloadStates, setDownloadStates] = useState<Map<string, DownloadState>>(new Map());
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customRegions, setCustomRegions] = useState<MapRegion[]>(() => {
    const saved = localStorage.getItem('customRegions');
    return saved ? JSON.parse(saved) : [];
  });

  // Custom region form state
  const [customName, setCustomName] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customRadius, setCustomRadius] = useState('10'); // km
  const [customUrl, setCustomUrl] = useState('');

  // Load downloaded maps on mount
  useEffect(() => {
    loadDownloadedMaps();
  }, []);

  const loadDownloadedMaps = async () => {
    try {
      const maps = await offlineMapManager.getDownloadedMaps();
      setDownloadedMaps(maps);

      const storage = await offlineMapManager.getStorageUsed();
      setStorageUsed(storage);
    } catch (error) {
      console.error('Failed to load downloaded maps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (region: MapRegion) => {
    const downloadState: DownloadState = {
      regionId: region.id,
      progress: 0,
      loaded: 0,
      total: region.size,
      isDownloading: true
    };

    setDownloadStates(prev => new Map(prev).set(region.id, downloadState));

    try {
      await offlineMapManager.downloadRegion(
        region.id,
        (progress, loaded, total) => {
          setDownloadStates(prev => {
            const newMap = new Map(prev);
            newMap.set(region.id, {
              ...downloadState,
              progress,
              loaded,
              total
            });
            return newMap;
          });
        }
      );

      // Download complete
      setDownloadStates(prev => {
        const newMap = new Map(prev);
        newMap.delete(region.id);
        return newMap;
      });

      // Reload maps
      await loadDownloadedMaps();
    } catch (error: any) {
      setDownloadStates(prev => {
        const newMap = new Map(prev);
        newMap.set(region.id, {
          ...downloadState,
          isDownloading: false,
          error: error.message
        });
        return newMap;
      });
    }
  };

  const handleDelete = async (regionId: string) => {
    if (!confirm('Bu haritayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await offlineMapManager.deleteMap(regionId);

      // Also remove from custom regions if it's custom
      const updatedCustom = customRegions.filter(r => r.id !== regionId);
      if (updatedCustom.length !== customRegions.length) {
        setCustomRegions(updatedCustom);
        localStorage.setItem('customRegions', JSON.stringify(updatedCustom));
      }

      await loadDownloadedMaps();
    } catch (error) {
      console.error('Failed to delete map:', error);
      alert('Harita silinirken bir hata oluştu');
    }
  };

  // Calculate bbox from center and radius
  const calculateBbox = (lat: number, lng: number, radiusKm: number): [number, number, number, number] => {
    // Simple approximation - 1 degree ≈ 111km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return [
      lng - lngDelta, // west
      lat - latDelta, // south
      lng + lngDelta, // east
      lat + latDelta  // north
    ];
  };

  const handleAddCustomRegion = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    const radius = parseFloat(customRadius);

    if (!customName || isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      alert('Lütfen tüm alanları doğru doldurun!');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Geçersiz koordinatlar! Lat: -90 to 90, Lng: -180 to 180');
      return;
    }

    const bbox = calculateBbox(lat, lng, radius);
    const estimatedSize = radius * radius * 1024 * 100; // Rough estimate

    const newRegion: MapRegion = {
      id: `custom-${Date.now()}`,
      name: customName.toLowerCase().replace(/\s+/g, '-'),
      displayName: customName,
      bounds: bbox,
      center: [lng, lat],
      size: estimatedSize,
      zoomRange: { min: 0, max: 14 },
      url: customUrl || `https://r2-public.protomaps.com/protomaps-sample-datasets/${customName.toLowerCase()}.pmtiles`
    };

    const updated = [...customRegions, newRegion];
    setCustomRegions(updated);
    localStorage.setItem('customRegions', JSON.stringify(updated));

    // Reset form
    setCustomName('');
    setCustomLat('');
    setCustomLng('');
    setCustomRadius('10');
    setCustomUrl('');
    setShowCustomForm(false);
  };

  const isDownloaded = (regionId: string): boolean => {
    return downloadedMaps.some(map => map.id === regionId);
  };

  const getDownloadState = (regionId: string): DownloadState | undefined => {
    return downloadStates.get(regionId);
  };

  // Combine preset and custom regions
  const allRegions = [...AVAILABLE_REGIONS, ...customRegions];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >

        {/* Header - Purple/Blue Gradient */}
        <div className="p-6 border-b border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-10"></div>

          <div className="flex items-center justify-between relative z-10">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-white shadow-lg"
                >
                  <MapPin size={24} />
                </motion.div>
                Offline Haritalar
              </h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium"
              >
                İnternet olmadan kullanmak için harita indirin
              </motion.p>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="glass-dark text-white p-3 min-w-[48px] min-h-[48px] rounded-full transition-all flex items-center justify-center"
            >
              <X size={20} />
            </motion.button>
          </div>
        </div>

        {/* Storage Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-6 py-4 bg-white/50 border-b border-white/20"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <HardDrive size={18} className="text-purple-600 dark:text-purple-400" />
              </motion.div>
              <span className="font-medium">Kullanılan Alan:</span>
            </div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="font-bold text-gray-900 dark:text-gray-100 text-base"
            >
              {offlineMapManager.formatBytes(storageUsed)}
            </motion.span>
          </div>
        </motion.div>

        {/* Add Custom Region Button */}
        <div className="px-6 py-3 border-b border-white/20 bg-white/30">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="w-full p-3 glass rounded-xl text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {showCustomForm ? 'İptal' : 'Özel Bölge Ekle'}
          </motion.button>

          {/* Custom Region Form */}
          <AnimatePresence>
            {showCustomForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3"
              >
                <input
                  type="text"
                  placeholder="Bölge Adı (örn: Evim)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 rounded-lg glass border border-white/20 dark:bg-slate-800/50 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Enlem (Lat)"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    className="w-full p-2.5 rounded-lg glass border border-white/20 dark:bg-slate-800/50 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Boylam (Lng)"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    className="w-full p-2.5 rounded-lg glass border border-white/20 dark:bg-slate-800/50 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Yarıçap (km)"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(e.target.value)}
                  className="w-full p-2.5 rounded-lg glass border border-white/20 dark:bg-slate-800/50 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-400"
                />
                <input
                  type="text"
                  placeholder="PMTiles URL (opsiyonel)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full p-2.5 rounded-lg glass border border-white/20 dark:bg-slate-800/50 dark:text-gray-100 text-sm focus:outline-none focus:border-blue-400"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddCustomRegion}
                  className="w-full p-3 gradient-emerald text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Bölge Ekle
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 modern-scrollbar bg-white/30">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
              />
            </motion.div>
          ) : (
            <div className="space-y-4">
              {allRegions.map((region, index) => {
                const isCustom = region.id.startsWith('custom-');
                const downloaded = isDownloaded(region.id);
                const downloadState = getDownloadState(region.id);
                const isDownloading = downloadState?.isDownloading || false;

                return (
                  <motion.div
                    key={region.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="relative glass rounded-2xl p-5 shadow-md hover:shadow-xl transition-all group overflow-hidden"
                  >
                    {/* Gradient border on hover */}
                    <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-purple-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                    <div className="absolute inset-[2px] rounded-2xl bg-white dark:bg-slate-800 -z-10"></div>

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <motion.div
                        whileHover={{ rotate: downloaded ? 0 : 360 }}
                        transition={{ duration: 0.6 }}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                          downloaded ? 'gradient-emerald text-white' : 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600'
                        }`}
                      >
                        {downloaded ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring" }}
                          >
                            <Check size={28} />
                          </motion.div>
                        ) : (
                          <MapPin size={28} />
                        )}
                      </motion.div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{region.displayName}</h3>
                          {isCustom && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full font-semibold">
                              Özel
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                          Boyut: {offlineMapManager.formatBytes(region.size)} • Zoom: {region.zoomRange.min}-{region.zoomRange.max}
                        </p>

                        {/* Progress Bar */}
                        {isDownloading && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3"
                          >
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${downloadState?.progress || 0}%` }}
                                transition={{ duration: 0.3 }}
                                className="gradient-emerald h-full relative overflow-hidden"
                              >
                                {/* Shimmer effect */}
                                <motion.div
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                />
                              </motion.div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2 font-medium">
                              İndiriliyor... {Math.round(downloadState?.progress || 0)}%
                              {downloadState?.loaded && downloadState?.total && (
                                <span className="ml-2">
                                  ({offlineMapManager.formatBytes(downloadState.loaded)} / {offlineMapManager.formatBytes(downloadState.total)})
                                </span>
                              )}
                            </p>
                          </motion.div>
                        )}

                        {/* Error */}
                        {downloadState?.error && (
                          <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs text-red-500 mt-2 font-medium"
                          >
                            ❌ {downloadState.error}
                          </motion.p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {downloaded ? (
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(region.id)}
                            className="p-3.5 min-w-[52px] min-h-[52px] glass text-red-500 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center shadow-md"
                            title="Sil"
                          >
                            <Trash2 size={22} />
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={!isDownloading ? { scale: 1.05 } : {}}
                            whileTap={!isDownloading ? { scale: 0.95 } : {}}
                            onClick={() => handleDownload(region)}
                            disabled={isDownloading}
                            className={`p-3.5 min-w-[52px] min-h-[52px] rounded-xl transition-all flex items-center justify-center ${
                              isDownloading
                                ? 'glass text-gray-400 cursor-not-allowed'
                                : 'gradient-emerald text-white shadow-lg glow btn-modern'
                            }`}
                            title="İndir"
                          >
                            {isDownloading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Download size={22} />
                              </motion.div>
                            ) : (
                              <Download size={22} />
                            )}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-white/20"
        >
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block"
            >
              💡
            </motion.span>
            {' '}<strong>Not:</strong> İndirilen haritalar cihazınızda saklanır ve internet bağlantısı olmadan kullanılabilir.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default OfflineMapDownloader;
