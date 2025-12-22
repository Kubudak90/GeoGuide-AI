import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../src/test/testUtils';
import FavoritesList from './FavoritesList';
import { PlaceDetails } from '../types';

describe('FavoritesList', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();
  const mockOnRemove = vi.fn();

  const mockFavorites: PlaceDetails[] = [
    {
      id: '1',
      name: 'Test Restaurant',
      formatted_address: '123 Main St',
      geometry: { location: { lat: 40.7128, lng: -74.006 } },
      category: 'Restaurant',
    } as any,
    {
      id: '2',
      name: 'Art Museum',
      formatted_address: '456 Museum Ave',
      geometry: { location: { lat: 40.7306, lng: -73.9352 } },
      category: 'Museum',
    } as any,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal title', () => {
      render(
        <FavoritesList
          favorites={[]}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('My Favorites')).toBeInTheDocument();
    });

    it('should render close button', () => {
      const { container } = render(
        <FavoritesList
          favorites={[]}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should show empty state when no favorites', () => {
      render(
        <FavoritesList
          favorites={[]}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('No favorites yet.')).toBeInTheDocument();
      expect(screen.getByText('Start exploring and save places you like!')).toBeInTheDocument();
    });

    it('should render list of favorites', () => {
      render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Art Museum')).toBeInTheDocument();
    });

    it('should render category for each favorite', () => {
      render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Museum')).toBeInTheDocument();
    });

    it('should show default category when not provided', () => {
      const favWithoutCategory: PlaceDetails[] = [
        {
          id: '3',
          name: 'Some Place',
          formatted_address: '789 St',
          geometry: { location: { lat: 40.7128, lng: -74.006 } },
        },
      ];

      render(
        <FavoritesList
          favorites={favWithoutCategory}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Place')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSelect when place name is clicked', () => {
      render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const restaurantDiv = screen.getByText('Test Restaurant').closest('div.cursor-pointer');
      fireEvent.click(restaurantDiv!);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(mockFavorites[0]);
    });

    it('should call onSelect when navigation button is clicked', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      // Find navigation buttons (they have title="View on Map")
      const navButtons = Array.from(container.querySelectorAll('button')).filter((btn) =>
        btn.getAttribute('title') === 'View on Map'
      );

      fireEvent.click(navButtons[0]);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(mockFavorites[0]);
    });

    it('should call onRemove when remove button is clicked', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      // Find remove buttons (they have title="Remove")
      const removeButtons = Array.from(container.querySelectorAll('button')).filter((btn) =>
        btn.getAttribute('title') === 'Remove'
      );

      fireEvent.click(removeButtons[0]);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
      expect(mockOnRemove).toHaveBeenCalledWith(mockFavorites[0]);
    });

    it('should handle multiple favorites interactions', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      // Click on first favorite
      const restaurantDiv = screen.getByText('Test Restaurant').closest('div.cursor-pointer');
      fireEvent.click(restaurantDiv!);

      // Click on second favorite
      const museumDiv = screen.getByText('Art Museum').closest('div.cursor-pointer');
      fireEvent.click(museumDiv!);

      expect(mockOnSelect).toHaveBeenCalledTimes(2);
      expect(mockOnSelect).toHaveBeenCalledWith(mockFavorites[0]);
      expect(mockOnSelect).toHaveBeenCalledWith(mockFavorites[1]);
    });
  });

  describe('Empty State', () => {
    it('should show placeholder icon in empty state', () => {
      const { container } = render(
        <FavoritesList
          favorites={[]}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const icon = container.querySelector('.bg-gray-100.rounded-full');
      expect(icon).toBeInTheDocument();
    });

    it('should show helpful message in empty state', () => {
      render(
        <FavoritesList
          favorites={[]}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('No favorites yet.')).toBeInTheDocument();
    });
  });

  describe('List Rendering', () => {
    it('should render correct number of favorites', () => {
      render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const favorites = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('title') === 'View on Map'
      );
      expect(favorites.length).toBe(2);
    });

    it('should handle single favorite', () => {
      render(
        <FavoritesList
          favorites={[mockFavorites[0]]}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.queryByText('Art Museum')).not.toBeInTheDocument();
    });

    it('should handle many favorites', () => {
      const manyFavorites: PlaceDetails[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        name: `Place ${i}`,
        formatted_address: `Address ${i}`,
        geometry: { location: { lat: 40.7128, lng: -74.006 } },
        category: 'Place',
      })) as any;

      render(
        <FavoritesList
          favorites={manyFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Place 0')).toBeInTheDocument();
      expect(screen.getByText('Place 9')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have modal overlay with blur', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const overlay = container.querySelector('.backdrop-blur-sm');
      expect(overlay).toBeInTheDocument();
    });

    it('should have scrollable content area', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const scrollArea = container.querySelector('.overflow-y-auto');
      expect(scrollArea).toBeInTheDocument();
    });

    it('should have animation classes', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const animated = container.querySelector('.animate-in');
      expect(animated).toBeInTheDocument();
    });

    it('should have hover effects on favorite items', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const favoriteItem = container.querySelector('.hover\\:border-emerald-200');
      expect(favoriteItem).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const viewOnMapButton = container.querySelector('button[title="View on Map"]');
      const removeButton = container.querySelector('button[title="Remove"]');

      expect(viewOnMapButton).toBeInTheDocument();
      expect(removeButton).toBeInTheDocument();
    });

    it('should have distinct action buttons for each favorite', () => {
      const { container } = render(
        <FavoritesList
          favorites={mockFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      const navButtons = container.querySelectorAll('button[title="View on Map"]');
      const removeButtons = container.querySelectorAll('button[title="Remove"]');

      expect(navButtons.length).toBe(2);
      expect(removeButtons.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle favorites with long names', () => {
      const longNameFavorites: PlaceDetails[] = [
        {
          id: '1',
          name: 'This is a very long restaurant name that should be truncated in the UI',
          formatted_address: '123 St',
          geometry: { location: { lat: 40.7128, lng: -74.006 } },
        },
      ];

      render(
        <FavoritesList
          favorites={longNameFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(
        screen.getByText('This is a very long restaurant name that should be truncated in the UI')
      ).toBeInTheDocument();
    });

    it('should handle favorites without formatted_address', () => {
      const noAddressFavorites: PlaceDetails[] = [
        {
          id: '1',
          name: 'Place',
          formatted_address: '',
          geometry: { location: { lat: 40.7128, lng: -74.006 } },
        },
      ];

      render(
        <FavoritesList
          favorites={noAddressFavorites}
          onClose={mockOnClose}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Place')).toBeInTheDocument();
    });
  });
});
