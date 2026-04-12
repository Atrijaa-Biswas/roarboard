import { useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useVenueStore } from '../store/useVenueStore';

export function useTickerUpdates() {
  const setTicker = useVenueStore((state) => state.setTicker);

  useEffect(() => {
    const tickerRef = ref(rtdb, 'venue/ticker');
    
    const unsubscribe = onValue(tickerRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data)) {
        setTicker(data);
      }
    });

    return () => unsubscribe();
  }, [setTicker]);
}
