import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, Navigation2, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Message, ModelType, Coordinates, MapChunk, PlaceDetails } from '../types';
import ChatMessage from './ChatMessage';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatInterfaceProps {
  onMapChunksUpdate: (chunks: MapChunk[]) => void;
  userLocation?: Coordinates;
  locationError?: string | null;
  selectedPlace: PlaceDetails | null;
  onNavigate: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onMapChunksUpdate,
  userLocation,
  locationError,
  selectedPlace,
  onNavigate
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

      // If we have map chunks, update the main map
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
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <>
      {/* Toggle Button for Mobile/Desktop */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-4 z-40 bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-all duration-300 ${isSidebarOpen ? 'left-[400px] hidden md:block' : 'left-4'}`}
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <div className={`absolute top-0 left-0 h-full w-full md:w-[400px] bg-white/95 backdrop-blur-sm shadow-2xl z-30 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header */}
        <div className="flex-none bg-white/50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
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

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide bg-slate-50/50">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
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
              className="w-full bg-transparent border-none text-gray-800 placeholder-gray-400 focus:ring-0 resize-none max-h-32 py-2.5 px-2 text-sm"
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
    </>
  );
};

export default ChatInterface;
