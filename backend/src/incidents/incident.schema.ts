import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IncidentDocument = HydratedDocument<Incident>;

export enum IncidentSeverity {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum IncidentType {
  ACCIDENT = 'ACCIDENT',
  CONGESTION = 'CONGESTION',
  ROAD_CLOSURE = 'ROAD_CLOSURE',
  WEATHER = 'WEATHER',
  DEBRIS = 'DEBRIS',
  SIGNAL_FAILURE = 'SIGNAL_FAILURE',
  CONSTRUCTION = 'CONSTRUCTION',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

/** MongoDB document schema for a traffic incident. */
@Schema({ timestamps: true, collection: 'incidents' })
export class Incident {
  @Prop({ required: true, unique: true })
  incidentId: string; // e.g. TMC-2026-00142

  @Prop({ required: true, enum: IncidentType })
  type: IncidentType;

  @Prop({ required: true, enum: IncidentSeverity, default: IncidentSeverity.MODERATE })
  severity: IncidentSeverity;

  @Prop({ required: true, enum: IncidentStatus, default: IncidentStatus.OPEN })
  status: IncidentStatus;

  @Prop({ required: true })
  location: string; // human-readable, e.g. "I-95 NB MM 42.3 near Smyrna, DE"

  @Prop({ type: Object })
  coordinates: { lat: number; lng: number }; // GeoJSON-compatible lat/lng

  @Prop({ required: true })
  description: string;

  @Prop()
  responderUnit?: string;

  @Prop({ type: [String], default: [] })
  affectedLanes: string[];

  @Prop({ type: Number })
  estimatedClearanceMinutes?: number;

  @Prop({ type: [Object], default: [] })
  timeline: { timestamp: Date; action: string; operator: string }[];

  @Prop()
  reportedBy: string; // operator or external source (CCTV, 911, VSP)

  @Prop({ type: Date })
  detectedAt: Date;

  @Prop({ type: Date })
  resolvedAt?: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

// Compound index to support common TMC queries
IncidentSchema.index({ status: 1, severity: -1 });
IncidentSchema.index({ detectedAt: -1 });
IncidentSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
