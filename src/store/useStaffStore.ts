import { create } from 'zustand';

export type IncidentType  = 'medical' | 'crowd_surge' | 'technical' | 'security' | 'fire';
export type IncidentStatus = 'active' | 'in_progress' | 'resolved';
export type LogCategory   = 'deploy' | 'alert' | 'incident' | 'resolve' | 'announce' | 'ai' | 'sys' | 'toggle';

export interface Incident {
  id: string;
  type: IncidentType;
  zone: string;
  description: string;
  status: IncidentStatus;
  assignedTo: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
}

export interface ActionLogEntry {
  id: string;
  timestamp: number;
  category: LogCategory;
  message: string;
}

interface StaffState {
  incidents: Incident[];
  actionLog: ActionLogEntry[];
  staffDeployments: Record<string, number>;

  createIncident:      (data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIncidentStatus:(id: string, status: IncidentStatus) => void;
  assignIncident:      (id: string, assignedTo: string) => void;
  logAction:           (category: LogCategory, message: string) => void;
  deployStaffToZone:   (zone: string, count: number) => void;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Typed helper — guarantees category is narrowed correctly
function entry(category: LogCategory, message: string): ActionLogEntry {
  return { id: uid(), timestamp: Date.now(), category, message };
}

const INITIAL_LOG: ActionLogEntry[] = [
  entry('ai',       'AI Director flagged East 1 density at 95% — diversion recommended.'),
  entry('alert',    'System auto-alert: Gate C wait time exceeded 30 minutes.'),
  entry('incident', 'Incident created: crowd_surge at East 1.'),
];

export const useStaffStore = create<StaffState>((set) => ({

  incidents: [
    {
      id: uid(),
      type:        'crowd_surge',
      zone:        'East 1',
      description: 'Rapid density increase in East stand corridor. Crowd management required.',
      status:      'active',
      assignedTo:  'Unassigned',
      createdAt:   Date.now() - 300000,
      updatedAt:   Date.now() - 300000,
    },
  ],

  actionLog: INITIAL_LOG,

  staffDeployments: {
    gA: 2, gB: 3, gC: 1, gD: 2, gE: 1, gF: 4,
    n1: 5, s1: 3, e1: 2, w1: 4,
  },

  // ── Actions ──────────────────────────────────────────────────────────────

  createIncident: (data) =>
    set((state) => ({
      incidents: [
        { ...data, id: uid(), createdAt: Date.now(), updatedAt: Date.now() },
        ...state.incidents,
      ],
      actionLog: [
        entry('incident', `Incident created: ${data.type.replace('_', ' ')} at ${data.zone}${data.assignedTo !== 'Unassigned' ? ` — assigned to ${data.assignedTo}` : ''}.`),
        ...state.actionLog,
      ].slice(0, 100),
    })),

  updateIncidentStatus: (id, status) =>
    set((state) => {
      const inc = state.incidents.find(i => i.id === id);
      const cat: LogCategory = status === 'resolved' ? 'resolve' : 'incident';
      return {
        incidents: state.incidents.map(i =>
          i.id === id
            ? { ...i, status, updatedAt: Date.now(), resolvedAt: status === 'resolved' ? Date.now() : i.resolvedAt }
            : i
        ),
        actionLog: [
          entry(cat, `Incident ${status.replace('_', ' ')}: ${inc?.type?.replace('_', ' ') ?? ''} at ${inc?.zone ?? ''}.`),
          ...state.actionLog,
        ].slice(0, 100),
      };
    }),

  assignIncident: (id, assignedTo) =>
    set((state) => {
      const inc = state.incidents.find(i => i.id === id);
      return {
        incidents: state.incidents.map(i =>
          i.id === id ? { ...i, assignedTo, updatedAt: Date.now() } : i
        ),
        actionLog: [
          entry('incident', `Incident at ${inc?.zone ?? ''} assigned to ${assignedTo}.`),
          ...state.actionLog,
        ].slice(0, 100),
      };
    }),

  logAction: (category, message) =>
    set((state) => ({
      actionLog: [entry(category, message), ...state.actionLog].slice(0, 100),
    })),

  deployStaffToZone: (zone, count) =>
    set((state) => {
      const current = state.staffDeployments[zone] ?? 0;
      return {
        staffDeployments: { ...state.staffDeployments, [zone]: current + count },
        actionLog: [
          entry('deploy', `${count} staff deployed to ${zone}. Total on-site: ${current + count}.`),
          ...state.actionLog,
        ].slice(0, 100),
      };
    }),
}));
