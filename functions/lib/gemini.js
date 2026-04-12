"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiProxy = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
exports.geminiProxy = (0, https_1.onRequest)({ cors: true, maxInstances: 10 }, async (req, res) => {
    var _a, e_1, _b, _c;
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
            }
            else {
                const data = doc.data();
                if (now - data.windowStart > 60000) {
                    // Reset window
                    transaction.set(rateLimitRef, { count: 1, windowStart: now });
                }
                else if (data.count >= 20) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }
                else {
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
        const genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const systemPrompt = `You are the Omni-Director AI for Roarboard, a Smart Venue Experience Platform.
Current digital twin state: ${JSON.stringify(venueData)}.

CORE Directives:
1. Ground truth lies in 'trend' and 'rate' metrics. If density is 'increasing' rapidly, aggressively reroute away from it.
2. Gamify behavior: Encourage users to take optimal routes for points (e.g., 'Take route to Gate B for 20 points').
3. You control the UI. If a user asks for directions, DO NOT just give text. You MUST emit a command at the end of your message to draw the route. 
Format exactly like this: <ACTION>DRAW_ROUTE=[StartNode]=>[Node2]=>[EndNode]</ACTION>
Valid nodes: GateA, GateB, GateC, GateD, North1, South1, East1, West1, ConcourseW, ConcourseE, CenterField.
Example: 'Routing you through the East Concourse.<ACTION>DRAW_ROUTE=East1=>ConcourseE=>GateB</ACTION>'

Always provide explainability logic (e.g., 'because it is 5 mins faster and trend is decreasing').`;
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
        try {
            for (var _d = true, _e = __asyncValues(result.stream), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const chunk = _c;
                const chunkText = chunk.text();
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    }
    catch (err) {
        if (err.message === 'RATE_LIMIT_EXCEEDED') {
            res.status(429).send('Rate limit exceeded');
        }
        else {
            console.error("Gemini Error:", err);
            // Ensure headers wasn't already sent before returning 500
            if (!res.headersSent) {
                res.status(500).send('Internal server error');
            }
            else {
                res.write(`data: ${JSON.stringify({ error: 'Internal error during stream' })}\n\n`);
                res.end();
            }
        }
    }
});
//# sourceMappingURL=gemini.js.map