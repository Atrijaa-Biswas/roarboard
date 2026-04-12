import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Loader2 } from 'lucide-react';
import { submitGeminiQuery } from '../../services/geminiService';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

const quickChips = [
  "Best gate now",
  "Nearest restroom",
  "Shortest food queue",
  "Order food"
];

export default function GeminiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', parts: [{ text: "Hi, I'm RoarBoard AI. How can I help you navigate the venue today?" }]}
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const handleSubmit = async (textToSubmit: string) => {
    if (!textToSubmit.trim() || isLoading) return;
    
    setError(null);
    const newMsg: Message = { role: 'user', parts: [{ text: textToSubmit }] };
    
    // Add user message to history
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    let streamedResponse = "";
    
    // Add placeholder AI message
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: "" }] }]);

    try {
      await submitGeminiQuery(
        textToSubmit,
        // Send history minus the placeholder
        messages.map(m => ({ role: m.role, parts: m.parts })),
        (chunk: string) => {
          streamedResponse += chunk;
          setMessages(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = {
              role: 'model',
              parts: [{ text: streamedResponse }]
            };
            return newHistory;
          });
        }
      );
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      // Remove placeholder on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobile FAB */}
      <button 
        className="fixed lg:hidden bottom-20 right-4 w-14 h-14 bg-accentCoral text-pureBlack rounded-full shadow-xl flex items-center justify-center z-50 transition-transform active:scale-95"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Container */}
      <div className={`
        fixed inset-0 z-50 bg-surface flex flex-col transition-transform duration-300
        lg:relative lg:inset-auto lg:h-[600px] lg:w-full lg:max-w-md lg:rounded-xl lg:border lg:border-borderSecondary lg:translate-y-0
        ${isOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
      `}>
        {/* Header */}
        <div className="h-14 border-b border-borderSecondary flex items-center justify-between px-4 bg-[#11151a]">
          <div className="flex items-center gap-2 text-textPrimary">
            <Sparkles className="w-5 h-5 text-accentCoral" />
            <h3 className="font-bold text-sm tracking-wide">VENUE ASSISTANT</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-textSecondary hover:text-textPrimary bg-transparent rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accentCoral">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-accentCoral text-pureBlack rounded-tr-sm font-medium' 
                  : 'bg-borderSecondary text-textPrimary rounded-tl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.parts[0].text}</p>
              </div>
            </div>
          ))}
          {isLoading && !messages[messages.length - 1]?.parts[0]?.text && (
            <div className="flex justify-start">
              <div className="bg-borderSecondary text-textPrimary p-3 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-5 h-5 animate-spin text-accentCoral" />
              </div>
            </div>
          )}
          {error && (
            <div className="text-center">
              <span className="text-xs text-accentCoral bg-accentCoral/10 px-2 py-1 rounded">
                {error}
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {quickChips.map((chip, i) => (
             <button
               key={i}
               onClick={() => handleSubmit(chip)}
               disabled={isLoading}
               className="whitespace-nowrap flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-borderSecondary text-textSecondary hover:text-textPrimary hover:border-accentCoral transition-colors disabled:opacity-50"
             >
               {chip}
             </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-borderSecondary bg-[#11151a]">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }}
            className="flex relative items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about the venue..."
              maxLength={500}
              className="w-full bg-pureBlack border border-borderSecondary rounded-full pl-4 pr-12 py-3 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-accentCoral focus:ring-1 focus:ring-accentCoral transition-all"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 p-2 bg-accentCoral text-pureBlack rounded-full disabled:bg-borderSecondary disabled:text-textSecondary transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
