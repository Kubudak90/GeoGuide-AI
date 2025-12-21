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
