import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Message, ModelType, Coordinates, GroundingMetadata, SearchChunk, MapChunk, PlaceDetails } from "../types";

/// <reference types="vite/client" />

// Initialize Gemini Client
// Vite replaces process.env.API_KEY at build time, but TS needs to know about it.
// We also support import.meta.env for standard Vite usage.
const apiKey = (import.meta.env?.VITE_API_KEY as string) || (process as any).env.API_KEY;

console.log("Gemini Service Initializing...");
if (!apiKey) {
  console.error("CRITICAL: Gemini API Key is missing! Check .env.local (GEMINI_API_KEY or VITE_API_KEY)");
} else {
  console.log("Gemini API Key found (length):", apiKey.length);
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export const sendMessageToGemini = async (
  history: Message[],
  currentMessage: string,
  modelType: ModelType,
  userLocation?: Coordinates,
  selectedPlace?: PlaceDetails | null
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {

  try {
    // 1. Format History
    // Limit history to last 10 messages to keep context relevant and avoid token limits
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // 2. Prepare Tools & Config
    const tools: any[] = [];
    let toolConfig: any = undefined;

    // "Maps & Search" mode uses gemini-2.5-flash with both tools
    if (modelType === ModelType.MAPS_SEARCH) {
      tools.push({ googleSearch: {} });
      tools.push({ googleMaps: {} });

      if (userLocation) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          }
        };
      }
    }

    // Construct request
    let systemContext = "";
    if (selectedPlace) {
      systemContext = `
Context: The user has selected a place on the map:
Name: ${selectedPlace.name}
Address: ${selectedPlace.formatted_address}
Rating: ${selectedPlace.rating || 'N/A'}
Website: ${selectedPlace.website || 'N/A'}
If the user asks about "this place" or "it", refer to the place above.
`;
    }

    const contents = [
      ...recentHistory,
      { role: 'user', parts: [{ text: systemContext + currentMessage }] }
    ];

    const modelId = modelType;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        tools: tools.length > 0 ? tools : undefined,
        toolConfig: toolConfig,
        // Ensure we don't block on safety for benign map queries
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ]
      }
    });

    const text = response.text || "I couldn't generate a response.";

    // Extract Grounding Metadata
    const groundingMetadata = extractGroundingMetadata(response);

    return { text, groundingMetadata };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

const extractGroundingMetadata = (response: GenerateContentResponse): GroundingMetadata | undefined => {
  const candidate = response.candidates?.[0];
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks;

  if (!groundingChunks || groundingChunks.length === 0) {
    return undefined;
  }

  const searchChunks: SearchChunk[] = [];
  const mapChunks: MapChunk[] = [];

  groundingChunks.forEach((chunk: any) => {
    if (chunk.web) {
      searchChunks.push({
        uri: chunk.web.uri,
        title: chunk.web.title,
        source: chunk.web.source
      });
    } else if (chunk.maps) {
      // Try to find the best address field, falling back to what might be available
      const address = chunk.maps.address || chunk.maps.formattedAddress;
      const snippet = chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.content;

      mapChunks.push({
        uri: chunk.maps.uri,
        title: chunk.maps.title,
        address: address,
        snippet: snippet
      });
    }
  });

  if (searchChunks.length === 0 && mapChunks.length === 0) {
    return undefined;
  }

  return {
    searchChunks: searchChunks.length > 0 ? searchChunks : undefined,
    mapChunks: mapChunks.length > 0 ? mapChunks : undefined,
  };
};
