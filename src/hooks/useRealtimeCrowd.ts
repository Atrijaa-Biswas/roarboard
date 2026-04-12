import { useEffect, useRef } from 'react';
import { useVenueStore } from '../store/useVenueStore';
import { useAlertStore } from '../store/useAlertStore';

export function useRealtimeCrowd() {
  const setSections = useVenueStore((state) => state.setSections);
  const setGates   = useVenueStore((state) => state.setGates);
  const setTicker  = useVenueStore((state) => state.setTicker);
  const addAlert   = useAlertStore((state) => state.addAlert);

  // Track which thresholds have already fired to prevent alert spam
  const alreadyAlerted = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // ── 1. Crowd Density Simulation ──────────────────────────────────────
      const currentSections = useVenueStore.getState().sections;
      const newSections: Record<string, any> = {};

      for (const [id, section] of Object.entries(currentSections)) {
        const drift = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newDensity = Math.max(0, Math.min(100, section.density + drift));
        const newCount = Math.round((newDensity / 100) * section.capacity);
        newSections[id] = { density: newDensity, currentCount: newCount, updatedAt: now };

        // Auto-alert: Critical capacity threshold
        if (newDensity >= 90 && !alreadyAlerted.current.has(`density-crit-${id}`)) {
          alreadyAlerted.current.add(`density-crit-${id}`);
          addAlert({
            title: `Critical: ${section.name} at ${newDensity}% capacity`,
            body: `${section.name} is critically overcrowded. Immediate diversion recommended.`,
            severity: 'critical',
            source: 'system',
          });
          // Clear flag after 60s so it can re-alert if still elevated
          setTimeout(() => alreadyAlerted.current.delete(`density-crit-${id}`), 60000);
        }
      }
      setSections(newSections);

      // ── 2. Gate Wait Time Simulation ─────────────────────────────────────
      const currentGates = useVenueStore.getState().gates;
      const newGates: Record<string, any> = {};

      for (const [id, gate] of Object.entries(currentGates)) {
        const drift = Math.floor(Math.random() * 5) - 2; // -2 to +2 minutes
        const newWait = Math.max(0, gate.waitMinutes + drift);
        const newStatus = newWait > 30 ? 'high' : newWait > 15 ? 'medium' : 'low';
        newGates[id] = { waitMinutes: newWait, status: newStatus, updatedAt: now };

        // Auto-alert: Gate becoming very congested
        if (newWait > 35 && !alreadyAlerted.current.has(`gate-high-${id}`)) {
          alreadyAlerted.current.add(`gate-high-${id}`);
          addAlert({
            title: `${gate.name} – High Wait Time`,
            body: `Wait time at ${gate.name} has reached ${newWait} minutes. Consider Gate B or D as alternatives.`,
            severity: 'warning',
            source: 'system',
          });
          setTimeout(() => alreadyAlerted.current.delete(`gate-high-${id}`), 120000);
        }
      }
      setGates(newGates);

      // ── 3. Dynamic Ticker Updates (every 5 intervals ≈ 15s) ───────────────
      if (Math.random() < 0.2) {
        const gates = Object.values(useVenueStore.getState().gates)
          .sort((a, b) => a.waitMinutes - b.waitMinutes);
        const best = gates[0];
        const worst = gates[gates.length - 1];
        if (best && worst) {
          setTicker([
            { text: `Best entry: ${best.name} – only ${Math.round(best.waitMinutes)} min wait.`, priority: 1, createdAt: now },
            { text: `Avoid ${worst.name} – ${Math.round(worst.waitMinutes)} min wait. Seek alternate entry.`, priority: 2, createdAt: now },
            { text: 'Welcome to RoarBoard! Secure, Smart, Instantly Responsive.', priority: 3, createdAt: now },
          ]);
        }
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [setSections, setGates, setTicker, addAlert]);
}
