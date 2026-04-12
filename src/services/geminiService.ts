// Point completely to the deployed remote Cloud Function Proxy exclusively
const PROXY_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-roarboard-9b104.cloudfunctions.net/geminiProxy';

// Keep this consistent per session for rate limiting
let sessionCache: string | null = null;
const getSessionId = () => {
    if (!sessionCache) {
        sessionCache = Math.random().toString(36).substring(2, 15);
    }
    return sessionCache;
};

// Custom lightweight SSE parser (buffers incomplete JSON strings)
export async function submitGeminiQuery(
  message: string,
  history: any[],
  venueContext: any, // Contains userPrefs, activePath, trends
  onChunk: (text: string) => void
) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      venueData: venueContext,
      sessionId: getSessionId()
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("You've reached the API limit. Please try again in a minute.");
    }
    throw new Error('Something went wrong. Try again.');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Streaming not supported by browser.');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    // Process full lines from the buffer
    let lineEndIndex;
    while ((lineEndIndex = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.substring(0, lineEndIndex).trim();
      buffer = buffer.substring(lineEndIndex + 2);

      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') return;
        
        try {
          const data = JSON.parse(dataStr);
          if (data.error) {
            throw new Error(data.error);
          }
          if (data.text) {
            onChunk(data.text);
          }
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      }
    }
  }
}
