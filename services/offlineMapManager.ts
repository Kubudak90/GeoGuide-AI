/**
 * Offline Map Manager
 * Handles PMTiles download, storage, and integration with MapLibre GL
 */

import { PMTiles, Protocol, Source } from 'pmtiles';
import { offlineMapDB, OfflineMap } from './offlineMapDB';

export interface MapRegion {
  id: string;
  name: string;
  displayName: string;
  bounds: [number, number, number, number]; // [west, south, east, north]
  center: [number, number];
  size: number; // In bytes
  zoomRange: { min: number; max: number };
  url: string; // URL to download PMTiles file
}

// Available regions for download
// NOTE: These URLs are placeholders - you'll need actual PMTiles files
export const AVAILABLE_REGIONS: MapRegion[] = [
  {
    id: 'istanbul',
    name: 'istanbul',
    displayName: 'İstanbul',
    bounds: [28.5, 40.8, 29.5, 41.3],
    center: [28.9784, 41.0082],
    size: 150 * 1024 * 1024, // 150 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/istanbul.pmtiles' // Replace with actual URL
  },
  {
    id: 'ankara',
    name: 'ankara',
    displayName: 'Ankara',
    bounds: [32.5, 39.7, 33.0, 40.1],
    center: [32.8597, 39.9334],
    size: 80 * 1024 * 1024, // 80 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/ankara.pmtiles'
  },
  {
    id: 'izmir',
    name: 'izmir',
    displayName: 'İzmir',
    bounds: [26.8, 38.3, 27.3, 38.6],
    center: [27.1428, 38.4237],
    size: 100 * 1024 * 1024, // 100 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/izmir.pmtiles'
  },
  {
    id: 'antalya',
    name: 'antalya',
    displayName: 'Antalya',
    bounds: [30.5, 36.7, 31.0, 37.1],
    center: [30.7133, 36.8969],
    size: 90 * 1024 * 1024, // 90 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/antalya.pmtiles'
  },
  {
    id: 'bursa',
    name: 'bursa',
    displayName: 'Bursa',
    bounds: [28.9, 40.1, 29.3, 40.3],
    center: [29.0636, 40.1826],
    size: 70 * 1024 * 1024, // 70 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/bursa.pmtiles'
  },
  {
    id: 'adana',
    name: 'adana',
    displayName: 'Adana',
    bounds: [35.2, 36.9, 35.5, 37.1],
    center: [35.3213, 37.0000],
    size: 65 * 1024 * 1024, // 65 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/adana.pmtiles'
  },
  {
    id: 'konya',
    name: 'konya',
    displayName: 'Konya',
    bounds: [32.3, 37.7, 32.7, 38.1],
    center: [32.4846, 37.8746],
    size: 60 * 1024 * 1024, // 60 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/konya.pmtiles'
  },
  {
    id: 'gaziantep',
    name: 'gaziantep',
    displayName: 'Gaziantep',
    bounds: [37.2, 36.9, 37.5, 37.2],
    center: [37.3825, 37.0662],
    size: 55 * 1024 * 1024, // 55 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/gaziantep.pmtiles'
  },
  {
    id: 'kayseri',
    name: 'kayseri',
    displayName: 'Kayseri',
    bounds: [35.3, 38.6, 35.6, 38.8],
    center: [35.4826, 38.7205],
    size: 50 * 1024 * 1024, // 50 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/kayseri.pmtiles'
  },
  {
    id: 'trabzon',
    name: 'trabzon',
    displayName: 'Trabzon',
    bounds: [39.5, 40.9, 39.9, 41.1],
    center: [39.7168, 41.0015],
    size: 45 * 1024 * 1024, // 45 MB
    zoomRange: { min: 0, max: 14 },
    url: 'https://example.com/maps/trabzon.pmtiles'
  }
];

export type DownloadProgressCallback = (progress: number, loaded: number, total: number) => void;

class OfflineMapManager {
  private pmtilesCache: Map<string, PMTiles> = new Map();
  private protocol: Protocol | null = null;

  /**
   * Initialize PMTiles protocol for MapLibre GL
   */
  initProtocol(): void {
    if (this.protocol) return;

    this.protocol = new Protocol();

    // Add protocol handler for pmtiles://
    // This will be used by MapLibre GL to fetch tiles from PMTiles files
  }

  /**
   * Download a map region
   */
  async downloadRegion(
    regionId: string,
    onProgress?: DownloadProgressCallback
  ): Promise<void> {
    const region = AVAILABLE_REGIONS.find(r => r.id === regionId);
    if (!region) {
      throw new Error(`Region ${regionId} not found`);
    }

    // Check if already downloaded
    const exists = await offlineMapDB.hasMap(regionId);
    if (exists) {
      throw new Error(`Region ${regionId} is already downloaded`);
    }

    // Download PMTiles file
    const response = await fetch(region.url);
    if (!response.ok) {
      throw new Error(`Failed to download map: ${response.statusText}`);
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0');
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    // Download with progress tracking
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (onProgress) {
        const progress = contentLength > 0 ? (loaded / contentLength) * 100 : 0;
        onProgress(progress, loaded, contentLength);
      }
    }

    // Combine chunks into blob
    const blob = new Blob(chunks, { type: 'application/octet-stream' });

    // Save to IndexedDB
    const offlineMap: OfflineMap = {
      id: regionId,
      name: region.name,
      region: region.displayName,
      size: blob.size,
      downloadedAt: Date.now(),
      data: blob,
      zoomRange: region.zoomRange
    };

    await offlineMapDB.saveMap(offlineMap);
  }

  /**
   * Load a PMTiles instance from IndexedDB
   */
  async loadPMTiles(regionId: string): Promise<PMTiles | null> {
    // Check cache first
    if (this.pmtilesCache.has(regionId)) {
      return this.pmtilesCache.get(regionId)!;
    }

    // Load from IndexedDB
    const map = await offlineMapDB.getMap(regionId);
    if (!map) return null;

    // Create PMTiles instance from blob
    const arrayBuffer = await map.data.arrayBuffer();

    // Create a custom source that reads from the ArrayBuffer
    const source: Source = {
      getKey: () => regionId,
      getBytes: async (offset: number, length: number) => {
        const end = offset + length;
        const slice = arrayBuffer.slice(offset, end);
        return {
          data: new Uint8Array(slice),
          etag: undefined,
          cacheControl: undefined,
          expires: undefined
        };
      }
    };

    const pmtiles = new PMTiles(source);

    // Cache it
    this.pmtilesCache.set(regionId, pmtiles);

    return pmtiles;
  }

  /**
   * Get all downloaded maps
   */
  async getDownloadedMaps(): Promise<OfflineMap[]> {
    return await offlineMapDB.getAllMaps();
  }

  /**
   * Delete a downloaded map
   */
  async deleteMap(regionId: string): Promise<void> {
    await offlineMapDB.deleteMap(regionId);
    this.pmtilesCache.delete(regionId);
  }

  /**
   * Check if a region is downloaded
   */
  async isRegionDownloaded(regionId: string): Promise<boolean> {
    return await offlineMapDB.hasMap(regionId);
  }

  /**
   * Get total storage used by offline maps
   */
  async getStorageUsed(): Promise<number> {
    return await offlineMapDB.getStorageUsed();
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get URL for using PMTiles with MapLibre
   */
  getPMTilesUrl(regionId: string): string {
    return `pmtiles://${regionId}`;
  }

  /**
   * Clear all downloaded maps
   */
  async clearAll(): Promise<void> {
    await offlineMapDB.clearAllMaps();
    this.pmtilesCache.clear();
  }
}

// Singleton instance
export const offlineMapManager = new OfflineMapManager();
