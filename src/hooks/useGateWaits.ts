import { useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useVenueStore } from '../store/useVenueStore';

export function useGateWaits() {
  const setGates = useVenueStore((state) => state.setGates);

  useEffect(() => {
    const gatesRef = ref(rtdb, 'venue/gates');
    
    const unsubscribe = onValue(gatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGates(data);
      }
    });

    return () => unsubscribe();
  }, [setGates]);
}
