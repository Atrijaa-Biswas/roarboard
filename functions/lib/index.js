"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiProxy = exports.simulateData = void 0;
const admin = require("firebase-admin");
const simulator_1 = require("./simulator");
Object.defineProperty(exports, "simulateData", { enumerable: true, get: function () { return simulator_1.simulateData; } });
const gemini_1 = require("./gemini");
Object.defineProperty(exports, "geminiProxy", { enumerable: true, get: function () { return gemini_1.geminiProxy; } });
// Only init if not already initialized to prevent errors during hot-reloads/test
if (!admin.apps.length) {
    admin.initializeApp();
}
//# sourceMappingURL=index.js.map