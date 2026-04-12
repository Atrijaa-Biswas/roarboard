import { analytics, perf } from './firebase';
import { logEvent } from 'firebase/analytics';
import { trace } from 'firebase/performance';

// GA4 Tracking
export const logCustomEvent = (eventName: string, params?: Record<string, any>) => {
    if (analytics) {
        logEvent(analytics, eventName, params);
    }
}

// Performance Traces
export const startTrace = (traceName: string) => {
    if (!perf) return null;
    const t = trace(perf, traceName);
    t.start();
    return t;
}
