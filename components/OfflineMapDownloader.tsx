import React, { useState, useEffect } from 'react';
import { Download, Trash2, Check, MapPin, X, HardDrive } from 'lucide-react';
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
      await loadDownloadedMaps();
    } catch (error) {
      console.error('Failed to delete map:', error);
      alert('Harita silinirken bir hata oluştu');
    }
  };

  const isDownloaded = (regionId: string): boolean => {
    return downloadedMaps.some(map => map.id === regionId);
  };

  const getDownloadState = (regionId: string): DownloadState | undefined => {
    return downloadStates.get(regionId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="text-emerald-600" size={28} />
              Offline Haritalar
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              İnternet olmadan kullanmak için harita indirin
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500 min-w-[48px] min-h-[48px] flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        {/* Storage Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <HardDrive size={16} />
              <span>Kullanılan Alan:</span>
            </div>
            <span className="font-semibold text-gray-800">
              {offlineMapManager.formatBytes(storageUsed)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {AVAILABLE_REGIONS.map(region => {
                const downloaded = isDownloaded(region.id);
                const downloadState = getDownloadState(region.id);
                const isDownloading = downloadState?.isDownloading || false;

                return (
                  <div
                    key={region.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all bg-white shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        downloaded ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {downloaded ? <Check size={24} /> : <MapPin size={24} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-800">{region.displayName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Boyut: {offlineMapManager.formatBytes(region.size)} • Zoom: {region.zoomRange.min}-{region.zoomRange.max}
                        </p>

                        {/* Progress Bar */}
                        {isDownloading && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full transition-all duration-300"
                                style={{ width: `${downloadState?.progress || 0}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              İndiriliyor... {Math.round(downloadState?.progress || 0)}%
                              {downloadState?.loaded && downloadState?.total && (
                                <span className="ml-2">
                                  ({offlineMapManager.formatBytes(downloadState.loaded)} / {offlineMapManager.formatBytes(downloadState.total)})
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Error */}
                        {downloadState?.error && (
                          <p className="text-xs text-red-500 mt-2">
                            ❌ {downloadState.error}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {downloaded ? (
                          <button
                            onClick={() => handleDelete(region.id)}
                            className="p-3 min-w-[48px] min-h-[48px] bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center"
                            title="Sil"
                          >
                            <Trash2 size={20} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDownload(region)}
                            disabled={isDownloading}
                            className={`p-3 min-w-[48px] min-h-[48px] rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                              isDownloading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                            }`}
                            title="İndir"
                          >
                            <Download size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-blue-800">
            💡 <strong>Not:</strong> İndirilen haritalar cihazınızda saklanır ve internet bağlantısı olmadan kullanılabilir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineMapDownloader;
