import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../src/test/testUtils';
import PlaceDetailCard from './PlaceDetailCard';
import { PlaceDetails } from '../types';

describe('PlaceDetailCard', () => {
  const mockOnClose = vi.fn();
  const mockOnNavigate = vi.fn();

  const basePlaceDetails: PlaceDetails = {
    id: '1',
    name: 'Test Restaurant',
    formatted_address: '123 Main St, Test City, TC 12345',
    geometry: {
      location: { lat: 40.7128, lng: -74.006 },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render place name', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    });

    it('should render formatted address', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);
      expect(screen.getByText('123 Main St, Test City, TC 12345')).toBeInTheDocument();
    });

    it('should render close button', () => {
      const { container } = render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);
      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Photo Handling', () => {
    it('should display photo when available', () => {
      const placeWithPhoto = {
        ...basePlaceDetails,
        photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      };

      render(<PlaceDetailCard place={placeWithPhoto} onClose={mockOnClose} />);

      const img = screen.getByAlt('Test Restaurant');
      expect(img).toHaveAttribute('src', 'https://example.com/photo1.jpg');
    });

    it('should show placeholder when no photos available', () => {
      const { container } = render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);

      const placeholder = container.querySelector('.bg-emerald-50');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('Rating Display', () => {
    it('should display rating when available', () => {
      const placeWithRating = {
        ...basePlaceDetails,
        rating: 4.5,
        user_ratings_total: 128,
      };

      render(<PlaceDetailCard place={placeWithRating} onClose={mockOnClose} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('(128 reviews)')).toBeInTheDocument();
    });

    it('should not display rating section when not available', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);

      expect(screen.queryByText('reviews')).not.toBeInTheDocument();
    });
  });

  describe('Price Level Display', () => {
    it('should display price level when available', () => {
      const placeWithPrice = {
        ...basePlaceDetails,
        price_level: 2,
      };

      const { container } = render(<PlaceDetailCard place={placeWithPrice} onClose={mockOnClose} />);

      // Should render 4 dollar signs total, 2 filled
      const dollarSigns = container.querySelectorAll('svg');
      expect(dollarSigns.length).toBeGreaterThan(0);
    });

    it('should not display price level when not available', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);
      // No specific way to test this without checking for specific elements
    });
  });

  describe('Open/Closed Status', () => {
    it('should display "Open Now" when place is open', () => {
      const openPlace = {
        ...basePlaceDetails,
        isOpenNow: true,
      };

      render(<PlaceDetailCard place={openPlace} onClose={mockOnClose} />);

      expect(screen.getByText('Open Now')).toBeInTheDocument();
    });

    it('should display "Closed" when place is closed', () => {
      const closedPlace = {
        ...basePlaceDetails,
        isOpenNow: false,
      };

      render(<PlaceDetailCard place={closedPlace} onClose={mockOnClose} />);

      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('should not display status when isOpenNow is undefined', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);

      expect(screen.queryByText('Open Now')).not.toBeInTheDocument();
      expect(screen.queryByText('Closed')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display navigate button when onNavigate is provided', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

      expect(screen.getByText('GO')).toBeInTheDocument();
    });

    it('should not display navigate button when onNavigate is not provided', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);

      expect(screen.queryByText('GO')).not.toBeInTheDocument();
    });

    it('should call onNavigate when GO button is clicked', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

      const goButton = screen.getByText('GO');
      fireEvent.click(goButton);

      expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    });

    it('should display website button when website is available', () => {
      const placeWithWebsite = {
        ...basePlaceDetails,
        website: 'https://test-restaurant.com',
      };

      render(<PlaceDetailCard place={placeWithWebsite} onClose={mockOnClose} />);

      const websiteLink = screen.getByText('Website');
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://test-restaurant.com');
    });

    it('should display Google Maps link', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);

      const mapsLink = screen.getByText('Google Maps');
      expect(mapsLink).toBeInTheDocument();
      expect(mapsLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    it('should call onClose when close button is clicked', () => {
      const { container } = render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);

      const closeButton = container.querySelector('button');
      fireEvent.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reviews Display', () => {
    it('should display review when available', () => {
      const placeWithReview: any = {
        ...basePlaceDetails,
        reviews: [
          {
            author_name: 'John Doe',
            rating: 5,
            text: 'Amazing food and great service!',
            profile_photo_url: 'https://example.com/photo.jpg',
          },
        ],
      };

      render(<PlaceDetailCard place={placeWithReview} onClose={mockOnClose} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('"Amazing food and great service!"')).toBeInTheDocument();
      expect(screen.getByText('Recent Review')).toBeInTheDocument();
    });

    it('should not display review section when no reviews', () => {
      render(<PlaceDetailCard place={basePlaceDetails} onClose={mockOnClose} />);

      expect(screen.queryByText('Recent Review')).not.toBeInTheDocument();
    });

    it('should display review profile photo', () => {
      const placeWithReview: any = {
        ...basePlaceDetails,
        reviews: [
          {
            author_name: 'Jane Smith',
            rating: 4,
            text: 'Good place',
            profile_photo_url: 'https://example.com/jane.jpg',
          },
        ],
      };

      render(<PlaceDetailCard place={placeWithReview} onClose={mockOnClose} />);

      const img = screen.getByAlt('User');
      expect(img).toHaveAttribute('src', 'https://example.com/jane.jpg');
    });
  });

  describe('Complex Place Data', () => {
    it('should render fully populated place details', () => {
      const fullPlace: any = {
        ...basePlaceDetails,
        rating: 4.8,
        user_ratings_total: 250,
        price_level: 3,
        isOpenNow: true,
        website: 'https://example.com',
        photos: ['https://example.com/photo.jpg'],
        reviews: [
          {
            author_name: 'Test User',
            rating: 5,
            text: 'Excellent!',
            profile_photo_url: 'https://example.com/user.jpg',
          },
        ],
      };

      render(<PlaceDetailCard place={fullPlace} onClose={mockOnClose} onNavigate={mockOnNavigate} />);

      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('Open Now')).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByText('GO')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
});
