import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const geminiProxy = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { message, history, venueData, sessionId } = req.body;
    
    if (!sessionId) {
      res.status(401).send('Missing session ID');
      return;
    }

    // Rate Limiting
    const db = admin.firestore();
    const rateLimitRef = db.collection('rate_limits').doc(sessionId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const now = Date.now();
      
      if (!doc.exists) {
        transaction.set(rateLimitRef, { count: 1, windowStart: now });
      } else {
        const data = doc.data()!;
        if (now - data.windowStart > 60000) {
          // Reset window
          transaction.set(rateLimitRef, { count: 1, windowStart: now });
        } else if (data.count >= 20) {
          throw new Error('RATE_LIMIT_EXCEEDED');
        } else {
          transaction.update(rateLimitRef, { count: data.count + 1 });
        }
      }
    });

    // Sanitisation
    const sanitizedMsg = String(message || '').replace(/<[^>]*>?/gm, '').trim().substring(0, 500);
    
    if (!sanitizedMsg) {
       res.status(400).send('Empty message');
       return;
    }

    const API_KEY = process.env.GEMINI_API_KEY || ''; // Firebase Gen2 automatically pulls from .env
    if (!API_KEY) {
       res.status(500).send('Server configuration error');
       return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const systemPrompt = `You are a helpful assistant for Roarboard, a Smart Venue Experience Platform. 
    Current live venue data: ${JSON.stringify(venueData)}.
    Keep responses brief, helpful, and reference the live wait times or crowd densities if relevant.`;

    // Initialize chat with system prompt
    const chat = model.startChat({
      history: history || [],
      systemInstruction: systemPrompt,
    });

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await chat.sendMessageStream(sanitizedMsg);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err: any) {
    if (err.message === 'RATE_LIMIT_EXCEEDED') {
      res.status(429).send('Rate limit exceeded');
    } else {
      console.error("Gemini Error:", err);
      // Ensure headers wasn't already sent before returning 500
      if (!res.headersSent) {
          res.status(500).send('Internal server error');
      } else {
          res.write(`data: ${JSON.stringify({ error: 'Internal error during stream' })}\n\n`);
          res.end();
      }
    }
  }
});
