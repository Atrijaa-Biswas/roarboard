import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, User, Trophy } from 'lucide-react';
import { submitGeminiQuery } from '../../services/geminiService';
import { useVenueStore } from '../../store/useVenueStore';
import { useAlertStore } from '../../store/useAlertStore';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

// Quick chips that teach users how points work
const QUICK_CHIPS = [
  { label: '🚪 Fastest gate?', prompt: 'Which gate has the shortest wait right now?' },
  { label: '🗺️ Navigate me', prompt: 'Navigate me to the fastest gate right now.' },
  { label: '⚠️ Any congestion?', prompt: 'Any crowd alerts or congestion I should know about?' },
  { label: '⭐ How to earn points?', prompt: 'How do I earn points on RoarBoard?' },
];

// Parse DRAW_ROUTE from AI response — handles both formats:
// Simple: <ACTION>DRAW_ROUTE=GateB</ACTION>
// Chain:  <ACTION>DRAW_ROUTE=East1=>ConcourseE=>GateB</ACTION>
function parseActions(text: string) {
  const results: { type: string; destination: string }[] = [];
  const regex = /<ACTION>DRAW_ROUTE=([^<]+)<\/ACTION>/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1].trim();
    // Last node in a chain is the destination
    const nodes = raw.split('=>').map(n => n.trim());
    const destination = nodes[nodes.length - 1];
    if (destination) results.push({ type: 'DRAW_ROUTE', destination });
  }
  return results;
}

export default function GeminiChat() {
  const isChatOpen    = useVenueStore(state => state.isChatOpen);
  const setIsChatOpen = useVenueStore(state => state.setIsChatOpen);
  const points        = useVenueStore(state => state.userPrefs.points);
  const addPoints     = useVenueStore(state => state.addPoints);
  const setActivePath = useVenueStore(state => state.setActivePath);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{ text: 'Hi! I\'m RoarAI 👋\n\nI have live access to gate wait times, crowd density, and venue alerts. Ask me anything — I can navigate you to the fastest gate and earn you +25 points per route followed!' }]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Track whether points have been awarded for the current AI response (prevent double-award)
  const pointsAwardedRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (textToSubmit: string) => {
    if (!textToSubmit.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', parts: [{ text: textToSubmit }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    pointsAwardedRef.current = false;

    // Add empty AI message placeholder for streaming
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

    let fullResponse = '';

    try {
      await submitGeminiQuery(
        textToSubmit,
        // Pass history minus the empty placeholder we just added
        messages.map(m => ({ role: m.role, parts: m.parts })),
        useVenueStore.getState(),
        (chunk: string) => {
          fullResponse += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'model',
              parts: [{ text: fullResponse }],
            };
            return updated;
          });
        }
      );

    } catch (err: any) {
      console.warn('[RoarAI] Query failed:', err?.message);
      // Intelligent fallback using live gate data
      const gates = Object.values(useVenueStore.getState().gates ?? {}) as any[];
      const sorted = [...gates].sort((a, b) => (a.waitMinutes ?? 0) - (b.waitMinutes ?? 0));
      const best = sorted[0];
      fullResponse = best
        ? `Connection issue, but I still have local data! ${best.name} has the shortest wait at ${Math.round(best.waitMinutes)} min. Ask me to navigate you there for +25 points.`
        : 'Connection issue. Please try again shortly.';

      setMessages(prev => {
        const updated = [...prev];
        if (!updated[updated.length - 1].parts[0].text) {
          updated[updated.length - 1] = { role: 'model', parts: [{ text: fullResponse }] };
        } else {
          updated.push({ role: 'model', parts: [{ text: fullResponse }] });
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }

    // ── Process AI actions AFTER streaming completes ─────────────────────
    // Strip action tags from displayed message
    const cleanText = fullResponse.replace(/<ACTION>.*?<\/ACTION>/gi, '').trim();
    if (cleanText !== fullResponse) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].parts[0].text = cleanText;
        return updated;
      });
    }

    // Execute parsed actions
    const actions = parseActions(fullResponse);
    for (const action of actions) {
      if (action.type === 'DRAW_ROUTE' && action.destination) {
        // Map AI gate name to store key format
        const gateKey = action.destination
          .replace('Gate', 'g')
          .replace('gate', 'g');

        setActivePath([gateKey]);

        // Award points exactly once per navigation
        if (!pointsAwardedRef.current) {
          pointsAwardedRef.current = true;
          addPoints(25);
          useAlertStore.getState().addAlert({
            title: '🗺️ Route Activated — +25 pts!',
            body: `Navigating to ${action.destination}. Follow the blue path on the map.`,
            severity: 'info',
            source: 'ai',
          });
        }

        if (window.innerWidth < 1024) setIsChatOpen(false);
      }
    }
  };

  return (
    <>
      {/* Mobile FAB — only when chat is closed */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed lg:hidden bottom-28 right-5 w-12 h-12 bg-accentBlue text-white rounded-full shadow-[0_0_22px_rgba(59,130,246,0.55)] flex items-center justify-center z-[60] transition-all hover:scale-110 active:scale-95"
          aria-label="Open AI chat"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Chat panel */}
      <div className={`
        fixed lg:relative inset-0 lg:inset-auto
        lg:w-[380px] lg:h-[580px] lg:rounded-3xl
        glass-panel shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)]
        flex flex-col overflow-hidden z-[60]
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${isChatOpen
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }
      `}>

        {/* Header */}
        <div className="h-14 flex-shrink-0 border-b border-white/10 px-4 flex items-center justify-between bg-gradient-to-r from-transparent to-white/5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-accentBlue" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accentBlue rounded-full animate-ping opacity-75" />
            </div>
            <h3 className="font-black text-sm tracking-widest uppercase text-white">
              Roar<span className="text-accentBlue">AI</span>
            </h3>
          </div>

          {/* Live points badge */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-accentBlue/15 border border-accentBlue/30 rounded-full text-accentBlue text-[11px] font-black"
              title="Earn +25 pts by following AI navigation"
            >
              <Trophy className="w-3 h-3" />
              {points} pts
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 text-textSecondary hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4 scrollbar-hide">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="flex items-start gap-3 animate-slideUp"
              style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
            >
              <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm ${
                msg.role === 'model'
                  ? 'bg-accentBlue text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  : 'bg-surface border border-borderSecondary text-textPrimary'
              }`}>
                {msg.role === 'model' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[calc(100%-3rem)] rounded-2xl ${
                msg.role === 'model'
                  ? 'bg-white/5 border border-white/10 text-textPrimary rounded-tl-sm'
                  : 'bg-accentBlue/10 border border-accentBlue/20 text-white rounded-tr-sm'
              }`}>
                {msg.parts[0].text || (
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-1.5 h-1.5 bg-accentBlue rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Input area */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-pureBlack via-surface/90 to-transparent">
          {/* Quick chips — show for first 3 messages */}
          {messages.length <= 3 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-2.5 pb-0.5">
              {QUICK_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(chip.prompt)}
                  disabled={isLoading}
                  className="flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-textSecondary hover:text-white hover:border-accentBlue/50 hover:bg-accentBlue/10 transition-all disabled:opacity-40 whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={e => { e.preventDefault(); handleSubmit(input); }}
            className="flex items-center gap-2 bg-pureBlack/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full"
          >
            <input
              type="text"
              className="flex-1 bg-transparent text-white px-3 py-1.5 text-sm outline-none placeholder-textSecondary/50"
              placeholder="Ask anything about the venue…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 flex-shrink-0 bg-accentBlue text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-[0_0_12px_rgba(59,130,246,0.35)]"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
