import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument, IncidentStatus } from './incident.schema';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidentFilterDto,
} from './incident.dto';
import { TmcGateway } from '../gateway/tmc.gateway';

let incidentCounter = 1000;

@Injectable()
export class IncidentService {
  private readonly logger = new Logger(IncidentService.name);

  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    private readonly tmcGateway: TmcGateway,
  ) {}

  /** Create a new incident and broadcast via WebSocket to all connected TMC operators. */
  async create(dto: CreateIncidentDto): Promise<IncidentDocument> {
    const incidentId = `TMC-${new Date().getFullYear()}-${String(++incidentCounter).padStart(5, '0')}`;

    const incident = new this.incidentModel({
      ...dto,
      incidentId,
      detectedAt: new Date(),
      timeline: [
        {
          timestamp: new Date(),
          action: 'Incident created / detected',
          operator: dto.reportedBy,
        },
      ],
    });

    const saved = await incident.save();
    this.logger.log(`New incident created: ${incidentId} [${dto.type}] at ${dto.location}`);

    // Push real-time notification to all TMC operators via WebSocket
    this.tmcGateway.broadcastIncidentUpdate('incident:created', saved.toObject());

    return saved;
  }

  /** Paginated, filtered list of incidents. */
  async findAll(filter: IncidentFilterDto): Promise<{
    data: IncidentDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const query: Record<string, unknown> = {};

    if (filter.status) query.status = filter.status;
    if (filter.severity) query.severity = filter.severity;
    if (filter.type) query.type = filter.type;

    if (filter.dateFrom || filter.dateTo) {
      query.detectedAt = {};
      if (filter.dateFrom) (query.detectedAt as Record<string, unknown>).$gte = new Date(filter.dateFrom);
      if (filter.dateTo) (query.detectedAt as Record<string, unknown>).$lte = new Date(filter.dateTo);
    }

    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100); // cap at 100
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.incidentModel.find(query).sort({ detectedAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.incidentModel.countDocuments(query).exec(),
    ]);

    return { data: data as IncidentDocument[], total, page, pages: Math.ceil(total / limit) };
  }

  /** Find a single incident by its human-readable ID (e.g. TMC-2026-01000). */
  async findOne(incidentId: string): Promise<IncidentDocument> {
    const incident = await this.incidentModel.findOne({ incidentId }).lean().exec();
    if (!incident) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }
    return incident as IncidentDocument;
  }

  /** Update incident fields; appends timeline entry when status changes. */
  async update(incidentId: string, dto: UpdateIncidentDto): Promise<IncidentDocument> {
    const existing = await this.incidentModel.findOne({ incidentId }).exec();
    if (!existing) {
      throw new NotFoundException(`Incident ${incidentId} not found`);
    }

    const updateSet: Record<string, unknown> = { ...dto };
    delete updateSet['timelineNote'];
    delete updateSet['operator'];

    const timelineEntry = {
      timestamp: new Date(),
      action: dto.timelineNote ?? `Status updated to ${dto.status ?? existing.status}`,
      operator: dto.operator ?? 'system',
    };

    // Auto-set resolvedAt when transitioning to RESOLVED
    if (dto.status === IncidentStatus.RESOLVED && existing.status !== IncidentStatus.RESOLVED) {
      updateSet.resolvedAt = new Date();
    }

    const updated = await this.incidentModel.findOneAndUpdate(
      { incidentId },
      {
        $set: updateSet,
        $push: { timeline: timelineEntry },
      },
      { new: true, lean: true },
    ).exec();

    if (!updated) throw new NotFoundException(`Incident ${incidentId} not found after update`);

    this.logger.log(`Incident ${incidentId} updated – status: ${updated.status}`);
    this.tmcGateway.broadcastIncidentUpdate('incident:updated', updated);

    return updated as IncidentDocument;
  }

  /** Soft-delete by closing an incident (TMC policy: never hard-delete). */
  async close(incidentId: string, operator: string): Promise<IncidentDocument> {
    return this.update(incidentId, {
      status: IncidentStatus.CLOSED,
      timelineNote: 'Incident administratively closed',
      operator,
    });
  }

  /** Dashboard summary – active counts by severity + recent activity. */
  async getDashboardSummary() {
    const [activeByType, bySeverity, recentResolved] = await Promise.all([
      this.incidentModel.aggregate([
        { $match: { status: { $in: [IncidentStatus.OPEN, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS] } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.incidentModel.aggregate([
        { $match: { status: { $nin: [IncidentStatus.CLOSED, IncidentStatus.RESOLVED] } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      this.incidentModel
        .find({ status: IncidentStatus.RESOLVED })
        .sort({ resolvedAt: -1 })
        .limit(5)
        .lean()
        .exec(),
    ]);

    return { activeByType, bySeverity, recentResolved };
  }
}
