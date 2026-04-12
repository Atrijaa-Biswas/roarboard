import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, User } from 'lucide-react';
import { submitGeminiQuery } from '../../services/geminiService';
import { useVenueStore } from '../../store/useVenueStore';
import { useAlertStore } from '../../store/useAlertStore';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

// Quick-access chips — guide user to point-earning actions
const QUICK_CHIPS = [
  { label: '🚪 Best gate now', prompt: 'Which gate has the shortest wait right now?' },
  { label: '🗺️ Navigate to Gate B', prompt: 'Navigate me to Gate B using the optimal route.' },
  { label: '📍 Where am I?', prompt: 'Where am I in the stadium and what is nearby?' },
  { label: '⚠️ Any alerts?', prompt: 'Are there any active crowd alerts or congestion warnings I should know about?' },
];

export default function GeminiChat() {
  const isChatOpen    = useVenueStore(state => state.isChatOpen);
  const setIsChatOpen = useVenueStore(state => state.setIsChatOpen);
  const points        = useVenueStore(state => state.userPrefs.points);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', parts: [{ text: "Hi! I'm RoarAI 👋\n\nAsk me anything about the venue — I can navigate you to the fastest gate, check crowd density, or raise alerts.\n\n💡 Tip: Following my route suggestions earns you +25 points each time!" }] }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (textToSubmit: string) => {
    if (!textToSubmit.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', parts: [{ text: textToSubmit }] }]);
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

    let streamedResponse = '';

    try {
      await submitGeminiQuery(
        textToSubmit,
        messages.map(m => ({ role: m.role, parts: m.parts })),
        useVenueStore.getState(),
        (chunk: string) => {
          streamedResponse += chunk;
          setMessages(prev => {
            const h = [...prev];
            h[h.length - 1] = { role: 'model', parts: [{ text: streamedResponse }] };
            return h;
          });
        }
      );

      // ── AI Action Safety Guardrails ──────────────────────────────────────
      const actionRegex = /<ACTION>(.*?)<\/ACTION>/g;
      const allowedActions = ['DRAW_ROUTE', 'SHOW_ALERT', 'HIGHLIGHT_ZONE'];
      let match;

      while ((match = actionRegex.exec(streamedResponse)) !== null) {
        const [actionType, payload] = match[1].trim().split('=');
        if (!allowedActions.includes(actionType)) {
          console.warn('[RoarBoard] Blocked unsafe AI action:', actionType);
          continue;
        }
        if (actionType === 'DRAW_ROUTE' && payload) {
          const nodes = payload.split('=>').map((n: string) => n.trim());
          useVenueStore.getState().setActivePath(nodes);
          useVenueStore.getState().addPoints(25);
          useAlertStore.getState().addAlert({
            title: '🗺️ Route Activated',
            body: `AI is navigating you to ${nodes[nodes.length - 1]}. Follow the blue path.`,
            severity: 'info',
            source: 'ai',
          });
          if (window.innerWidth < 1024) setIsChatOpen(false);
        }
      }

      // Strip hidden action tags from displayed text
      const cleanText = streamedResponse.replace(/<ACTION>.*?<\/ACTION>/gs, '').trim();
      setMessages(prev => {
        const h = [...prev];
        h[h.length - 1].parts[0].text = cleanText;
        return h;
      });

    } catch {
      const gates = Object.values(useVenueStore.getState().gates ?? {})
        .sort((a, b) => (a.waitMinutes ?? 0) - (b.waitMinutes ?? 0));
      const best = gates[0];
      const fallback = best
        ? `Live connection offline. Based on current data, ${best.name} has the shortest wait (${Math.round(best.waitMinutes)} min).`
        : 'Live connection offline. Please check Gate B as a fallback.';

      setMessages(prev => {
        const h = [...prev];
        if (!h[h.length - 1].parts[0].text) {
          h[h.length - 1].parts[0].text = fallback;
        } else {
          h.push({ role: 'model', parts: [{ text: fallback }] });
        }
        return h;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── Mobile FAB (shown when chat is closed on mobile) ────────────── */}
      {!isChatOpen && (
        <button
          className="fixed lg:hidden bottom-28 right-5 w-12 h-12 bg-accentBlue text-white rounded-full shadow-[0_0_22px_rgba(59,130,246,0.55)] flex items-center justify-center z-[60] transition-all hover:scale-110 active:scale-95"
          onClick={() => setIsChatOpen(true)}
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
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
        <div className="h-14 flex-shrink-0 border-b border-white/10 px-5 flex items-center justify-between bg-gradient-to-r from-transparent to-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-accentBlue" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accentBlue rounded-full animate-ping opacity-75" />
            </div>
            <h3 className="font-bold text-sm tracking-widest uppercase text-white">
              Roar<span className="text-accentBlue">AI</span>
            </h3>
            {/* Live points display in chat header */}
            <span
              className="text-[10px] font-bold px-2 py-0.5 bg-accentBlue/15 text-accentBlue border border-accentBlue/25 rounded-full"
              title="Earn +25 pts by following AI route suggestions"
            >
              ⭐ {points} pts
            </span>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 text-textSecondary hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full outline-none"
            aria-label="Close AI chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-3 w-full animate-slideUp" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'model'
                  ? 'bg-accentBlue text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                  : 'bg-surface border border-borderSecondary text-textPrimary'
              }`}>
                {msg.role === 'model' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`px-4 py-3 text-sm leading-relaxed max-w-[calc(100%-3rem)] whitespace-pre-wrap ${
                msg.role === 'model'
                  ? 'bg-white/5 border border-white/10 text-textPrimary rounded-2xl rounded-tl-sm'
                  : 'bg-accentBlue/10 border border-accentBlue/20 text-white rounded-2xl rounded-tr-sm'
              }`}>
                {msg.parts[0].text || (
                  <div className="flex space-x-1 items-center h-4">
                    <div className="w-1.5 h-1.5 bg-accentBlue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-accentBlue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-accentBlue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Input area — absolutely positioned at the bottom of the panel */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-pureBlack via-surface/90 to-transparent">
          {/* Quick chip suggestions */}
          {messages.length <= 2 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-0.5">
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

          {/* Text input row */}
          <form
            onSubmit={e => { e.preventDefault(); handleSubmit(input); }}
            className="flex items-center gap-2 bg-pureBlack/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl"
          >
            <input
              type="text"
              className="flex-1 bg-transparent text-white px-4 py-2 text-sm outline-none placeholder-textSecondary/50 font-medium"
              placeholder="Ask anything about the venue…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 bg-accentBlue text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-all shadow-[0_0_12px_rgba(59,130,246,0.35)] flex-shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
