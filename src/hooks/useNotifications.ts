import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../services/firebase';

export function useNotifications() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        if (!messaging) return;
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Token will be generated using VAPID key in a real app, here we just log
          // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
          // console.log('FCM Token:', token);
        }
      } catch (err) {
        console.error('Notification permission completely denied', err);
      }
    };

    setupNotifications();

    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // Handle foreground notifications (e.g. toast)
        if (payload.notification) {
          alert(`${payload.notification.title}: ${payload.notification.body}`);
        }
      });
      return () => unsubscribe();
    }
  }, []);
}
