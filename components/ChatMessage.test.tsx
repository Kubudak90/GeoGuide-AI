import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../src/test/testUtils';
import ChatMessage from './ChatMessage';
import { Message } from '../types';

// Mock GroundingChips
vi.mock('./GroundingChips', () => ({
  default: ({ metadata }: any) =>
    metadata ? <div data-testid="grounding-chips">Grounding</div> : null,
}));

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

describe('ChatMessage', () => {
  describe('User Messages', () => {
    it('should render user message correctly', () => {
      const message: Message = {
        id: '1',
        role: 'user',
        text: 'Hello, how are you?',
        timestamp: Date.now(),
      };

      render(<ChatMessage message={message} />);

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });

    it('should display user avatar', () => {
      const message: Message = {
        id: '1',
        role: 'user',
        text: 'Test',
        timestamp: Date.now(),
      };

      const { container } = render(<ChatMessage message={message} />);

      // User messages should have blue styling
      const avatar = container.querySelector('.bg-blue-600');
      expect(avatar).toBeInTheDocument();
    });

    it('should align user messages to the right', () => {
      const message: Message = {
        id: '1',
        role: 'user',
        text: 'Test',
        timestamp: Date.now(),
      };

      const { container } = render(<ChatMessage message={message} />);

      // Check for justify-end class
      const wrapper = container.querySelector('.justify-end');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Model Messages', () => {
    it('should render model message correctly', () => {
      const message: Message = {
        id: '2',
        role: 'model',
        text: 'I am doing well, thank you!',
        timestamp: Date.now(),
      };

      render(<ChatMessage message={message} />);

      expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
    });

    it('should display bot avatar for model messages', () => {
      const message: Message = {
        id: '2',
        role: 'model',
        text: 'Test',
        timestamp: Date.now(),
      };

      const { container } = render(<ChatMessage message={message} />);

      // Model messages should have white background with border
      const avatar = container.querySelector('.bg-white.border');
      expect(avatar).toBeInTheDocument();
    });

    it('should align model messages to the left', () => {
      const message: Message = {
        id: '2',
        role: 'model',
        text: 'Test',
        timestamp: Date.now(),
      };

      const { container } = render(<ChatMessage message={message} />);

      // Check for justify-start class
      const wrapper = container.querySelector('.justify-start');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading animation when isLoading is true', () => {
      const message: Message = {
        id: '3',
        role: 'model',
        text: '',
        timestamp: Date.now(),
        isLoading: true,
      };

      const { container } = render(<ChatMessage message={message} />);

      // Check for animated dots
      const animatedDots = container.querySelectorAll('.animate-bounce');
      expect(animatedDots.length).toBe(3);
    });

    it('should not show text when loading', () => {
      const message: Message = {
        id: '3',
        role: 'model',
        text: 'This should not appear',
        timestamp: Date.now(),
        isLoading: true,
      };

      render(<ChatMessage message={message} />);

      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });

    it('should not show grounding chips when loading', () => {
      const message: Message = {
        id: '3',
        role: 'model',
        text: '',
        timestamp: Date.now(),
        isLoading: true,
        groundingMetadata: {
          searchChunks: [{ uri: 'http://test.com', title: 'Test', source: 'test' }],
        },
      };

      render(<ChatMessage message={message} />);

      expect(screen.queryByTestId('grounding-chips')).not.toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('should render markdown content', () => {
      const message: Message = {
        id: '4',
        role: 'model',
        text: '**Bold text** and *italic text*',
        timestamp: Date.now(),
      };

      render(<ChatMessage message={message} />);

      expect(screen.getByTestId('markdown')).toBeInTheDocument();
      expect(screen.getByText('**Bold text** and *italic text*')).toBeInTheDocument();
    });

    it('should render empty text without errors', () => {
      const message: Message = {
        id: '5',
        role: 'model',
        text: '',
        timestamp: Date.now(),
      };

      const { container } = render(<ChatMessage message={message} />);

      expect(container.querySelector('.markdown-body')).toBeInTheDocument();
    });
  });

  describe('Grounding Metadata', () => {
    it('should show grounding chips when metadata is present', () => {
      const message: Message = {
        id: '6',
        role: 'model',
        text: 'Here is some information',
        timestamp: Date.now(),
        groundingMetadata: {
          searchChunks: [
            { uri: 'http://example.com', title: 'Example', source: 'example.com' },
          ],
        },
      };

      render(<ChatMessage message={message} />);

      expect(screen.getByTestId('grounding-chips')).toBeInTheDocument();
    });

    it('should not show grounding chips when metadata is absent', () => {
      const message: Message = {
        id: '7',
        role: 'model',
        text: 'No sources',
        timestamp: Date.now(),
      };

      render(<ChatMessage message={message} />);

      expect(screen.queryByTestId('grounding-chips')).not.toBeInTheDocument();
    });
  });

  describe('Message Styling', () => {
    it('should apply different styles for user and model messages', () => {
      const userMessage: Message = {
        id: '8',
        role: 'user',
        text: 'User message',
        timestamp: Date.now(),
      };

      const modelMessage: Message = {
        id: '9',
        role: 'model',
        text: 'Model message',
        timestamp: Date.now(),
      };

      const { container: userContainer } = render(<ChatMessage message={userMessage} />);
      const { container: modelContainer } = render(<ChatMessage message={modelMessage} />);

      // User message should have blue background
      expect(userContainer.querySelector('.bg-blue-600')).toBeInTheDocument();

      // Model message should have white background
      expect(modelContainer.querySelector('.bg-white')).toBeInTheDocument();
    });
  });
});
