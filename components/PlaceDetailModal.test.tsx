import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../src/test/testUtils';
import PlaceDetailModal from './PlaceDetailModal';
import { Place } from '../types';

describe('PlaceDetailModal', () => {
  const mockPlace: Place = {
    name: 'Galata Tower',
    coordinates: { lat: 41.0256, lng: 28.9744 },
    short_description: 'A medieval stone tower offering panoramic views of Istanbul.',
    category: 'Historical Landmark',
    website: 'https://galatatower.com',
  };

  const mockOnClose = vi.fn();
  const mockOnNavigate = vi.fn();
  const mockOnToggleFavorite = vi.fn();
  const mockIsFavorite = vi.fn(() => false);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render place name', () => {
      render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      expect(screen.getByText('Galata Tower')).toBeInTheDocument();
    });

    it('should render place category', () => {
      render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      expect(screen.getByText('Historical Landmark')).toBeInTheDocument();
    });

    it('should render place description', () => {
      render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      expect(
        screen.getByText('A medieval stone tower offering panoramic views of Istanbul.')
      ).toBeInTheDocument();
    });

    it('should render close button', () => {
      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const closeButtons = container.querySelectorAll('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onNavigate with place when Go There button is clicked', () => {
      render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const goButton = screen.getByText('Go There');
      fireEvent.click(goButton);

      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
      expect(mockOnNavigate).toHaveBeenCalledWith(mockPlace);
    });

    it('should call onToggleFavorite when heart button is clicked', () => {
      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      // Find the heart button (last button in the actions row)
      const buttons = container.querySelectorAll('button');
      const heartButton = buttons[buttons.length - 1];
      fireEvent.click(heartButton);

      expect(mockOnToggleFavorite).toHaveBeenCalledTimes(1);
    });
  });

  describe('Website Link', () => {
    it('should display website button when website is available', () => {
      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const websiteLink = container.querySelector('a[href="https://galatatower.com"]');
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink).toHaveAttribute('target', '_blank');
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not display website button when website is null', () => {
      const placeWithoutWebsite = { ...mockPlace, website: null };

      const { container } = render(
        <PlaceDetailModal
          place={placeWithoutWebsite}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const links = container.querySelectorAll('a');
      expect(links.length).toBe(0);
    });
  });

  describe('Favorite State', () => {
    it('should show unfilled heart when not favorite', () => {
      mockIsFavorite.mockReturnValue(false);

      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const buttons = container.querySelectorAll('button');
      const heartButton = buttons[buttons.length - 1];
      expect(heartButton.className).toContain('bg-gray-100');
    });

    it('should show filled heart when favorite', () => {
      mockIsFavorite.mockReturnValue(true);

      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const buttons = container.querySelectorAll('button');
      const heartButton = buttons[buttons.length - 1];
      expect(heartButton.className).toContain('bg-red-50');
    });

    it('should call isFavorite to check favorite status', () => {
      render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      expect(mockIsFavorite).toHaveBeenCalled();
    });
  });

  describe('Modal Styling', () => {
    it('should have backdrop blur overlay', () => {
      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const overlay = container.querySelector('.backdrop-blur-sm');
      expect(overlay).toBeInTheDocument();
    });

    it('should have animation classes', () => {
      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const animatedElement = container.querySelector('.animate-in');
      expect(animatedElement).toBeInTheDocument();
    });
  });

  describe('Different Place Data', () => {
    it('should handle place without website', () => {
      const placeNoWebsite: Place = {
        name: 'Local Park',
        coordinates: { lat: 40.7128, lng: -74.006 },
        short_description: 'A nice park in the neighborhood.',
        category: 'Park',
        website: null,
      };

      render(
        <PlaceDetailModal
          place={placeNoWebsite}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      expect(screen.getByText('Local Park')).toBeInTheDocument();
      expect(screen.getByText('Park')).toBeInTheDocument();
    });

    it('should handle long descriptions', () => {
      const placeWithLongDesc: Place = {
        name: 'Museum',
        coordinates: { lat: 40.7128, lng: -74.006 },
        short_description:
          'This is a very long description that goes into great detail about the amazing features and history of this wonderful museum that has been standing for many years.',
        category: 'Museum',
        website: null,
      };

      render(
        <PlaceDetailModal
          place={placeWithLongDesc}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      mockIsFavorite.mockReturnValue(false);

      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const buttons = container.querySelectorAll('button');
      const heartButton = buttons[buttons.length - 1];
      expect(heartButton).toHaveAttribute('title', 'Add to Favorites');
    });

    it('should update button title when favorite', () => {
      mockIsFavorite.mockReturnValue(true);

      const { container } = render(
        <PlaceDetailModal
          place={mockPlace}
          onClose={mockOnClose}
          onNavigate={mockOnNavigate}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorite={mockIsFavorite}
        />
      );

      const buttons = container.querySelectorAll('button');
      const heartButton = buttons[buttons.length - 1];
      expect(heartButton).toHaveAttribute('title', 'Remove from Favorites');
    });
  });
});
