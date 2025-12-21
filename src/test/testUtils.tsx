import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

/**
 * Custom render function that wraps components with common providers
 * if needed in the future (e.g., context providers, routers)
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

/**
 * Mock place data for testing
 */
export const mockPlace = {
  name: 'Test Restaurant',
  address: '123 Test St, Test City',
  location: { lat: 40.7128, lng: -74.0060 },
  rating: 4.5,
  userRatingsTotal: 100,
  types: ['restaurant', 'food'],
  googleMapsUri: 'https://maps.google.com/test',
  photos: [
    {
      name: 'test-photo',
      authorAttributions: [{ displayName: 'Test Author', uri: 'https://test.com' }],
    },
  ],
  reviews: [
    {
      name: 'test-review',
      relativePublishTimeDescription: '1 month ago',
      rating: 5,
      text: { text: 'Great place!' },
      authorAttribution: {
        displayName: 'Test Reviewer',
        uri: 'https://test.com',
        photoUri: 'https://test.com/photo.jpg',
      },
    },
  ],
};

/**
 * Mock message data for testing
 */
export const mockMessage = {
  text: 'Hello, world!',
  isUser: true,
};

/**
 * Mock route data for testing
 */
export const mockRoute = {
  coordinates: [
    [-74.0060, 40.7128],
    [-73.9352, 40.7306],
  ],
  duration: 1234,
  distance: 5678,
};

/**
 * Helper to create a mock GeolocationPosition
 */
export const createMockPosition = (
  lat: number = 40.7128,
  lng: number = -74.0060
): GeolocationPosition => ({
  coords: {
    latitude: lat,
    longitude: lng,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
});

/**
 * Helper to wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };
