import { describe, it, expect } from 'vitest';
import { render, screen } from '../src/test/testUtils';
import GroundingChips from './GroundingChips';
import { GroundingMetadata } from '../types';

describe('GroundingChips', () => {
  describe('Rendering with No Data', () => {
    it('should render nothing when metadata is undefined', () => {
      const { container } = render(<GroundingChips />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when metadata is empty', () => {
      const metadata: GroundingMetadata = {};
      const { container } = render(<GroundingChips metadata={metadata} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when both chunks are empty arrays', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [],
        searchChunks: [],
      };
      const { container } = render(<GroundingChips metadata={metadata} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Map Chunks Rendering', () => {
    it('should render map chunks header', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/place1',
            title: 'Restaurant A',
            address: '123 Main St',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Locations Found')).toBeInTheDocument();
    });

    it('should render map chunk with all details', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/place1',
            title: 'Test Restaurant',
            address: '456 Oak Ave',
            snippet: 'Great food and service!',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('"Great food and service!"')).toBeInTheDocument();
    });

    it('should render map chunk without address', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/place1',
            title: 'Museum B',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Museum B')).toBeInTheDocument();
      expect(screen.getByText('Open in Google Maps')).toBeInTheDocument();
    });

    it('should render multiple map chunks', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/place1',
            title: 'Place 1',
            address: 'Address 1',
          },
          {
            uri: 'https://maps.google.com/place2',
            title: 'Place 2',
            address: 'Address 2',
          },
          {
            uri: 'https://maps.google.com/place3',
            title: 'Place 3',
            address: 'Address 3',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Place 1')).toBeInTheDocument();
      expect(screen.getByText('Place 2')).toBeInTheDocument();
      expect(screen.getByText('Place 3')).toBeInTheDocument();
    });

    it('should render map chunks as clickable links', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/place1',
            title: 'Test Place',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      const link = screen.getByText('Test Place').closest('a');
      expect(link).toHaveAttribute('href', 'https://maps.google.com/place1');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Search Chunks Rendering', () => {
    it('should render search chunks header', () => {
      const metadata: GroundingMetadata = {
        searchChunks: [
          {
            uri: 'https://example.com',
            title: 'Example Article',
            source: 'example.com',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Web Sources')).toBeInTheDocument();
    });

    it('should render search chunk with title', () => {
      const metadata: GroundingMetadata = {
        searchChunks: [
          {
            uri: 'https://example.com/article',
            title: 'Interesting Article About Places',
            source: 'example.com',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Interesting Article About Places')).toBeInTheDocument();
    });

    it('should render multiple search chunks', () => {
      const metadata: GroundingMetadata = {
        searchChunks: [
          {
            uri: 'https://site1.com',
            title: 'Article 1',
            source: 'site1.com',
          },
          {
            uri: 'https://site2.com',
            title: 'Article 2',
            source: 'site2.com',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Article 1')).toBeInTheDocument();
      expect(screen.getByText('Article 2')).toBeInTheDocument();
    });

    it('should render search chunks as clickable links', () => {
      const metadata: GroundingMetadata = {
        searchChunks: [
          {
            uri: 'https://test.com/page',
            title: 'Test Page',
            source: 'test.com',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      const link = screen.getByText('Test Page').closest('a');
      expect(link).toHaveAttribute('href', 'https://test.com/page');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Combined Rendering', () => {
    it('should render both map and search chunks together', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/place1',
            title: 'Restaurant',
            address: '123 St',
          },
        ],
        searchChunks: [
          {
            uri: 'https://article.com',
            title: 'Article',
            source: 'article.com',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Locations Found')).toBeInTheDocument();
      expect(screen.getByText('Web Sources')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Article')).toBeInTheDocument();
    });

    it('should render only map chunks when search chunks are empty', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/place1',
            title: 'Place',
          },
        ],
        searchChunks: [],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('Locations Found')).toBeInTheDocument();
      expect(screen.queryByText('Web Sources')).not.toBeInTheDocument();
    });

    it('should render only search chunks when map chunks are empty', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [],
        searchChunks: [
          {
            uri: 'https://test.com',
            title: 'Test',
            source: 'test.com',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.queryByText('Locations Found')).not.toBeInTheDocument();
      expect(screen.getByText('Web Sources')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have proper container styling', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/test',
            title: 'Test',
          },
        ],
      };

      const { container } = render(<GroundingChips metadata={metadata} />);

      // Check for border-t class (border at top)
      const mainContainer = container.querySelector('.border-t');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should apply hover styles to map chunks', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/test',
            title: 'Test',
          },
        ],
      };

      const { container } = render(<GroundingChips metadata={metadata} />);

      const link = container.querySelector('a');
      expect(link?.className).toContain('hover:shadow-md');
    });

    it('should apply hover styles to search chunks', () => {
      const metadata: GroundingMetadata = {
        searchChunks: [
          {
            uri: 'https://test.com',
            title: 'Test',
            source: 'test.com',
          },
        ],
      };

      const { container } = render(<GroundingChips metadata={metadata} />);

      const link = container.querySelector('a');
      expect(link?.className).toContain('hover:bg-blue-50');
    });
  });

  describe('Edge Cases', () => {
    it('should handle map chunk with snippet but no address', () => {
      const metadata: GroundingMetadata = {
        mapChunks: [
          {
            uri: 'https://maps.google.com/place',
            title: 'Place',
            snippet: 'Great reviews!',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(screen.getByText('"Great reviews!"')).toBeInTheDocument();
      expect(screen.queryByText('Open in Google Maps')).not.toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const metadata: GroundingMetadata = {
        searchChunks: [
          {
            uri: 'https://test.com',
            title: 'This is a very long title that should be truncated in the UI to prevent layout issues',
            source: 'test.com',
          },
        ],
      };

      render(<GroundingChips metadata={metadata} />);

      expect(
        screen.getByText('This is a very long title that should be truncated in the UI to prevent layout issues')
      ).toBeInTheDocument();
    });
  });
});
