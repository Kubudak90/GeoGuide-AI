
import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, Navigation2, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Message, ModelType, Coordinates, MapChunk, PlaceDetails, Place } from '../types';
import ChatMessage from './ChatMessage';
import { sendMessageToGemini } from '../services/geminiService';
import MapView from './MapView';
import { RouteData } from '../services/mapService';
import PlaceChip from './PlaceChip';
import PlaceDetailModal from './PlaceDetailModal';

import FavoritesList from './FavoritesList';
import { Heart } from 'lucide-react';

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight} px`;
  };

  const handlePlaceClick = (place: Place) => {
    setSelectedChipPlace(place);
  };

  const handleNavigateToPlace = (place: Place) => {
    // Close modal
    setSelectedChipPlace(null);

    // Convert Place to PlaceDetails for MapView compatibility
    const placeDetails: PlaceDetails = {
      id: `place - ${Date.now()} `, // Generate temp ID
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
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">

      {/* Mobile: Map on Top (40%), Desktop: Map on Right (Flex Grow) */}
      <div className="h-[40vh] w-full md:h-full md:flex-1 md:order-2 relative bg-gray-200">
        <MapView
          mapChunks={mapChunks}
          userLocation={userLocation}
          selectedPlace={selectedPlace}
          onSelectPlace={onSelectPlace}
          routeData={routeData}
          onNavigate={onNavigate}
        />
      </div>

      {/* Mobile: Chat on Bottom (60%), Desktop: Chat on Left (Sidebar) */}
      <div className="h-[60vh] w-full md:h-full md:w-[400px] md:order-1 flex flex-col bg-white shadow-xl z-10">

        {/* Header */}
        <div className="flex-none bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-emerald-200 shadow-sm">
              <MapPin size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 leading-tight">GeoGuide AI</h1>
              <div className="flex items-center gap-1">
                {userLocation ? (
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center">
                    <Navigation2 size={10} className="mr-1" /> GPS Active
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-medium flex items-center">
                    <Navigation2 size={10} className="mr-1" /> {locationError ? "GPS Error" : "Locating..."}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Simple Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavorites(true)}
              className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Favorites"
            >
              <Heart size={18} className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
            </button>

            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setModelType(ModelType.MAPS_SEARCH)}
                className={`p-1.5 rounded-md ${modelType === ModelType.MAPS_SEARCH ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}
                title="Map Mode"
              >
                <MapPin size={16} />
              </button>
              <button
                onClick={() => setModelType(ModelType.REASONING)}
                className={`p-1.5 rounded-md ${modelType === ModelType.REASONING ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400'}`}
                title="Reasoning Mode"
              >
                <Sparkles size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide bg-slate-50/50">
          {messages.map(msg => (
            <div key={msg.id} className="flex flex-col gap-2 mb-4">
              <ChatMessage message={msg} />

              {/* Render Place Chips if available */}
              {msg.places && msg.places.length > 0 && (
                <div className="flex flex-col gap-2 ml-12 animate-in slide-in-from-left-2 duration-300">
                  {msg.places.map((place, index) => (
                    <PlaceChip
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

        {/* Input Area */}
        <div className="flex-none p-4 bg-white border-t border-gray-100">
          <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-sm">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputResize}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none text-gray-800 placeholder-gray-400 focus:ring-0 resize-none max-h-32 py-2.5 px-2 text-base md:text-sm"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${inputValue.trim() && !isLoading
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
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
        <PlaceDetailModal
          place={selectedChipPlace}
          onClose={() => setSelectedChipPlace(null)}
          onNavigate={handleNavigateToPlace}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {/* Favorites List Modal */}
      {showFavorites && (
        <FavoritesList
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

    </div>
  );
};

export default ChatInterface;

