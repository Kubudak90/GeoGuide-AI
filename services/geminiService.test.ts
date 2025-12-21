import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessageToGemini } from './geminiService';
import { ModelType, Message, Coordinates } from '../types';

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();

  return {
    GoogleGenAI: vi.fn(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
    HarmBlockThreshold: {
      BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
    },
  };
});

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_API_KEY: 'test-api-key-123',
    },
  },
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessageToGemini', () => {
    it('should send a basic message and return response text', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      mockGenerateContent.mockResolvedValueOnce({
        text: 'Hello! How can I help you?',
        candidates: [{}],
      });

      const history: Message[] = [];
      const currentMessage = 'Hello';
      const modelType = ModelType.FAST;

      // Act
      const result = await sendMessageToGemini(history, currentMessage, modelType);

      // Assert
      expect(result.text).toBe('Hello! How can I help you?');
      expect(mockGenerateContent).toHaveBeenCalledOnce();
    });

    it('should include user location in tool config for MAPS_SEARCH model', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      mockGenerateContent.mockResolvedValueOnce({
        text: 'Here are some places nearby.',
        candidates: [{}],
      });

      const history: Message[] = [];
      const currentMessage = 'Find restaurants near me';
      const modelType = ModelType.MAPS_SEARCH;
      const userLocation: Coordinates = { latitude: 40.7128, longitude: -74.0060 };

      // Act
      await sendMessageToGemini(history, currentMessage, modelType, userLocation);

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: 40.7128,
                  longitude: -74.0060,
                },
              },
            },
          }),
        })
      );
    });

    it('should include Google Search and Maps tools for MAPS_SEARCH model', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      mockGenerateContent.mockResolvedValueOnce({
        text: 'Here are some places.',
        candidates: [{}],
      });

      const history: Message[] = [];
      const currentMessage = 'Find museums';
      const modelType = ModelType.MAPS_SEARCH;

      // Act
      await sendMessageToGemini(history, currentMessage, modelType);

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            tools: [{ googleSearch: {} }, { googleMaps: {} }],
          }),
        })
      );
    });

    it('should parse JSON places from response with markdown code block', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      const responseWithJson = `Here are some great places to visit:

\`\`\`json
[
  {
    "name": "Galata Tower",
    "coordinates": { "lat": 41.0256, "lng": 28.9744 },
    "short_description": "A medieval stone tower in Istanbul.",
    "website": "https://example.com",
    "category": "Historical Landmark"
  }
]
\`\`\``;

      mockGenerateContent.mockResolvedValueOnce({
        text: responseWithJson,
        candidates: [{}],
      });

      const history: Message[] = [];
      const currentMessage = 'Show me landmarks';
      const modelType = ModelType.MAPS_SEARCH;

      // Act
      const result = await sendMessageToGemini(history, currentMessage, modelType);

      // Assert
      expect(result.places).toBeDefined();
      expect(result.places).toHaveLength(1);
      expect(result.places?.[0].name).toBe('Galata Tower');
      expect(result.places?.[0].coordinates).toEqual({ lat: 41.0256, lng: 28.9744 });
      expect(result.text).not.toContain('```json'); // JSON block should be removed from text
    });

    it('should handle response without JSON gracefully', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      mockGenerateContent.mockResolvedValueOnce({
        text: 'This is a plain text response without JSON.',
        candidates: [{}],
      });

      const history: Message[] = [];
      const currentMessage = 'Tell me about Paris';
      const modelType = ModelType.FAST;

      // Act
      const result = await sendMessageToGemini(history, currentMessage, modelType);

      // Assert
      expect(result.places).toBeUndefined();
      expect(result.text).toBe('This is a plain text response without JSON.');
    });

    it('should handle malformed JSON in response', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const responseWithBadJson = `Here are places:
\`\`\`json
{ invalid json here }
\`\`\``;

      mockGenerateContent.mockResolvedValueOnce({
        text: responseWithBadJson,
        candidates: [{}],
      });

      const history: Message[] = [];
      const currentMessage = 'Find places';
      const modelType = ModelType.FAST;

      // Act
      const result = await sendMessageToGemini(history, currentMessage, modelType);

      // Assert
      expect(result.places).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse JSON from Gemini response:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should extract grounding metadata from response', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      mockGenerateContent.mockResolvedValueOnce({
        text: 'Here is some information.',
        candidates: [{
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  uri: 'https://example.com',
                  title: 'Example Article',
                  source: 'example.com',
                },
              },
            ],
          },
        }],
      });

      const history: Message[] = [];
      const currentMessage = 'Tell me about something';
      const modelType = ModelType.MAPS_SEARCH;

      // Act
      const result = await sendMessageToGemini(history, currentMessage, modelType);

      // Assert
      expect(result.groundingMetadata).toBeDefined();
      expect(result.groundingMetadata?.searchChunks).toHaveLength(1);
      expect(result.groundingMetadata?.searchChunks?.[0]).toEqual({
        uri: 'https://example.com',
        title: 'Example Article',
        source: 'example.com',
      });
    });

    it('should extract map chunks from grounding metadata', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      mockGenerateContent.mockResolvedValueOnce({
        text: 'Here is place information.',
        candidates: [{
          groundingMetadata: {
            groundingChunks: [
              {
                maps: {
                  uri: 'https://maps.google.com/place1',
                  title: 'Test Restaurant',
                  address: '123 Test St',
                  placeAnswerSources: {
                    reviewSnippets: [{ content: 'Great food!' }],
                  },
                },
              },
            ],
          },
        }],
      });

      const history: Message[] = [];
      const currentMessage = 'Find restaurants';
      const modelType = ModelType.MAPS_SEARCH;

      // Act
      const result = await sendMessageToGemini(history, currentMessage, modelType);

      // Assert
      expect(result.groundingMetadata?.mapChunks).toBeDefined();
      expect(result.groundingMetadata?.mapChunks).toHaveLength(1);
      expect(result.groundingMetadata?.mapChunks?.[0]).toEqual({
        uri: 'https://maps.google.com/place1',
        title: 'Test Restaurant',
        address: '123 Test St',
        snippet: 'Great food!',
      });
    });

    it('should include selected place context in message', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      mockGenerateContent.mockResolvedValueOnce({
        text: 'This place has great reviews.',
        candidates: [{}],
      });

      const selectedPlace = {
        name: 'Test Café',
        formatted_address: '456 Main St',
        rating: 4.5,
        website: 'https://testcafe.com',
        location: { lat: 40.7128, lng: -74.0060 },
      };

      const history: Message[] = [];
      const currentMessage = 'Tell me about this place';
      const modelType = ModelType.FAST;

      // Act
      await sendMessageToGemini(history, currentMessage, modelType, undefined, selectedPlace);

      // Assert
      const callArgs = mockGenerateContent.mock.calls[0][0];
      const lastContent = callArgs.contents[callArgs.contents.length - 1];
      expect(lastContent.parts[0].text).toContain('Name: Test Café');
      expect(lastContent.parts[0].text).toContain('Address: 456 Main St');
      expect(lastContent.parts[0].text).toContain('Rating: 4.5');
    });

    it('should limit message history to last 10 messages', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      mockGenerateContent.mockResolvedValueOnce({
        text: 'Response',
        candidates: [{}],
      });

      const history: Message[] = Array.from({ length: 15 }, (_, i) => ({
        text: `Message ${i}`,
        isUser: i % 2 === 0,
        role: i % 2 === 0 ? 'user' : 'model',
      }));

      const currentMessage = 'New message';
      const modelType = ModelType.FAST;

      // Act
      await sendMessageToGemini(history, currentMessage, modelType);

      // Assert
      const callArgs = mockGenerateContent.mock.calls[0][0];
      // 10 from history + 1 current message = 11 total
      expect(callArgs.contents).toHaveLength(11);
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const { GoogleGenAI } = await import('@google/genai');
      const mockInstance = new GoogleGenAI({ apiKey: 'test' });
      const mockGenerateContent = mockInstance.models.generateContent as any;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const apiError = new Error('API rate limit exceeded');
      mockGenerateContent.mockRejectedValueOnce(apiError);

      const history: Message[] = [];
      const currentMessage = 'Hello';
      const modelType = ModelType.FAST;

      // Act & Assert
      await expect(
        sendMessageToGemini(history, currentMessage, modelType)
      ).rejects.toThrow('API rate limit exceeded');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Gemini API Error:', apiError);

      consoleErrorSpy.mockRestore();
    });
  });
});
