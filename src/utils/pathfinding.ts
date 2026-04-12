import { useVenueStore } from '../store/useVenueStore';

export type NodeId = 
  | 'GateA' | 'GateB' | 'GateC' | 'GateD'
  | 'North1' | 'South1' | 'East1' | 'West1'
  | 'CenterField' | 'ConcourseW' | 'ConcourseE';

export interface RouteOptions {
  requiresAccessible?: boolean;
  isEmergency?: boolean;
}

// Fixed adjacencies modeling stadium SVG paths
const venueGraph: Record<NodeId, { to: NodeId; baseCost: number; isStairs?: boolean; flowPenaltyTo?: number }[]> = {
  GateA: [{ to: 'ConcourseW', baseCost: 5 }],
  GateB: [{ to: 'ConcourseE', baseCost: 5 }],
  GateC: [{ to: 'ConcourseW', baseCost: 8, isStairs: true }, { to: 'North1', baseCost: 10 }],
  GateD: [{ to: 'ConcourseE', baseCost: 4 }],
  ConcourseW: [{ to: 'West1', baseCost: 3 }, { to: 'North1', baseCost: 8 }, { to: 'GateA', baseCost: 5 }, { to: 'GateC', baseCost: 8, isStairs: true }],
  ConcourseE: [{ to: 'East1', baseCost: 3 }, { to: 'South1', baseCost: 8 }, { to: 'GateB', baseCost: 5 }, { to: 'GateD', baseCost: 4 }],
  West1: [{ to: 'ConcourseW', baseCost: 3 }, { to: 'CenterField', baseCost: 15 }],
  East1: [{ to: 'ConcourseE', baseCost: 3 }, { to: 'CenterField', baseCost: 15 }],
  North1: [{ to: 'ConcourseW', baseCost: 8 }, { to: 'CenterField', baseCost: 12 }, { to: 'GateC', baseCost: 10 }],
  South1: [{ to: 'ConcourseE', baseCost: 8 }, { to: 'CenterField', baseCost: 12 }],
  CenterField: [{ to: 'North1', baseCost: 12 }, { to: 'South1', baseCost: 12 }, { to: 'East1', baseCost: 15 }, { to: 'West1', baseCost: 15 }]
};

// Extrapolate density to a normalized penalty multiplier (1.0 to 3.0)
function getDensityPenalty(nodeId: NodeId): number {
  const store = useVenueStore.getState();
  
  // Map graph nodes to store sections
  const sectionMap: Record<string, string> = {
    'North1': 'n1', 'South1': 's1', 'East1': 'e1', 'West1': 'w1'
  };
  
  const sKey = sectionMap[nodeId];
  if (sKey && store.sections[sKey]) {
    const d = store.sections[sKey].density;
    // Exponential penalty if > 80%
    if (d > 95) return 3.5;
    if (d > 80) return 2.0;
    if (d > 60) return 1.5;
  }
  return 1.0;
}

// Extrapolate gate wait to cost penalty
function getWaitPenalty(nodeId: NodeId): number {
  const store = useVenueStore.getState();
  const gateMap: Record<string, string> = {
    'GateA': 'gA', 'GateB': 'gB', 'GateC': 'gC', 'GateD': 'gD'
  };
  
  const gKey = gateMap[nodeId];
  if (gKey && store.gates[gKey]) {
    return store.gates[gKey].waitMinutes * 0.5; // Every minute adds 0.5 cost
  }
  return 0;
}

export function calculateOptimalRoute(start: NodeId, end: NodeId, options?: RouteOptions): NodeId[] {
  const distances: Record<string, number> = {};
  const previous: Record<string, NodeId | null> = {};
  const unvisited = new Set<NodeId>();

  for (const node of Object.keys(venueGraph) as NodeId[]) {
    distances[node] = Infinity;
    previous[node] = null;
    unvisited.add(node);
  }
  distances[start] = 0;

  while (unvisited.size > 0) {
    let closestNode: NodeId | null = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        closestNode = node;
      }
    }

    if (!closestNode || minDistance === Infinity) break;
    if (closestNode === end) break;

    unvisited.delete(closestNode);

    const neighbors = venueGraph[closestNode];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.to)) continue;

      // 1. Accessibility Logic Override
      if (options?.requiresAccessible && neighbor.isStairs) continue; // Route impassable

      // 2. Base Matrix Geometry Cost
      let cost = neighbor.baseCost;

      // 3. Density Frictions
      if (!options?.isEmergency) {
        cost *= getDensityPenalty(neighbor.to);
        cost += getWaitPenalty(neighbor.to);
      }

      // 4. Flow direction penalty (Anti-Current)
      if (neighbor.flowPenaltyTo && !options?.isEmergency) {
         cost += neighbor.flowPenaltyTo;
      }

      const totalDistance = distances[closestNode] + cost;
      if (totalDistance < distances[neighbor.to]) {
        distances[neighbor.to] = totalDistance;
        previous[neighbor.to] = closestNode;
      }
    }
  }

  // Construct path string
  const path: NodeId[] = [];
  let curr: NodeId | null = end;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return path.length > 0 && path[0] === start ? path : [];
}
