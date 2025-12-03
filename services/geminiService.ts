import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Message, ModelType, Coordinates, GroundingMetadata, SearchChunk, MapChunk, PlaceDetails, Place } from "../types";

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

// ... (imports)

export const sendMessageToGemini = async (
  history: Message[],
  currentMessage: string,
  modelType: ModelType,
  userLocation?: Coordinates,
  selectedPlace?: PlaceDetails | null
): Promise<{ text: string; groundingMetadata?: GroundingMetadata; places?: Place[] }> => {

  try {
    // 1. Format History
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // 2. Prepare Tools & Config
    const tools: any[] = [];
    let toolConfig: any = undefined;

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

    // 3. Construct System Instruction
    // We append this to the user's message to guide the model's output format.
    const jsonInstruction = `
    IMPORTANT: If you are recommending places, you MUST output a JSON array of places at the end of your response.
    The JSON array should be wrapped in a markdown code block labeled 'json'.
    Each place object in the array MUST have the following fields:
    - name: string
    - coordinates: { lat: number, lng: number }
    - short_description: string (2-3 sentences, engaging tourist guide style)
    - website: string | null
    - category: string (e.g., Restaurant, Museum, Park)

    Example format:
    Here are some great places...
    \`\`\`json
    [
      {
        "name": "Galata Tower",
        "coordinates": { "lat": 41.0256, "lng": 28.9744 },
        "short_description": "A medieval stone tower...",
        "website": "https://...",
        "category": "Historical Landmark"
      }
    ]
    \`\`\`
    Do NOT provide Google Maps links. Use the JSON format instead.
    `;

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
      { role: 'user', parts: [{ text: systemContext + currentMessage + jsonInstruction }] }
    ];

    const modelId = modelType;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        tools: tools.length > 0 ? tools : undefined,
        toolConfig: toolConfig,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ]
      }
    });

    let text = response.text || "I couldn't generate a response.";
    let places: Place[] | undefined = undefined;

    // 4. Parse JSON from Response
    // Regex to find JSON block wrapped in ```json ... ``` or just ``` ... ```
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);

    if (match && match[1]) {
      try {
        const potentialJson = match[1];
        const parsed = JSON.parse(potentialJson);

        if (Array.isArray(parsed)) {
          places = parsed;
          // Optional: Remove the JSON block from the displayed text if desired
          // text = text.replace(match[0], '').trim(); 
          // For now, we keep it or maybe clean it up. Let's remove it to keep chat clean.
          text = text.replace(match[0], '').trim();
        }
      } catch (e) {
        console.warn("Failed to parse JSON from Gemini response:", e);
      }
    }

    // Extract Grounding Metadata (keep existing logic)
    const groundingMetadata = extractGroundingMetadata(response);

    return { text, groundingMetadata, places };

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
