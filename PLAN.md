# GeoGuide-AI Kapsamlı Geliştirme Planı

## Faz 1: Kod Kalitesi & Altyapı Temizliği
> Öncelik: Yüksek | Tahmini dosya sayısı: 8

### 1.1 Console.log Temizliği
- **Dosyalar:** `services/geminiService.ts`, `components/MapView.tsx`, `App.tsx`
- **Değişiklik:** Tüm `console.log` ifadelerini kaldır, sadece gerçek hata durumlarında `console.error` bırak
- **Detay:**
  - `geminiService.ts:11-16` → "Gemini Service Initializing..." ve API key log'larını kaldır
  - `MapView.tsx:53,66` → "Initializing Map..." ve "Map loaded successfully" kaldır
  - Hata logları (`console.error`, `console.warn`) kalabilir ama daha açıklayıcı mesajlarla

### 1.2 TypeScript Strict Mode & Tip Düzeltmeleri
- **Dosyalar:** `tsconfig.json`, `types.ts`, `components/PlaceDetailModal.tsx`, `components/ChatInterface.tsx`, `services/mapService.ts`
- **Değişiklikler:**
  - `tsconfig.json` → `"strict": true` ekle
  - `PlaceDetailModal.tsx:31` → `any` tipini kaldır, `PlaceDetails` tipini genişlet (category, short_description zaten opsiyonel olarak var)
  - `ChatInterface.tsx:359` → `onRemove` callback'indeki `any` tipini düzelt
  - `services/mapService.ts:6` → `geometry: any` → GeoJSON tipi tanımla
  - `MapView.tsx:3,30-31` → `window.maplibregl` için proper typing

### 1.3 Custom Hooks Çıkarma
- **Yeni dosya:** `hooks/useLocation.ts`
  - `App.tsx:38-67` arası geolocation logic'ini extract et
  - Return: `{ location, locationError, isLocating }`
- **Yeni dosya:** `hooks/useFavorites.ts`
  - `App.tsx:14-36` arası favorites logic'ini extract et
  - Return: `{ favorites, toggleFavorite, isFavorite }`
- **Yeni dosya:** `hooks/useChat.ts`
  - `ChatInterface.tsx:44-158` arası chat state ve message handling logic'ini extract et
  - Return: `{ messages, inputValue, isLoading, sendMessage, ... }`

### 1.4 React Context API (Prop Drilling Çözümü)
- **Yeni dosya:** `contexts/AppContext.tsx`
  - Favorites, location, selectedPlace, theme, locale state'lerini tek bir context'te birleştir
  - `App.tsx`'deki 12 prop'luk drilling'i ortadan kaldır
  - Provider: `<AppProvider>` → `App.tsx`'de wrap et
  - Consumer hooks: `useAppContext()` ile her component'ten erişim

### 1.5 Error Boundary
- **Yeni dosya:** `components/ErrorBoundary.tsx`
  - React class component (error boundary hook yok)
  - Map crash'lerini yakala, güzel bir fallback UI göster
  - "Tekrar Dene" butonu ile recovery
  - `App.tsx`'de `<ErrorBoundary>` ile wrap et

### 1.6 Environment Variable Doğrulama
- **Yeni dosya:** `utils/env.ts`
  - Uygulama başlangıcında gerekli env variable'ları kontrol et
  - Eksikse kullanıcıya anlamlı hata mesajı göster (console'da değil, UI'da)
  - `VITE_API_KEY`, `VITE_MAPTILER_KEY` zorunlu; `VITE_TOMTOM_KEY` opsiyonel

---

## Faz 2: Dark Mode
> Öncelik: Yüksek | Tahmini dosya sayısı: 10

### 2.1 Theme Context & Toggle
- **Yeni dosya:** `contexts/ThemeContext.tsx`
  - `theme: 'light' | 'dark'` state
  - `localStorage` ile persist et
  - `prefers-color-scheme` media query'yi dinle (sistem tercihi)
  - `useTheme()` hook'u export et

### 2.2 Tailwind Dark Mode Konfigürasyonu
- **Dosya:** `index.html`
  - Tailwind config'e `darkMode: 'class'` ekle (CDN script config)
  - `<html>` element'ine dinamik `class="dark"` ekle

### 2.3 Component Güncellemeleri (dark: prefix)
Her component'e dark mode class'ları ekle:

- **`index.css`**: Root renk değişkenleri tanımla (CSS custom properties)
- **`ChatInterface.tsx`**:
  - Header: `bg-white dark:bg-gray-900`, `border-gray-100 dark:border-gray-800`
  - Chat area: `bg-slate-50/50 dark:bg-gray-950`
  - Input: `bg-gray-50 dark:bg-gray-800`, `text-gray-800 dark:text-gray-200`
- **`ChatMessage.tsx`**:
  - Model mesajları: `bg-white dark:bg-gray-800`, `text-gray-800 dark:text-gray-200`
  - User mesajları: `bg-blue-600` (aynı kalır)
- **`MapView.tsx`**:
  - MapTiler dark style: `maps/streets-v2-dark/style.json` toggle
  - Kontrol butonları: dark arka plan
- **`PlaceDetailCard.tsx`**: Dark card arka planı
- **`PlaceDetailModal.tsx`**: Dark modal arka planı
- **`FavoritesList.tsx`**: Dark liste arka planı
- **`PlaceChip.tsx`**: Dark chip stili

### 2.4 Dark Mode Toggle Butonu
- **Dosya:** `ChatInterface.tsx` header'a ekle
  - `Sun`/`Moon` icon (lucide-react'ten)
  - Header'daki favorites ve model toggle'ın yanına

---

## Faz 3: Toast Bildirim Sistemi
> Öncelik: Orta | Tahmini dosya sayısı: 3

### 3.1 Toast Component
- **Yeni dosya:** `components/Toast.tsx`
  - Türler: `success`, `error`, `info`, `warning`
  - Auto-dismiss (3 saniye)
  - Animasyonlu giriş/çıkış (slide-in-from-top, fade-out)
  - Stack desteği (birden fazla toast)
  - Pozisyon: Sağ üst köşe

### 3.2 Toast Context
- **Yeni dosya:** `contexts/ToastContext.tsx`
  - `useToast()` hook: `{ showToast(message, type) }`
  - Provider: `<ToastProvider>` → App.tsx

### 3.3 Mevcut alert() Çağrılarını Değiştir
- **`App.tsx:72`**: `alert("Please enable location...")` → `showToast("...", "warning")`
- **`App.tsx:83`**: `alert("Could not find a route.")` → `showToast("...", "error")`
- Favorilere ekleme/çıkarma → `showToast("Added to favorites!", "success")`
- Navigasyon başlatma → `showToast("Route calculated!", "info")`

---

## Faz 4: Arama Geçmişi
> Öncelik: Orta | Tahmini dosya sayısı: 3

### 4.1 Search History Hook
- **Yeni dosya:** `hooks/useSearchHistory.ts`
  - `localStorage` key: `'search_history'`
  - Max 20 arama kaydı
  - `{ history, addSearch, clearHistory, removeItem }`
  - Duplikat aramalar eklenmez, sadece sırası güncellenir

### 4.2 Search History UI
- **Yeni dosya:** `components/SearchHistory.tsx`
  - Input'a focus olunca dropdown olarak göster
  - Her item: arama metni + tarih + silme butonu
  - Tıklanınca arama tekrarlanır
  - "Geçmişi Temizle" butonu
  - Animasyonlu açılma/kapanma

### 4.3 ChatInterface Entegrasyonu
- **Dosya:** `ChatInterface.tsx`
  - Input focus → history dropdown göster
  - Mesaj gönderilince → `addSearch(text)` çağır
  - History item seçilince → input'a yaz ve gönder

---

## Faz 5: Çoklu Dil Desteği (i18n)
> Öncelik: Orta | Tahmini dosya sayısı: 6

### 5.1 i18n Altyapısı
- **Yeni dosya:** `i18n/index.ts`
  - Lightweight custom i18n (3. parti kütüphane eklemeden)
  - `useTranslation()` hook
  - Desteklenen diller: `tr`, `en`
  - `localStorage` ile dil tercihi persist

### 5.2 Çeviri Dosyaları
- **Yeni dosya:** `i18n/locales/en.ts`
- **Yeni dosya:** `i18n/locales/tr.ts`
- İçerik:
  ```
  welcome_message, gps_active, gps_error, locating,
  type_message, favorites, no_favorites, remove,
  go_there, website, open_now, closed, loading_map,
  map_unavailable, navigate, search_history, clear_history,
  dark_mode, light_mode, maps_search, reasoning,
  enable_location, route_not_found, ...
  ```

### 5.3 Dil Seçici UI
- **Dosya:** `ChatInterface.tsx` header'a ekle
  - Küçük dropdown: 🇹🇷 TR / 🇺🇸 EN
  - Veya toggle butonu

### 5.4 Tüm Hardcoded String'leri Değiştir
- Tüm component'lerdeki İngilizce string'leri `t('key')` ile değiştir
- Gemini system instruction'ı seçilen dile göre ayarla

---

## Faz 6: Gelişmiş Navigasyon & Rota
> Öncelik: Orta | Tahmini dosya sayısı: 4

### 6.1 Ulaşım Modu Seçimi
- **Dosya:** `services/mapService.ts`
  - OSRM profilleri: `driving`, `walking`, `cycling`
  - `getDirections(start, end, mode)` → mode parametresi ekle
  - Her mod için farklı endpoint

### 6.2 Rota Bilgi Paneli
- **Yeni dosya:** `components/RouteInfoPanel.tsx`
  - Süre (dakika/saat), mesafe (km), ulaşım modu ikonu
  - Haritanın altında veya üstünde floating panel
  - "İptal" butonu → rotayı temizle
  - Ulaşım modu seçici: 🚗 🚶 🚴

### 6.3 Rota Alternatifleri
- **Dosya:** `services/mapService.ts`
  - OSRM `alternatives=true` parametresi
  - Birden fazla rota döndür
- **Dosya:** `MapView.tsx`
  - Ana rota: mavi kalın çizgi
  - Alternatifler: gri ince çizgi
  - Tıkla → aktif rota yap

### 6.4 Mesafe Gösterimi
- **Dosya:** `PlaceChip.tsx` ve `PlaceDetailCard.tsx`
  - Kullanıcı konumundan mekan mesafesini hesapla (Haversine formülü)
  - "2.3 km uzaklıkta" şeklinde göster

---

## Faz 7: Mekan Filtreleme & Gelişmiş Arama
> Öncelik: Orta | Tahmini dosya sayısı: 3

### 7.1 Filtre UI
- **Yeni dosya:** `components/FilterBar.tsx`
  - Chat mesaj alanının üstünde, yatay scroll edilebilir
  - Chip-style filtreler: Restoran, Müze, Park, Kafe, Otel, Alışveriş
  - Seçilince Gemini'ye otomatik filtre eklenir
  - Aktif filtre: yeşil arka plan

### 7.2 Puan & Fiyat Filtresi
- **Dosya:** `components/FilterBar.tsx`
  - Min puan: ⭐ 3+, 4+, 4.5+
  - Fiyat aralığı: $, $$, $$$, $$$$
  - Filtreleme client-side (places array üzerinde)

### 7.3 Gemini Prompt Entegrasyonu
- **Dosya:** `services/geminiService.ts`
  - Aktif filtreler system instruction'a eklenir
  - Örn: "Only recommend restaurants with 4+ stars"

---

## Faz 8: Paylaşım Özelliği
> Öncelik: Düşük | Tahmini dosya sayısı: 2

### 8.1 Share Component
- **Yeni dosya:** `components/ShareButton.tsx`
  - Web Share API (mobilde native share sheet)
  - Fallback: URL'yi clipboard'a kopyala
  - Share data: mekan adı, koordinatlar, açıklama

### 8.2 Entegrasyon
- **Dosya:** `PlaceDetailCard.tsx` ve `PlaceDetailModal.tsx`
  - "Paylaş" butonu ekle (Share2 icon)
  - URL format: `?place=name&lat=x&lng=y`
  - Deep link: Uygulama açılınca URL parametrelerini parse et, ilgili mekana git

---

## Faz 9: Skeleton Loading & UX İyileştirmeleri
> Öncelik: Orta | Tahmini dosya sayısı: 4

### 9.1 Skeleton Components
- **Yeni dosya:** `components/Skeleton.tsx`
  - Genel amaçlı skeleton: `<Skeleton width="100%" height="20px" />`
  - Animasyon: pulse/shimmer efekti

### 9.2 PlaceChip Skeleton
- AI yanıt beklerken PlaceChip alanında 3 adet skeleton chip göster
- `ChatInterface.tsx`'de loading state'ine bağla

### 9.3 Map Loading İyileştirmesi
- **Dosya:** `MapView.tsx`
  - Mevcut spinner yerine güzel bir skeleton map göster
  - Harita üzerinde marker'lar yüklenirken de loading göster

### 9.4 Keyboard Shortcuts
- **Dosya:** `ChatInterface.tsx`
  - `Escape` → Açık modal'ı kapat
  - `Ctrl+K` / `Cmd+K` → Input'a focus
  - `Ctrl+D` / `Cmd+D` → Dark mode toggle
  - Global keyboard event listener

---

## Faz 10: Erişilebilirlik (Accessibility)
> Öncelik: Orta | Tahmini dosya sayısı: 8

### 10.1 ARIA Labels
- Tüm button'lara `aria-label` ekle
- Modal'lara `role="dialog"`, `aria-modal="true"`
- Chat mesajlarına `role="log"`, `aria-live="polite"`
- Haritaya `aria-label="Interactive map"`

### 10.2 Klavye Navigasyonu
- Tab order düzeltmeleri
- Modal açıkken focus trap
- Enter ile buton aktivasyonu
- Focus visible outlines (`:focus-visible`)

### 10.3 Renk Kontrastı
- WCAG AA uyumluluğu kontrol et
- Düşük kontrastlı metin renklerini düzelt
- Dark mode'da da kontrast kontrolü

---

## Faz 11: Performance Optimizasyonları
> Öncelik: Orta | Tahmini dosya sayısı: 6

### 11.1 React.memo ile Gereksiz Render Önleme
- `ChatMessage.tsx` → `React.memo()` ile wrap et
- `PlaceChip.tsx` → `React.memo()` ile wrap et
- `PlaceDetailCard.tsx` → `React.memo()` ile wrap et

### 11.2 useCallback & useMemo
- **`App.tsx`**: `toggleFavorite`, `isFavorite`, `handleNavigate` → `useCallback`
- **`ChatInterface.tsx`**: `handleSendMessage`, `handlePlaceClick` → `useCallback`

### 11.3 Debounce
- **`ChatInterface.tsx`**: Input değişikliğinde resize hesaplaması debounce
- Gemini API çağrılarında rate limiting (min 500ms arası)

### 11.4 Lazy Loading
- **`App.tsx`**:
  - `React.lazy()` ile büyük modal component'leri lazy load et
  - `FavoritesList`, `PlaceDetailModal` → lazy
  - `<Suspense fallback={...}>` ile wrap et

### 11.5 Geocoding Cache
- **Dosya:** `MapView.tsx`
  - MapTiler geocoding sonuçlarını in-memory cache'le
  - Key: query string, Value: geocode result
  - Aynı mekan tekrar arandığında API çağrısı yapma

---

## Faz 12: PWA (Progressive Web App)
> Öncelik: Düşük | Tahmini dosya sayısı: 4

### 12.1 Service Worker
- **Yeni dosya:** `public/sw.js`
  - Cache-first strateji: statik assets (CSS, JS, fonts, images)
  - Network-first: API çağrıları
  - Offline fallback sayfası

### 12.2 Web App Manifest
- **Yeni dosya:** `public/manifest.json`
  - `name: "GeoGuide AI"`, `short_name: "GeoGuide"`
  - `display: "standalone"`, `theme_color: "#059669"`
  - İkonlar: 192x192, 512x512

### 12.3 index.html Güncellemesi
- **Dosya:** `index.html`
  - `<link rel="manifest" href="/manifest.json">`
  - `<meta name="theme-color" content="#059669">`
  - Service worker registration script

### 12.4 Offline Desteği
- Favoriler zaten localStorage'da → offline erişilebilir
- Son görüntülenen harita tile'larını cache'le
- Offline durumda bildirim göster

---

## Faz 13: Sesli Komut
> Öncelik: Düşük | Tahmini dosya sayısı: 3

### 13.1 Speech Recognition Hook
- **Yeni dosya:** `hooks/useSpeechRecognition.ts`
  - Web Speech API (`SpeechRecognition`)
  - Dil desteği: i18n ile senkron (tr-TR, en-US)
  - `{ isListening, transcript, startListening, stopListening, isSupported }`

### 13.2 Mikrofon Butonu
- **Dosya:** `ChatInterface.tsx`
  - Input yanına mikrofon ikonu ekle (Mic icon)
  - Basılı tutma veya toggle ile kayıt
  - Kayıt sırasında kırmızı pulse animasyonu
  - Transcript → input'a yaz → otomatik gönder

### 13.3 Browser Uyumluluk
- Desteklenmeyen tarayıcılarda butonu gizle
- HTTPS gereksinimi bildirimi

---

## Faz 14: Mekan Fotoğraf Galerisi
> Öncelik: Düşük | Tahmini dosya sayısı: 2

### 14.1 Photo Gallery Component
- **Yeni dosya:** `components/PhotoGallery.tsx`
  - Carousel/slider: ok tuşları ile ileri-geri
  - Thumbnail strip altta
  - Fullscreen mode (tıkla → büyüt)
  - Touch swipe desteği (mobil)
  - Lazy image loading

### 14.2 PlaceDetailCard Entegrasyonu
- **Dosya:** `PlaceDetailCard.tsx`
  - Mevcut tek foto yerine galeri component'i kullan
  - `place.photos` array'ini geç
  - Foto yoksa mevcut placeholder kalır

---

## Faz 15: Test Altyapısı
> Öncelik: Orta | Tahmini dosya sayısı: 6

### 15.1 Vitest Kurulumu
- **Dosya:** `package.json` → devDependencies'e ekle:
  - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- **Yeni dosya:** `vitest.config.ts`
  - Environment: jsdom
  - Setup files, coverage config

### 15.2 Unit Test'ler
- **Yeni dosya:** `__tests__/hooks/useLocation.test.ts`
- **Yeni dosya:** `__tests__/hooks/useFavorites.test.ts`
- **Yeni dosya:** `__tests__/services/mapService.test.ts`
- **Yeni dosya:** `__tests__/components/PlaceChip.test.tsx`
- **Yeni dosya:** `__tests__/components/ChatMessage.test.tsx`

### 15.3 package.json Script
- `"test": "vitest"`, `"test:coverage": "vitest --coverage"`

---

## Implementasyon Sırası (Önerilen)

```
Faz 1  → Kod Kalitesi (temel, her şeyden önce)
Faz 2  → Dark Mode (en çok talep edilen)
Faz 3  → Toast Bildirimleri (UX iyileştirmesi)
Faz 9  → Skeleton & Keyboard Shortcuts
Faz 4  → Arama Geçmişi
Faz 11 → Performance Optimizasyonları
Faz 6  → Gelişmiş Navigasyon
Faz 5  → Çoklu Dil (i18n)
Faz 7  → Mekan Filtreleme
Faz 10 → Erişilebilirlik
Faz 8  → Paylaşım
Faz 15 → Test Altyapısı
Faz 12 → PWA
Faz 13 → Sesli Komut
Faz 14 → Fotoğraf Galerisi
```

## Toplam Yeni Dosyalar: ~25
## Değiştirilecek Mevcut Dosyalar: ~12 (neredeyse tümü)
