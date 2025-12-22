/**
 * IndexedDB helper for storing offline map files (PMTiles)
 * Provides storage for large map files with support for progress tracking
 */

const DB_NAME = 'GeoGuideOfflineMaps';
const DB_VERSION = 1;
const MAPS_STORE = 'maps';

export interface OfflineMap {
  id: string;
  name: string;
  region: string;
  size: number;
  downloadedAt: number;
  data: Blob;
  zoomRange: { min: number; max: number };
}

class OfflineMapDB {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for maps
        if (!db.objectStoreNames.contains(MAPS_STORE)) {
          const store = db.createObjectStore(MAPS_STORE, { keyPath: 'id' });
          store.createIndex('region', 'region', { unique: false });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save a PMTiles file to IndexedDB
   */
  async saveMap(map: OfflineMap): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MAPS_STORE], 'readwrite');
      const store = transaction.objectStore(MAPS_STORE);
      const request = store.put(map);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a specific map by ID
   */
  async getMap(id: string): Promise<OfflineMap | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MAPS_STORE], 'readonly');
      const store = transaction.objectStore(MAPS_STORE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all downloaded maps
   */
  async getAllMaps(): Promise<OfflineMap[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MAPS_STORE], 'readonly');
      const store = transaction.objectStore(MAPS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a map
   */
  async deleteMap(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MAPS_STORE], 'readwrite');
      const store = transaction.objectStore(MAPS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if a map exists
   */
  async hasMap(id: string): Promise<boolean> {
    const map = await this.getMap(id);
    return map !== null;
  }

  /**
   * Get total storage used
   */
  async getStorageUsed(): Promise<number> {
    const maps = await this.getAllMaps();
    return maps.reduce((total, map) => total + map.size, 0);
  }

  /**
   * Clear all maps
   */
  async clearAllMaps(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MAPS_STORE], 'readwrite');
      const store = transaction.objectStore(MAPS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const offlineMapDB = new OfflineMapDB();
