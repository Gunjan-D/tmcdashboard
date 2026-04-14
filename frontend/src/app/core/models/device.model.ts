// ── ITS Device models ────────────────────────────────────────

export type DeviceType =
  | 'TRAFFIC_SIGNAL' | 'CCTV_CAMERA' | 'DMS' | 'RAMP_METER'
  | 'WEATHER_STATION' | 'VEHICLE_DETECTOR' | 'WRONG_WAY_SENSOR' | 'BLUETOOTH_READER';

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'MAINTENANCE' | 'UNKNOWN';

export interface Device {
  _id?: string;
  deviceId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  coordinates?: { lat: number; lng: number };
  ipAddress: string;
  snmpPort?: string;
  snmpCommunity?: string;
  snmpStatus?: Record<string, string>;
  lastPolledAt?: string;
  failureCount?: number;
  firmwareVersion?: string;
  manufacturer?: string;
  monitoringEnabled: boolean;
}

export interface DeviceHealthStat {
  _id: DeviceStatus;
  count: number;
}

export interface DeviceAlert {
  deviceId: string;
  name: string;
  status: DeviceStatus;
  location: string;
  timestamp: string;
}
