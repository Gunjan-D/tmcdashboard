// ── Incident models ─────────────────────────────────────────

export type IncidentType =
  | 'ACCIDENT' | 'CONGESTION' | 'ROAD_CLOSURE' | 'WEATHER'
  | 'DEBRIS' | 'SIGNAL_FAILURE' | 'CONSTRUCTION' | 'SPECIAL_EVENT';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type IncidentStatus =
  | 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TimelineEntry {
  timestamp: string;
  action: string;
  operator: string;
}

export interface Incident {
  _id?: string;
  incidentId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  responderUnit?: string;
  affectedLanes: string[];
  estimatedClearanceMinutes?: number;
  timeline: TimelineEntry[];
  reportedBy: string;
  detectedAt: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncidentPage {
  data: Incident[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateIncidentPayload {
  type: IncidentType;
  severity?: IncidentSeverity;
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  responderUnit?: string;
  affectedLanes?: string[];
  estimatedClearanceMinutes?: number;
  reportedBy: string;
}

export interface DashboardSummary {
  activeByType: { _id: string; count: number }[];
  bySeverity: { _id: string; count: number }[];
  recentResolved: Incident[];
}
