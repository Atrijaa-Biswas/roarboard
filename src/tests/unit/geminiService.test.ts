import { describe, it, expect, vi } from 'vitest';
import { submitGeminiQuery } from '../../services/geminiService';

globalThis.fetch = vi.fn();

describe('geminiService: submitGeminiQuery', () => {
  it('should format payload correctly and handle successful streams', async () => {
    const mockResponse = new Response(
        new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode('data: {"text": "hello"}\n\n'));
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                controller.close();
            }
        })
    );
    (globalThis.fetch as any).mockResolvedValue(mockResponse);

    let result = '';
    await submitGeminiQuery('Hi', [], (chunk) => { result += chunk; });
    expect(result).toBe('hello');
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('geminiProxy'), expect.any(Object));
  });

  it('should handle 429 rate limits', async () => {
    (globalThis.fetch as any).mockResolvedValue({ ok: false, status: 429 });
    
    await expect(submitGeminiQuery('Hi', [], () => {})).rejects.toThrow("You've reached the API limit. Please try again in a minute.");
  });
});
