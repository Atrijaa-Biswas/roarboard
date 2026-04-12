import * as admin from 'firebase-admin';
import { simulateData } from './simulator';
import { geminiProxy } from './gemini';

// Only init if not already initialized to prevent errors during hot-reloads/test
if (!admin.apps.length) {
    admin.initializeApp();
}

export {
    simulateData,
    geminiProxy
};
