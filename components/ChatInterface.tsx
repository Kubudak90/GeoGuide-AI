
import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { Send, MapPin, Sparkles, Navigation2, Heart, Sun, Moon, Mic, MicOff, Loader2 } from 'lucide-react';
import { Message, ModelType, Coordinates, MapChunk, PlaceDetails, Place } from '../types';
import ChatMessage from './ChatMessage';
import { sendMessageToGemini } from '../services/geminiService';
import MapView from './MapView';
import { RouteData } from '../services/mapService';
import PlaceChip from './PlaceChip';
import FilterBar from './FilterBar';
import SearchHistory from './SearchHistory';
import RouteInfoPanel, { TransportMode } from './RouteInfoPanel';
import { PlaceChipSkeleton } from './Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../i18n';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

// Lazy load modal components for smaller initial bundle
const PlaceDetailModal = lazy(() => import('./PlaceDetailModal'));
const FavoritesList = lazy(() => import('./FavoritesList'));

interface ChatInterfaceProps {
  onMapChunksUpdate: (chunks: MapChunk[]) => void;
  userLocation?: Coordinates;
  locationError?: string | null;
  selectedPlace: PlaceDetails | null;
  onNavigate: () => void;
  mapChunks: MapChunk[];
  routeData: RouteData | null;
  isRouteLoading?: boolean;
  onSelectPlace: (place: PlaceDetails | null) => void;
  favorites: PlaceDetails[];
  onToggleFavorite: (place: PlaceDetails) => void;
  isFavorite: (place: PlaceDetails) => boolean;
  transportMode: TransportMode;
  onModeChange: (mode: TransportMode) => void;
  onCancelRoute: () => void;
}

const MAX_TEXTAREA_HEIGHT = 128;

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onMapChunksUpdate,
  userLocation,
  locationError,
  selectedPlace,
  onNavigate,
  mapChunks,
  routeData,
  isRouteLoading,
  onSelectPlace,
  favorites,
  onToggleFavorite,
  isFavorite,
  transportMode,
  onModeChange,
  onCancelRoute,
}) => {
  const { t, locale, setLocale } = useTranslation();
  const { toggleTheme, isDark } = useTheme();
  const { history: searchHistoryItems, addSearch, clearHistory, removeItem } = useSearchHistory();
  const speechLang = locale === 'tr' ? 'tr-TR' : 'en-US';
  const { isListening, transcript, isSupported: voiceSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition(speechLang);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: t('welcome_message'),
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState<ModelType>(ModelType.MAPS_SEARCH);
  const [selectedChipPlace, setSelectedChipPlace] = useState<Place | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchHistoryRef = useRef<HTMLDivElement>(null);

  // Refs for stable callback access (avoid stale closures)
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const modelTypeRef = useRef(modelType);
  modelTypeRef.current = modelType;
  const activeFilterRef = useRef(activeFilter);
  activeFilterRef.current = activeFilter;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice transcript -> input
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Auto-send after voice recognition ends with final transcript
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      handleSendMessage(transcript.trim());
      resetTranscript();
    }
  }, [isListening]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedChipPlace) setSelectedChipPlace(null);
        else if (showFavorites) setShowFavorites(false);
        setShowSearchHistory(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedChipPlace, showFavorites, toggleTheme]);

  // Stable send message - reads latest state from refs to avoid recreating on every message
  const handleSendMessage = useCallback(async (overrideText?: string) => {
    const userText = (overrideText || inputValueRef.current).trim();
    if (!userText || isLoadingRef.current) return;

    setInputValue('');
    setShowSearchHistory(false);
    addSearch(userText);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);

    if (userText.toLowerCase() === 'git' || userText.toLowerCase() === 'go') {
      if (selectedPlace) {
        onNavigate();
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `${t('navigating_to')} ${selectedPlace.name}...`,
          timestamp: Date.now()
        }]);
        return;
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: t('select_place_first'),
          timestamp: Date.now()
        }]);
        return;
      }
    }

    setIsLoading(true);

    const loadingMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isLoading: true
    }]);

    try {
      const currentMessages = messagesRef.current;
      const response = await sendMessageToGemini(
        currentMessages, userText, modelTypeRef.current,
        userLocation, selectedPlace, activeFilterRef.current
      );

      if (response.groundingMetadata?.mapChunks && response.groundingMetadata.mapChunks.length > 0) {
        onMapChunksUpdate(response.groundingMetadata.mapChunks);
      }

      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessageId
          ? {
            ...msg,
            text: response.text,
            groundingMetadata: response.groundingMetadata,
            places: response.places,
            isLoading: false
          }
          : msg
      ));

    } catch {
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessageId
          ? { ...msg, text: t('error_response'), isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlace, userLocation, onMapChunksUpdate, onNavigate, addSearch, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  };

  const handlePlaceClick = useCallback((place: Place) => {
    setSelectedChipPlace(place);
  }, []);

  const handleNavigateToPlace = useCallback((place: Place) => {
    setSelectedChipPlace(null);
    const placeDetails: PlaceDetails = {
      id: `place-${Date.now()}`,
      name: place.name,
      formatted_address: '',
      geometry: { location: place.coordinates },
      website: place.website || undefined
    };
    onSelectPlace(placeDetails);
  }, [onSelectPlace]);

  // Better blur handling: check if click target is inside search history
  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (searchHistoryRef.current?.contains(relatedTarget)) return;
    setTimeout(() => setShowSearchHistory(false), 150);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden">

      {/* Map Area */}
      <div className="flex-shrink-0 h-[40dvh] w-full md:h-full md:flex-1 md:order-2 relative bg-gray-200 dark:bg-gray-900">
        <MapView
          mapChunks={mapChunks}
          userLocation={userLocation}
          selectedPlace={selectedPlace}
          onSelectPlace={onSelectPlace}
          routeData={routeData}
          onNavigate={onNavigate}
        />
        {routeData && (
          <RouteInfoPanel
            distance={routeData.distance}
            duration={routeData.duration}
            mode={transportMode}
            onModeChange={onModeChange}
            onCancel={onCancelRoute}
            isLoading={isRouteLoading}
          />
        )}
      </div>

      {/* Chat Sidebar */}
      <div className="flex-shrink-0 h-[60dvh] w-full md:h-full md:w-[400px] md:min-w-[320px] md:max-w-[400px] md:order-1 flex flex-col bg-white dark:bg-gray-900 shadow-xl z-10 overflow-hidden">

        {/* Header */}
        <div className="flex-none bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-emerald-200 shadow-sm">
              <MapPin size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{t('app_name')}</h1>
              <div className="flex items-center gap-1">
                {userLocation ? (
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center">
                    <Navigation2 size={10} className="mr-1" /> {t('gps_active')}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    {locationError ? (
                      <><Navigation2 size={10} /> {t('gps_error')}</>
                    ) : (
                      <><Loader2 size={10} className="animate-spin" /> {t('locating')}</>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-bold min-w-[36px] min-h-[36px]"
              title={locale === 'en' ? 'Türkçe' : 'English'}
            >
              {locale === 'en' ? 'TR' : 'EN'}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-w-[36px] min-h-[36px]"
              title={isDark ? t('light_mode') : t('dark_mode')}
              aria-label={isDark ? t('light_mode') : t('dark_mode')}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setShowFavorites(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors min-w-[36px] min-h-[36px]"
              title={t('favorites')}
              aria-label={t('favorites')}
            >
              <Heart size={18} className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
            </button>

            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => setModelType(ModelType.MAPS_SEARCH)}
                className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] flex items-center justify-center ${modelType === ModelType.MAPS_SEARCH ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600' : 'text-gray-400'}`}
                title={t('maps_search')}
                aria-label={t('maps_search')}
              >
                <MapPin size={16} />
              </button>
              <button
                onClick={() => setModelType(ModelType.REASONING)}
                className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] flex items-center justify-center ${modelType === ModelType.REASONING ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600' : 'text-gray-400'}`}
                title={t('reasoning')}
                aria-label={t('reasoning')}
              >
                <Sparkles size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide bg-slate-50/50 dark:bg-gray-950" role="log" aria-live="polite">
          {messages.map(msg => (
            <div key={msg.id} className="flex flex-col gap-2 mb-4">
              <ChatMessage message={msg} />

              {msg.isLoading && (
                <div className="flex flex-col gap-2 ml-12 mr-4">
                  <PlaceChipSkeleton />
                  <PlaceChipSkeleton />
                </div>
              )}

              {msg.places && msg.places.length > 0 && (
                <div className="flex flex-col gap-2 ml-12 mr-4 animate-in slide-in-from-left-2 duration-300 overflow-hidden">
                  {msg.places.map((place) => (
                    <PlaceChip
                      key={`${place.name}-${place.coordinates.lat}-${place.coordinates.lng}`}
                      place={place}
                      onClick={handlePlaceClick}
                      userLocation={userLocation}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 relative">
          <div ref={searchHistoryRef}>
            <SearchHistory
              history={searchHistoryItems}
              onSelect={(query) => {
                setInputValue(query);
                setShowSearchHistory(false);
                handleSendMessage(query);
              }}
              onRemove={removeItem}
              onClear={clearHistory}
              visible={showSearchHistory}
            />
          </div>

          <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-sm">
            {voiceSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse-ring'
                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                }`}
                title={t('voice_search')}
                aria-label={isListening ? t('listening') : t('voice_search')}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSearchHistory(true)}
              onBlur={handleInputBlur}
              placeholder={isListening ? t('listening') : t('type_message')}
              className="w-full bg-transparent border-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 focus:outline-none resize-none py-2.5 px-2 text-base md:text-sm"
              rows={1}
              style={{ minHeight: '44px', maxHeight: `${MAX_TEXTAREA_HEIGHT}px` }}
              aria-label={t('type_message')}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${inputValue.trim() && !isLoading
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              aria-label={t('send_message')}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Place Detail Modal - lazy loaded */}
      {selectedChipPlace && (
        <Suspense fallback={null}>
          <PlaceDetailModal
            place={selectedChipPlace}
            onClose={() => setSelectedChipPlace(null)}
            onNavigate={handleNavigateToPlace}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
          />
        </Suspense>
      )}

      {/* Favorites List Modal - lazy loaded */}
      {showFavorites && (
        <Suspense fallback={null}>
          <FavoritesList
            favorites={favorites}
            onClose={() => setShowFavorites(false)}
            onSelect={(place) => {
              setShowFavorites(false);
              const placeForNav: Place = {
                name: place.name,
                coordinates: place.geometry.location,
                short_description: place.short_description || '',
                category: place.category || t('saved_place'),
                website: place.website || null
              };
              handleNavigateToPlace(placeForNav);
            }}
            onRemove={(place) => onToggleFavorite(place)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ChatInterface;
