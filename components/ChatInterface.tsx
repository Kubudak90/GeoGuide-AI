
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, MapPin, Sparkles, Navigation2, ChevronLeft, ChevronRight, Menu, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, ModelType, Coordinates, MapChunk, PlaceDetails, Place } from '../types';
import ChatMessage from './ChatMessage';
import { sendMessageToGemini } from '../services/geminiService';
import MapView from './MapView';
import { RouteData } from '../services/mapService';
import PlaceChip from './PlaceChip';
import PlaceDetailModal from './PlaceDetailModal';

import FavoritesList from './FavoritesList';
import OfflineMapDownloader from './OfflineMapDownloader';
import ThemeToggle from './ThemeToggle';
import { Heart } from 'lucide-react';

// Memoized components for better performance
const MemoizedChatMessage = React.memo(ChatMessage);
const MemoizedPlaceChip = React.memo(PlaceChip);
const MemoizedMapView = React.memo(MapView);
const MemoizedPlaceDetailModal = React.memo(PlaceDetailModal);
const MemoizedFavoritesList = React.memo(FavoritesList);
const MemoizedOfflineMapDownloader = React.memo(OfflineMapDownloader);

interface ChatInterfaceProps {
  onMapChunksUpdate: (chunks: MapChunk[]) => void;
  userLocation?: Coordinates;
  locationError?: string | null;
  selectedPlace: PlaceDetails | null;
  onNavigate: () => void;
  // Map Props
  mapChunks: MapChunk[];
  routeData: RouteData | null;
  onSelectPlace: (place: PlaceDetails | null) => void;
  // Favorites Props
  favorites: PlaceDetails[];
  onToggleFavorite: (place: PlaceDetails) => void;
  isFavorite: (place: PlaceDetails) => boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onMapChunksUpdate,
  userLocation,
  locationError,
  selectedPlace,
  onNavigate,
  mapChunks,
  routeData,
  onSelectPlace,
  favorites,
  onToggleFavorite,
  isFavorite
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your GeoGuide. Ask me to find restaurants, sights, or businesses, and I'll show them on the map.",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState<ModelType>(ModelType.MAPS_SEARCH);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedChipPlace, setSelectedChipPlace] = useState<Place | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showOfflineMaps, setShowOfflineMaps] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom (memoized)
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');

    // Reset textarea height
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

    // Handle "git" / "go" command
    if (userText.toLowerCase() === 'git' || userText.toLowerCase() === 'go') {
      if (selectedPlace) {
        onNavigate();
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `Navigating to ${selectedPlace.name}...`,
          timestamp: Date.now()
        }]);
        return;
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "Please select a place on the map first.",
          timestamp: Date.now()
        }]);
        return;
      }
    }

    setIsLoading(true);

    // Add placeholder loading message
    const loadingMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isLoading: true
    }]);

    try {
      const response = await sendMessageToGemini(messages, userText, modelType, userLocation, selectedPlace);

      // If we have map chunks, update the main map (Legacy support)
      if (response.groundingMetadata?.mapChunks && response.groundingMetadata.mapChunks.length > 0) {
        onMapChunksUpdate(response.groundingMetadata.mapChunks);
      }

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessageId
          ? {
            ...msg,
            text: response.text,
            groundingMetadata: response.groundingMetadata,
            places: response.places, // Store structured places
            isLoading: false
          }
          : msg
      ));

    } catch (error) {
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessageId
          ? {
            ...msg,
            text: "I'm sorry, I encountered an error. Please try again.",
            isLoading: false
          }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, modelType, userLocation, selectedPlace, onNavigate, onMapChunksUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleInputResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }, []);

  const handlePlaceClick = useCallback((place: Place) => {
    setSelectedChipPlace(place);
  }, []);

  const handleNavigateToPlace = useCallback((place: Place) => {
    // Close modal
    setSelectedChipPlace(null);

    // Convert Place to PlaceDetails for MapView compatibility
    const placeDetails: PlaceDetails = {
      id: `place-${Date.now()}`, // Generate temp ID
      name: place.name,
      formatted_address: '', // We might not have full address from JSON, but coords are key
      geometry: {
        location: place.coordinates
      },
      website: place.website || undefined
    };

    // Select place on map (triggers flyTo in MapView)
    onSelectPlace(placeDetails);

    // Trigger navigation if needed (optional, or user clicks "Go" again)
    // For now, let's just select it so it shows on map.
    // If we want to start routing immediately:
    // onNavigate(); // This would require selectedPlace to be updated first, which happens via onSelectPlace prop but might be async in App.tsx.
    // Better to let user see it on map first.
  }, [onSelectPlace]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">

      {/* Mobile: Map on Top (40%), Desktop: Map on Right (Flex Grow) */}
      <div className="h-[40vh] w-full md:h-full md:flex-1 md:order-2 relative bg-gray-200">
        <MemoizedMapView
          mapChunks={mapChunks}
          userLocation={userLocation}
          selectedPlace={selectedPlace}
          onSelectPlace={onSelectPlace}
          routeData={routeData}
          onNavigate={onNavigate}
        />
      </div>

      {/* Mobile: Chat on Bottom (60%), Desktop: Chat on Left (Sidebar) */}
      <div className="h-[60vh] w-full md:h-full md:w-[420px] md:order-1 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-10 border-r border-white/20 dark:border-slate-700/50">

        {/* Header - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-none glass border-b border-white/20 px-4 py-4 flex items-center justify-between z-20 relative overflow-hidden"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 gradient-ocean opacity-10"></div>

          <div className="flex items-center gap-3 relative z-10">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 gradient-emerald rounded-xl flex items-center justify-center text-white shadow-lg glow"
            >
              <MapPin size={22} />
            </motion.div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-gray-100 leading-tight text-lg gradient-text">GeoGuide AI</h1>
              <div className="flex items-center gap-1">
                {userLocation ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full"
                  >
                    <Navigation2 size={10} className="animate-pulse" /> GPS Active
                  </motion.span>
                ) : (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                    <Navigation2 size={10} className="animate-spin" /> {locationError ? "GPS Error" : "Locating..."}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 relative z-10">
            <ThemeToggle />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowOfflineMaps(true)}
              className="p-2.5 rounded-xl glass hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              title="Offline Maps"
            >
              <Download size={18} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFavorites(true)}
              className="p-2.5 rounded-xl glass hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all relative"
              title="Favorites"
            >
              <Heart size={18} className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
              {favorites.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                >
                  {favorites.length}
                </motion.span>
              )}
            </motion.button>

            <div className="flex items-center glass rounded-xl p-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setModelType(ModelType.MAPS_SEARCH)}
                className={`p-2 rounded-lg transition-all ${
                  modelType === ModelType.MAPS_SEARCH
                    ? 'bg-white dark:bg-slate-700 shadow-lg text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
                title="Map Mode"
              >
                <MapPin size={16} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setModelType(ModelType.REASONING)}
                className={`p-2 rounded-lg transition-all ${
                  modelType === ModelType.REASONING
                    ? 'bg-white dark:bg-slate-700 shadow-lg text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
                title="Reasoning Mode"
              >
                <Sparkles size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide bg-slate-50/50">
          {messages.map(msg => (
            <div key={msg.id} className="flex flex-col gap-2 mb-4">
              <MemoizedChatMessage message={msg} />

              {/* Render Place Chips if available */}
              {msg.places && msg.places.length > 0 && (
                <div className="flex flex-col gap-2 ml-12 animate-in slide-in-from-left-2 duration-300">
                  {msg.places.map((place, index) => (
                    <MemoizedPlaceChip
                      key={index}
                      place={place}
                      onClick={handlePlaceClick}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Modern Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-none p-4 glass border-t border-white/20 relative overflow-hidden"
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 gradient-emerald opacity-5"></div>

          <div className="relative flex items-end gap-3 glass rounded-2xl p-3 focus-within:ring-2 focus-within:ring-emerald-400/50 focus-within:glow transition-all">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="Ask about places, restaurants, attractions..."
              className="w-full bg-transparent border-none text-gray-800 placeholder-gray-500 focus:ring-0 resize-none max-h-32 py-2 px-2 text-base md:text-sm font-medium"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              whileHover={{ scale: inputValue.trim() && !isLoading ? 1.05 : 1 }}
              whileTap={{ scale: inputValue.trim() && !isLoading ? 0.95 : 1 }}
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all btn-modern ${
                inputValue.trim() && !isLoading
                  ? 'gradient-emerald text-white shadow-lg glow'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <motion.div
                animate={isLoading ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
              >
                <Send size={20} />
              </motion.div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Overlay Background */}
      {isSidebarOpen && (
        <div
          className="md:hidden absolute inset-0 bg-black/20 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Place Detail Modal */}
      {selectedChipPlace && (
        <MemoizedPlaceDetailModal
          place={selectedChipPlace}
          onClose={() => setSelectedChipPlace(null)}
          onNavigate={handleNavigateToPlace}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {/* Favorites List Modal */}
      {showFavorites && (
        <MemoizedFavoritesList
          favorites={favorites}
          onClose={() => setShowFavorites(false)}
          onSelect={(place) => {
            setShowFavorites(false);
            // Convert PlaceDetails to Place for handleNavigateToPlace
            // We need to ensure place has coordinates. PlaceDetails has geometry.location
            const placeForNav: Place = {
              name: place.name,
              coordinates: place.geometry.location,
              short_description: place.short_description || '',
              category: place.category || 'Saved Place',
              website: place.website || null
            };
            handleNavigateToPlace(placeForNav);
          }}
          onRemove={(place: any) => onToggleFavorite(place)}
        />
      )}

      {/* Offline Maps Downloader Modal */}
      {showOfflineMaps && (
        <MemoizedOfflineMapDownloader
          onClose={() => setShowOfflineMaps(false)}
        />
      )}

    </div>
  );
};

export default ChatInterface;

