# Offline Maps - PMTiles Entegrasyonu

GeoGuide AI artık **offline harita desteği** sunuyor! Kullanıcılar şehir haritalarını indirebilir ve internet bağlantısı olmadan kullanabilir.

## 🎯 Özellikler

- ✅ **PMTiles Format**: Tek dosyada tüm harita tiles'ları
- ✅ **IndexedDB Storage**: Tarayıcıda güvenli local storage
- ✅ **Progress Tracking**: İndirme ilerlemesi gösterimi
- ✅ **Offline Detection**: Otomatik offline/online algılama
- ✅ **Storage Management**: İndirilen haritaları görüntüle ve sil
- ✅ **Çoklu Şehir**: İstanbul, Ankara, İzmir ve daha fazlası

## 📦 Kurulum

PMTiles paketi zaten yüklü:
```bash
npm install pmtiles
```

## 🏗️ Mimari

### 1. IndexedDB Storage (`services/offlineMapDB.ts`)
```typescript
// Harita dosyalarını IndexedDB'de saklar
interface OfflineMap {
  id: string;
  name: string;
  region: string;
  size: number;
  downloadedAt: number;
  data: Blob;  // PMTiles dosyası
  zoomRange: { min: number; max: number };
}
```

### 2. Offline Map Manager (`services/offlineMapManager.ts`)
```typescript
// PMTiles download ve yönetimi
class OfflineMapManager {
  async downloadRegion(regionId: string, onProgress?: callback)
  async loadPMTiles(regionId: string): Promise<PMTiles>
  async getDownloadedMaps(): Promise<OfflineMap[]>
  async deleteMap(regionId: string)
}
```

### 3. UI Component (`components/OfflineMapDownloader.tsx`)
- Mevcut haritaları listeler
- İndirme progress bar'ı
- Storage kullanım bilgisi
- İndirme ve silme butonları

## 🚀 Kullanım

### Kullanıcı Perspektifi

1. **Offline Maps Butonuna Tıkla**
   - Chat interface'de Download iconuna bas

2. **Şehir Seç ve İndir**
   - İstediğin şehri seç
   - "İndir" butonuna bas
   - Progress bar'ı takip et

3. **Offline Kullan**
   - İndirilen haritalar otomatik olarak offline modda kullanılır
   - İnternet bağlantısı gerekmez

### Developer Perspektifi

```typescript
// Offline map manager'ı kullan
import { offlineMapManager } from './services/offlineMapManager';

// Harita indir
await offlineMapManager.downloadRegion('istanbul', (progress, loaded, total) => {
  console.log(`Progress: ${progress}%`);
});

// İndirilen haritaları listele
const maps = await offlineMapManager.getDownloadedMaps();

// PMTiles instance yükle
const pmtiles = await offlineMapManager.loadPMTiles('istanbul');

// Harita sil
await offlineMapManager.deleteMap('istanbul');
```

## 📋 PMTiles Dosyası Oluşturma

Şu anda placeholder URL'ler kullanılıyor. Gerçek PMTiles dosyaları oluşturmak için:

### 1. OpenStreetMap Verisi İndir
```bash
# OSM verisi indir (örn: İstanbul)
wget https://download.geofabrik.de/europe/turkey-latest.osm.pbf
```

### 2. MBTiles'a Çevir (Tilemaker ile)
```bash
# Tilemaker kur
apt-get install tilemaker

# OSM -> MBTiles
tilemaker --input turkey-latest.osm.pbf \
          --output istanbul.mbtiles \
          --bbox 28.5,40.8,29.5,41.3  # İstanbul bounds
```

### 3. PMTiles'a Çevir
```bash
# PMTiles CLI kur
npm install -g pmtiles

# MBTiles -> PMTiles
pmtiles convert istanbul.mbtiles istanbul.pmtiles
```

### 4. Dosyayı Host Et
```bash
# CDN veya static server'da host et
# Örnek: CloudFlare R2, AWS S3, veya kendi sunucun

# CORS ayarlarını unutma!
{
  "AllowedOrigins": ["https://yourdomain.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["Range", "If-Range"],
  "ExposeHeaders": ["Content-Length", "Content-Range"]
}
```

### 5. URL'leri Güncelle
`services/offlineMapManager.ts` dosyasında:
```typescript
export const AVAILABLE_REGIONS: MapRegion[] = [
  {
    id: 'istanbul',
    name: 'istanbul',
    displayName: 'İstanbul',
    bounds: [28.5, 40.8, 29.5, 41.3],
    center: [28.9784, 41.0082],
    size: 150 * 1024 * 1024,
    zoomRange: { min: 0, max: 14 },
    url: 'https://your-cdn.com/maps/istanbul.pmtiles'  // ← Burası
  },
  // ... diğer şehirler
];
```

## 🎨 MapLibre Entegrasyonu (Gelecek)

PMTiles'ı MapLibre ile kullanmak için:

```typescript
import { Protocol } from 'pmtiles';
import maplibregl from 'maplibre-gl';

// Protocol'ü kaydet
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

// PMTiles source kullan
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'offline-istanbul': {
        type: 'vector',
        url: 'pmtiles://istanbul',  // Loaded from IndexedDB
        attribution: '© OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#f0f0f0' }
      },
      // ... diğer layers
    ]
  }
});
```

## 📊 Storage Limitleri

| Browser | Limit | Notes |
|---------|-------|-------|
| Chrome | ~6GB | Per domain |
| Firefox | ~2GB | Prompt after 50MB |
| Safari | ~1GB | Prompt after 50MB |
| Edge | ~6GB | Per domain |

**Öneri**: Harita başına 100-200MB tutmak ideal.

## 🔧 Gelecek Geliştirmeler

- [ ] MapView ile PMTiles entegrasyonu
- [ ] Otomatik güncelleme (harita verisi eski ise)
- [ ] Kısmi bölge indirme (sadece görünür alan)
- [ ] Vector tile styling (custom themes)
- [ ] Offline POI search
- [ ] Background download (Service Worker)

## ⚡ Performance İpuçları

1. **Chunk Size**: 256KB chunks kullan (PMTiles default)
2. **Compression**: Gzip ile harita dosyalarını sıkıştır
3. **Zoom Levels**: Zoom 0-14 çoğu kullanım için yeterli
4. **Bounds**: Sadece gerekli alanı kapsayacak bounds belirle

## 🐛 Troubleshooting

### "Failed to download map" hatası
- URL'in doğru olduğundan emin ol
- CORS ayarlarını kontrol et
- Network tab'da HTTP status'u kontrol et

### Storage quota hatası
- Eski haritaları sil
- Browser storage settings'i kontrol et

### PMTiles yüklenmiyor
- IndexedDB'nin etkin olduğundan emin ol
- Browser'ı yeniden başlat
- Cache'i temizle

## 📚 Kaynaklar

- [PMTiles Docs](https://docs.protomaps.com/pmtiles/)
- [MapLibre GL JS](https://maplibre.org/)
- [Tilemaker](https://github.com/systemed/tilemaker)
- [OpenStreetMap Data](https://www.openstreetmap.org/)

## 🎉 Sonuç

Artık GeoGuide AI offline çalışabiliyor! Kullanıcılar:
- ✅ Şehir haritalarını indirebilir
- ✅ Offline kullanabilir
- ✅ Storage'ı yönetebilir

**Not**: Gerçek PMTiles dosyalarını host etmek için yukarıdaki adımları takip edin.
