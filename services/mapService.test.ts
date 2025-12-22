import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDirections, RouteData } from './mapService';
import { Coordinates } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('mapService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDirections', () => {
    it('should fetch route successfully and return route data', async () => {
      // Arrange
      const start: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const end: Coordinates = { latitude: 40.7306, longitude: -73.9352 };

      const mockResponse = {
        routes: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-74.0060, 40.7128],
                [-73.9352, 40.7306],
              ],
            },
            duration: 1234.5,
            distance: 5678.9,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await getDirections(start, end);

      // Assert
      expect(result).toBeDefined();
      expect(result?.geometry.type).toBe('LineString');
      expect(result?.duration).toBe(1234.5);
      expect(result?.distance).toBe(5678.9);
    });

    it('should format coordinates correctly in the URL', async () => {
      // Arrange
      const start: Coordinates = { latitude: 41.0256, longitude: 28.9744 };
      const end: Coordinates = { latitude: 41.0082, longitude: 28.9784 };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [] }),
      });

      // Act
      await getDirections(start, end);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('28.9744,41.0256;28.9784,41.0082')
      );
    });

    it('should use correct OSRM API endpoint with proper parameters', async () => {
      // Arrange
      const start: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const end: Coordinates = { latitude: 40.7306, longitude: -73.9352 };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [] }),
      });

      // Act
      await getDirections(start, end);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://router.project-osrm.org/route/v1/driving/-74.006,40.7128;-73.9352,40.7306?overview=full&geometries=geojson'
      );
    });

    it('should return null when response is not ok', async () => {
      // Arrange
      const start: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const end: Coordinates = { latitude: 40.7306, longitude: -73.9352 };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      // Act
      const result = await getDirections(start, end);

      // Assert
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Routing request failed',
        'Internal Server Error'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return null when no routes are found', async () => {
      // Arrange
      const start: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const end: Coordinates = { latitude: 40.7306, longitude: -73.9352 };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ routes: [] }),
      });

      // Act
      const result = await getDirections(start, end);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when routes array is missing', async () => {
      // Arrange
      const start: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const end: Coordinates = { latitude: 40.7306, longitude: -73.9352 };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Act
      const result = await getDirections(start, end);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const start: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const end: Coordinates = { latitude: 40.7306, longitude: -73.9352 };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const networkError = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      // Act
      const result = await getDirections(start, end);

      // Assert
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching directions:',
        networkError
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parse errors', async () => {
      // Arrange
      const start: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const end: Coordinates = { latitude: 40.7306, longitude: -73.9352 };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Act
      const result = await getDirections(start, end);

      // Assert
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle coordinates with negative values correctly', async () => {
      // Arrange
      const start: Coordinates = { latitude: -33.8688, longitude: 151.2093 }; // Sydney
      const end: Coordinates = { latitude: -37.8136, longitude: 144.9631 }; // Melbourne

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              geometry: { type: 'LineString', coordinates: [] },
              duration: 100,
              distance: 200,
            },
          ],
        }),
      });

      // Act
      await getDirections(start, end);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('151.2093,-33.8688;144.9631,-37.8136')
      );
    });

    it('should return complete route data structure', async () => {
      // Arrange
      const start: Coordinates = { latitude: 40.7128, longitude: -74.0060 };
      const end: Coordinates = { latitude: 40.7306, longitude: -73.9352 };

      const mockGeometry = {
        type: 'LineString',
        coordinates: [
          [-74.0060, 40.7128],
          [-74.0050, 40.7150],
          [-73.9352, 40.7306],
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              geometry: mockGeometry,
              duration: 900,
              distance: 3500,
            },
          ],
        }),
      });

      // Act
      const result = await getDirections(start, end);

      // Assert
      expect(result).toEqual({
        geometry: mockGeometry,
        duration: 900,
        distance: 3500,
      });
    });
  });
});
