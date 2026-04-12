import { useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useVenueStore } from '../store/useVenueStore';

export function useRealtimeCrowd() {
  const setSections = useVenueStore((state) => state.setSections);

  useEffect(() => {
    const sectionsRef = ref(rtdb, 'venue/sections');
    
    const unsubscribe = onValue(sectionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSections(data);
      }
    });

    return () => unsubscribe();
  }, [setSections]);
}
