/**
 * RoarBoard Gemini Service
 * Uses Gemini 1.5 Flash REST API (generateContent, non-streaming).
 * Simulates streaming by revealing the response word by word.
 *
 * Fallback chain:
 *   1. Direct Gemini API (via VITE_GEMINI_API_KEY)
 *   2. Intelligent local response (always available)
 */

// Strip any accidental quotes that Windows dotenv may preserve
function getApiKey(): string {
  const raw = import.meta.env.VITE_GEMINI_API_KEY ?? '';
  return raw.replace(/^["']|["']$/g, '').trim();
}

const GEMINI_API_KEY = getApiKey();
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Build dynamic system prompt from live venue state ────────────────────────
function buildSystemPrompt(venueData: any): string {
  const gates = Object.values(venueData?.gates ?? {}) as any[];
  const sorted = [...gates].sort((a, b) => (a.waitMinutes ?? 0) - (b.waitMinutes ?? 0));
  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];

  const gateSummary = sorted
    .map(g => `${g.name}: ${Math.round(g.waitMinutes ?? 0)} min (${g.status ?? 'unknown'}, ${g.trend ?? 'stable'})`)
    .join(', ');

  return [
    'You are RoarAI, the real-time venue assistant for RoarBoard — a smart stadium platform.',
    '',
    'LIVE VENUE STATE:',
    `Gates: ${gateSummary}`,
    `Best gate right now: ${best?.name ?? 'Gate B'} (${Math.round(best?.waitMinutes ?? 0)} min wait)`,
    `Most congested: ${worst?.name ?? 'Gate C'} (${Math.round(worst?.waitMinutes ?? 0)} min wait)`,
    `User points: ${venueData?.userPrefs?.points ?? 0}`,
    '',
    'RULES:',
    '1. Use the LIVE DATA above. Never say you lack access to real-time data.',
    '2. Be concise (2–3 sentences max unless giving directions).',
    '3. When user asks to navigate/go to/route to a gate, end your reply with exactly:',
    '   <ACTION>DRAW_ROUTE=GateX</ACTION>',
    '   where GateX is one of: GateA, GateB, GateC, GateD, GateE, GateF',
    '4. Mention +25 points reward when suggesting navigation.',
    '5. Never use <ACTION> unless the user explicitly asks for route/navigation.',
  ].join('\n');
}

// ── Build a strictly alternating user/model content array ───────────────────
function buildContents(message: string, history: any[], venueData: any) {
  const systemText = buildSystemPrompt(venueData);

  // Always start: user→model to inject system context
  const contents: { role: string; parts: { text: string }[] }[] = [
    { role: 'user',  parts: [{ text: systemText }] },
    { role: 'model', parts: [{ text: 'Understood. I have the live data and I am ready to assist.' }] },
  ];

  // Replay conversation history — enforce strict user/model alternation
  // Skip the initial model welcome message (index 0) since we've already seeded a model turn
  const relevantHistory = history
    .filter(m => m.parts?.[0]?.text?.trim())
    .slice(-8); // last 8 messages max

  let lastRole = 'model'; // contents already ends with model
  for (const msg of relevantHistory) {
    const role = msg.role === 'model' ? 'model' : 'user';
    // Only add if it alternates correctly
    if (role !== lastRole) {
      contents.push({ role, parts: [{ text: msg.parts[0].text.slice(0, 500) }] });
      lastRole = role;
    }
  }

  // Ensure we can add a user message (last must be model)
  if (lastRole !== 'model') {
    contents.push({ role: 'model', parts: [{ text: 'Got it.' }] });
  }

  // Add current user message
  contents.push({ role: 'user', parts: [{ text: message.slice(0, 500) }] });

  return contents;
}

// ── Simulate streaming: reveal response word-by-word ────────────────────────
function streamWords(text: string, onChunk: (t: string) => void, msPerWord = 35): Promise<void> {
  return new Promise(resolve => {
    const words = text.split(' ');
    let i = 0;
    const tick = () => {
      if (i < words.length) {
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        i++;
        setTimeout(tick, msPerWord);
      } else {
        resolve();
      }
    };
    tick();
  });
}

// ── Local intelligent fallback ────────────────────────────────────────────────
function localFallback(
  message: string,
  venueData: any,
  onChunk: (t: string) => void
): Promise<void> {
  const gates = Object.values(venueData?.gates ?? {}) as any[];
  const sorted = [...gates].sort((a, b) => (a.waitMinutes ?? 0) - (b.waitMinutes ?? 0));
  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];
  const points = venueData?.userPrefs?.points ?? 0;
  const lower = message.toLowerCase();

  let reply = '';

  if (lower.match(/navigat|route|take me|go to|direct/)) {
    reply = `Head to ${best?.name ?? 'Gate B'} now — only ${Math.round(best?.waitMinutes ?? 0)} min wait. You'll earn +25 points for following this route! <ACTION>DRAW_ROUTE=${(best?.name ?? 'Gate B').replace(' ', '')}</ACTION>`;
  } else if (lower.match(/best gate|fastest|shortest|quickest/)) {
    reply = `Best gate right now is ${best?.name ?? 'Gate B'} with ${Math.round(best?.waitMinutes ?? 0)} min wait (${best?.trend ?? 'stable'} trend). Ask me to navigate you there for +25 points!`;
  } else if (lower.match(/congestion|crowded|busy|alert|delay/)) {
    reply = `${worst?.name ?? 'Gate C'} is most congested at ${Math.round(worst?.waitMinutes ?? 0)} min. Recommend diverting to ${best?.name ?? 'Gate B'} (${Math.round(best?.waitMinutes ?? 0)} min).`;
  } else if (lower.match(/point|score|earn/)) {
    reply = `You have ${points} points! Earn +25 points each time you ask me to navigate you and follow the route. Try "Navigate me to the fastest gate"!`;
  } else if (lower.match(/gate [a-f]|which gate/)) {
    const gateLetter = lower.match(/gate ([a-f])/)?.[1]?.toUpperCase();
    const found = gates.find(g => g.name === `Gate ${gateLetter}`);
    reply = found
      ? `Gate ${gateLetter} currently has a ${Math.round(found.waitMinutes)} min wait (${found.status} congestion, ${found.trend}). ${found.waitMinutes <= 10 ? 'Great choice!' : 'Consider ' + (best?.name ?? 'Gate B') + ' instead — only ' + Math.round(best?.waitMinutes ?? 0) + ' min.'}`
      : `Best gate right now is ${best?.name ?? 'Gate B'} with ${Math.round(best?.waitMinutes ?? 0)} min wait.`;
  } else {
    reply = `I have live gate intelligence! Best: ${best?.name} (${Math.round(best?.waitMinutes ?? 0)} min) · Busiest: ${worst?.name} (${Math.round(worst?.waitMinutes ?? 0)} min). How can I help you navigate?`;
  }

  return streamWords(reply, onChunk, 40);
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function submitGeminiQuery(
  message: string,
  history: any[],
  venueData: any,
  onChunk: (text: string) => void
): Promise<void> {

  // No API key → go straight to local fallback (avoids confusing error)
  if (!GEMINI_API_KEY) {
    console.warn('[RoarAI] No VITE_GEMINI_API_KEY found — using local fallback');
    return localFallback(message, venueData, onChunk);
  }

  try {
    const contents = buildContents(message, history, venueData);

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 350,
          topP: 0.9,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[RoarAI] HTTP ${response.status}:`, errText);
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      console.warn('[RoarAI] Empty response from Gemini:', JSON.stringify(data));
      throw new Error('Empty API response');
    }

    // Simulate word-by-word streaming for UX feel
    await streamWords(text, onChunk, 30);

  } catch (err: any) {
    console.error('[RoarAI] Falling back to local:', err?.message);
    // Always deliver a useful response — never show a dead end
    return localFallback(message, venueData, onChunk);
  }
}
