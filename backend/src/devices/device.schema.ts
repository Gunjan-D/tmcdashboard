import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

export enum DeviceType {
  TRAFFIC_SIGNAL = 'TRAFFIC_SIGNAL',
  CCTV_CAMERA = 'CCTV_CAMERA',
  DMS = 'DMS',             // Dynamic Message Sign (Variable Message Sign)
  RAMP_METER = 'RAMP_METER',
  WEATHER_STATION = 'WEATHER_STATION',
  VEHICLE_DETECTOR = 'VEHICLE_DETECTOR',
  WRONG_WAY_SENSOR = 'WRONG_WAY_SENSOR',
  BLUETOOTH_READER = 'BLUETOOTH_READER',
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  DEGRADED = 'DEGRADED',   // Partial functionality
  MAINTENANCE = 'MAINTENANCE',
  UNKNOWN = 'UNKNOWN',
}

/** ITS device record – stored in MongoDB, status refreshed via SNMP polling. */
@Schema({ timestamps: true, collection: 'devices' })
export class Device {
  @Prop({ required: true, unique: true })
  deviceId: string; // e.g. CCTV-I95-042-NB

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: DeviceType })
  type: DeviceType;

  @Prop({ required: true, enum: DeviceStatus, default: DeviceStatus.UNKNOWN })
  status: DeviceStatus;

  @Prop({ required: true })
  location: string;

  @Prop({ type: Object })
  coordinates: { lat: number; lng: number };

  @Prop({ required: true })
  ipAddress: string; // SNMP target

  @Prop({ default: '161' })
  snmpPort: string;

  @Prop({ default: 'public' })
  snmpCommunity: string; // Read-only community string

  /** Last SNMP poll result – raw OID values stored as key-value pairs. */
  @Prop({ type: Object, default: {} })
  snmpStatus: Record<string, string>;

  @Prop({ type: Date })
  lastPolledAt?: Date;

  @Prop({ type: Number, default: 0 })
  failureCount: number; // Consecutive SNMP failures

  @Prop()
  firmwareVersion?: string;

  @Prop()
  manufacturer?: string;

  @Prop({ default: true })
  monitoringEnabled: boolean;

  @Prop({ type: [Object], default: [] })
  maintenanceLogs: { date: Date; technician: string; notes: string }[];
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
DeviceSchema.index({ status: 1, type: 1 });
DeviceSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
