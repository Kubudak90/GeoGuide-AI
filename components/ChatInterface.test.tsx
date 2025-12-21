import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../src/test/testUtils';
import ChatInterface from './ChatInterface';
import { ModelType } from '../types';
import * as geminiService from '../services/geminiService';

// Mock child components
vi.mock('./ChatMessage', () => ({
  default: ({ message }: any) => (
    <div data-testid={`message-${message.id}`}>{message.text}</div>
  ),
}));

vi.mock('./MapView', () => ({
  default: () => <div data-testid="map-view">Map</div>,
}));

vi.mock('./PlaceChip', () => ({
  default: ({ place, onClick }: any) => (
    <button data-testid={`place-chip-${place.name}`} onClick={() => onClick(place)}>
      {place.name}
    </button>
  ),
}));

vi.mock('./PlaceDetailModal', () => ({
  default: ({ place, onClose, onNavigate }: any) => (
    <div data-testid="place-modal">
      <span>{place.name}</span>
      <button data-testid="close-modal" onClick={onClose}>
        Close
      </button>
      <button data-testid="navigate-modal" onClick={() => onNavigate(place)}>
        Navigate
      </button>
    </div>
  ),
}));

vi.mock('./FavoritesList', () => ({
  default: ({ favorites, onClose, onSelect }: any) => (
    <div data-testid="favorites-modal">
      <button data-testid="close-favorites" onClick={onClose}>
        Close
      </button>
      {favorites.map((fav: any) => (
        <button
          key={fav.name}
          data-testid={`favorite-${fav.name}`}
          onClick={() => onSelect(fav)}
        >
          {fav.name}
        </button>
      ))}
    </div>
  ),
}));

// Mock geminiService
vi.mock('../services/geminiService', () => ({
  sendMessageToGemini: vi.fn(),
}));

describe('ChatInterface', () => {
  const mockProps = {
    onMapChunksUpdate: vi.fn(),
    userLocation: { latitude: 40.7128, longitude: -74.0060 },
    locationError: null,
    selectedPlace: null,
    onNavigate: vi.fn(),
    mapChunks: [],
    routeData: null,
    onSelectPlace: vi.fn(),
    favorites: [],
    onToggleFavorite: vi.fn(),
    isFavorite: vi.fn(() => false),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<ChatInterface {...mockProps} />);
      expect(screen.getByText('GeoGuide AI')).toBeInTheDocument();
    });

    it('should render welcome message on mount', () => {
      render(<ChatInterface {...mockProps} />);
      expect(screen.getByText(/Hello! I'm your GeoGuide/)).toBeInTheDocument();
    });

    it('should render map view', () => {
      render(<ChatInterface {...mockProps} />);
      expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    it('should render input textarea', () => {
      render(<ChatInterface {...mockProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<ChatInterface {...mockProps} />);
      const sendButton = screen.getByRole('button', { name: '' });
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('GPS Status Display', () => {
    it('should show GPS Active when location is available', () => {
      render(<ChatInterface {...mockProps} />);
      expect(screen.getByText('GPS Active')).toBeInTheDocument();
    });

    it('should show Locating when location is not available', () => {
      render(<ChatInterface {...mockProps} userLocation={undefined} />);
      expect(screen.getByText('Locating...')).toBeInTheDocument();
    });

    it('should show GPS Error when there is a location error', () => {
      render(
        <ChatInterface {...mockProps} userLocation={undefined} locationError="Access denied" />
      );
      expect(screen.getByText('GPS Error')).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    it('should update input value when typing', () => {
      render(<ChatInterface {...mockProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(textarea.value).toBe('Hello');
    });

    it('should clear input after sending message', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockResolvedValue({
        text: 'Response',
      });

      render(<ChatInterface {...mockProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should not send empty messages', () => {
      render(<ChatInterface {...mockProps} />);
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.click(sendButton);

      expect(geminiService.sendMessageToGemini).not.toHaveBeenCalled();
    });

    it('should not send messages when loading', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ChatInterface {...mockProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'First message' } });
      fireEvent.click(sendButton);

      fireEvent.change(textarea, { target: { value: 'Second message' } });
      fireEvent.click(sendButton);

      expect(geminiService.sendMessageToGemini).toHaveBeenCalledTimes(1);
    });

    it('should send message on Enter key (without Shift)', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockResolvedValue({
        text: 'Response',
      });

      render(<ChatInterface {...mockProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(geminiService.sendMessageToGemini).toHaveBeenCalled();
      });
    });

    it('should not send message on Shift+Enter', () => {
      render(<ChatInterface {...mockProps} />);
      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(geminiService.sendMessageToGemini).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Commands', () => {
    it('should handle "git" command when place is selected', async () => {
      const selectedPlace = {
        name: 'Test Restaurant',
        formatted_address: '123 Test St',
        geometry: { location: { lat: 40.7128, lng: -74.006 } },
      };

      render(<ChatInterface {...mockProps} selectedPlace={selectedPlace} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'git' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockProps.onNavigate).toHaveBeenCalled();
        expect(screen.getByText(/Navigating to Test Restaurant/)).toBeInTheDocument();
      });
    });

    it('should handle "go" command when place is selected', async () => {
      const selectedPlace = {
        name: 'Test Museum',
        formatted_address: '456 Museum Ave',
        geometry: { location: { lat: 40.7306, lng: -73.9352 } },
      };

      render(<ChatInterface {...mockProps} selectedPlace={selectedPlace} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'go' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockProps.onNavigate).toHaveBeenCalled();
      });
    });

    it('should show error when navigation command used without selected place', async () => {
      render(<ChatInterface {...mockProps} selectedPlace={null} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'git' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a place on the map first.')).toBeInTheDocument();
      });
    });

    it('should be case insensitive for navigation commands', async () => {
      const selectedPlace = {
        name: 'Test Place',
        formatted_address: '789 Test Rd',
        geometry: { location: { lat: 40.7128, lng: -74.006 } },
      };

      render(<ChatInterface {...mockProps} selectedPlace={selectedPlace} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'GIT' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      await waitFor(() => {
        expect(mockProps.onNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Gemini API Integration', () => {
    it('should call sendMessageToGemini with correct parameters', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockResolvedValue({
        text: 'Here are some restaurants',
      });

      render(<ChatInterface {...mockProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'Find restaurants' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(geminiService.sendMessageToGemini).toHaveBeenCalledWith(
          expect.any(Array),
          'Find restaurants',
          ModelType.MAPS_SEARCH,
          mockProps.userLocation,
          null
        );
      });
    });

    it('should display loading state while waiting for response', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ text: 'Response' }), 100))
      );

      render(<ChatInterface {...mockProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      // Loading state should be present
      await waitFor(() => {
        const sendButtonAfter = screen.getByRole('button', { name: '' });
        expect(sendButtonAfter).toBeDisabled();
      });
    });

    it('should display response from Gemini', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockResolvedValue({
        text: 'Here are the best restaurants in your area',
      });

      render(<ChatInterface {...mockProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'Find restaurants' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Here are the best restaurants in your area')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockRejectedValue(
        new Error('API Error')
      );

      render(<ChatInterface {...mockProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(
          screen.getByText("I'm sorry, I encountered an error. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it('should render place chips when places are returned', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockResolvedValue({
        text: 'Here are some places',
        places: [
          {
            name: 'Restaurant A',
            coordinates: { lat: 40.7128, lng: -74.006 },
            short_description: 'Great food',
            category: 'Restaurant',
            website: null,
          },
          {
            name: 'Museum B',
            coordinates: { lat: 40.7306, lng: -73.9352 },
            short_description: 'Historic museum',
            category: 'Museum',
            website: 'https://museum.com',
          },
        ],
      });

      render(<ChatInterface {...mockProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: '' });

      fireEvent.change(textarea, { target: { value: 'Show places' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('place-chip-Restaurant A')).toBeInTheDocument();
        expect(screen.getByTestId('place-chip-Museum B')).toBeInTheDocument();
      });
    });
  });

  describe('Model Type Selection', () => {
    it('should default to MAPS_SEARCH model', () => {
      render(<ChatInterface {...mockProps} />);
      // We can't directly test state, but we can test that the UI reflects it
      expect(screen.getByTitle('Map Mode')).toBeInTheDocument();
    });

    it('should switch to REASONING model when clicked', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockResolvedValue({
        text: 'Response',
      });

      render(<ChatInterface {...mockProps} />);

      const reasoningButton = screen.getByTitle('Reasoning Mode');
      fireEvent.click(reasoningButton);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      await waitFor(() => {
        expect(geminiService.sendMessageToGemini).toHaveBeenCalledWith(
          expect.any(Array),
          'Test',
          ModelType.REASONING,
          expect.any(Object),
          null
        );
      });
    });
  });

  describe('Favorites Integration', () => {
    it('should show favorites button', () => {
      render(<ChatInterface {...mockProps} />);
      const favButton = screen.getByTitle('Favorites');
      expect(favButton).toBeInTheDocument();
    });

    it('should open favorites modal when clicked', async () => {
      render(<ChatInterface {...mockProps} />);

      const favButton = screen.getByTitle('Favorites');
      fireEvent.click(favButton);

      await waitFor(() => {
        expect(screen.getByTestId('favorites-modal')).toBeInTheDocument();
      });
    });

    it('should close favorites modal', async () => {
      render(<ChatInterface {...mockProps} />);

      const favButton = screen.getByTitle('Favorites');
      fireEvent.click(favButton);

      await waitFor(() => {
        expect(screen.getByTestId('favorites-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-favorites');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('favorites-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Place Modal', () => {
    it('should open place modal when chip is clicked', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockResolvedValue({
        text: 'Here are places',
        places: [
          {
            name: 'Test Place',
            coordinates: { lat: 40.7128, lng: -74.006 },
            short_description: 'A place',
            category: 'Restaurant',
            website: null,
          },
        ],
      });

      render(<ChatInterface {...mockProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Show places' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      await waitFor(() => {
        const chip = screen.getByTestId('place-chip-Test Place');
        fireEvent.click(chip);
      });

      await waitFor(() => {
        expect(screen.getByTestId('place-modal')).toBeInTheDocument();
      });
    });

    it('should close place modal when close button clicked', async () => {
      vi.spyOn(geminiService, 'sendMessageToGemini').mockResolvedValue({
        text: 'Places',
        places: [
          {
            name: 'Test Place',
            coordinates: { lat: 40.7128, lng: -74.006 },
            short_description: 'A place',
            category: 'Restaurant',
            website: null,
          },
        ],
      });

      render(<ChatInterface {...mockProps} />);

      const textarea = screen.getByPlaceholderText('Type a message...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('place-chip-Test Place'));
      });

      await waitFor(() => {
        const closeButton = screen.getByTestId('close-modal');
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('place-modal')).not.toBeInTheDocument();
      });
    });
  });
});
