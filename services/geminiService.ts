import { Message, ModelType, Coordinates, GroundingMetadata, MapChunk, Place, PlaceDetails } from "../types";

/// <reference types="vite/client" />

// Initialize Kimi (Moonshot AI) Client
const apiKey = (import.meta.env?.VITE_API_KEY as string) || (process as any).env.API_KEY;

// Use Vite proxy to bypass CORS and add required User-Agent header
const KIMI_BASE_URL = "/api/kimi";

console.log("Kimi Service Initializing...");
if (!apiKey) {
  console.error("CRITICAL: Moonshot API Key is missing! Check .env.local (MOONSHOT_API_KEY or VITE_API_KEY)");
} else {
  console.log("Moonshot API Key found (length):", apiKey.length);
}

export const sendMessageToGemini = async (
  history: Message[],
  currentMessage: string,
  modelType: ModelType,
  userLocation?: Coordinates,
  selectedPlace?: PlaceDetails | null
): Promise<{ text: string; groundingMetadata?: GroundingMetadata; places?: Place[] }> => {

  try {
    // 1. Format History for OpenAI-compatible API
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text
    }));

    // 2. Construct System Instruction
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

    let systemContext = "You are GeoGuide AI, a helpful travel and geography assistant. You help users find places, restaurants, sights, and provide local recommendations. Always be helpful and provide accurate coordinates when recommending places.";

    if (userLocation) {
      systemContext += `\nThe user's current location is: latitude ${userLocation.latitude}, longitude ${userLocation.longitude}. Use this to provide nearby recommendations when relevant.`;
    }

    if (selectedPlace) {
      systemContext += `
Context: The user has selected a place on the map:
Name: ${selectedPlace.name}
Address: ${selectedPlace.formatted_address}
Rating: ${selectedPlace.rating || 'N/A'}
Website: ${selectedPlace.website || 'N/A'}
If the user asks about "this place" or "it", refer to the place above.`;
    }

    systemContext += "\n" + jsonInstruction;

    // 3. Build messages array
    const messages = [
      { role: "system", content: systemContext },
      ...recentHistory,
      { role: "user", content: currentMessage }
    ];

    // 4. Call Kimi API
    const response = await fetch(KIMI_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelType,
        messages: messages,
        temperature: 0.6,
        max_tokens: 8192
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Kimi API Error Response:", response.status, errorBody);
      throw new Error(`Kimi API Error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
    let places: Place[] | undefined = undefined;

    // 5. Parse JSON from Response
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);

    if (match && match[1]) {
      try {
        const potentialJson = match[1];
        const parsed = JSON.parse(potentialJson);

        if (Array.isArray(parsed)) {
          places = parsed;
          text = text.replace(match[0], '').trim();
        }
      } catch (e) {
        console.warn("Failed to parse JSON from Kimi response:", e);
      }
    }

    return { text, groundingMetadata: undefined, places };

  } catch (error) {
    console.error("Kimi API Error:", error);
    throw error;
  }
};
