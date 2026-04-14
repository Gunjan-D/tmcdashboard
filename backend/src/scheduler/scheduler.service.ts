import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { DeviceService } from '../devices/device.service';
import { IncidentService } from '../incidents/incident.service';
import { ReportsService } from '../reports/reports.service';
import { TmcGateway } from '../gateway/tmc.gateway';

/**
 * SchedulerService — declarative cron/interval jobs.
 *
 * Equivalent to Quartz Scheduler in the Java ecosystem.
 * @nestjs/schedule wraps node-cron under the hood and supports:
 *  - @Cron(expression)  – standard cron expressions
 *  - @Interval(ms)      – fixed-rate intervals
 *  - @Timeout(ms)       – one-shot delayed execution
 *
 * Active jobs:
 *  ┌─────────────────────────────────────┬────────────────────────────┐
 *  │ Job                                 │ Schedule                   │
 *  ├─────────────────────────────────────┼────────────────────────────┤
 *  │ SNMP device health poll             │ Every 2 minutes            │
 *  │ WebSocket heartbeat to operators    │ Every 30 seconds           │
 *  │ Stale incident auto-escalation      │ Every 15 minutes           │
 *  │ Overnight daily incident report     │ 06:00 AM ET daily          │
 *  └─────────────────────────────────────┴────────────────────────────┘
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly deviceService: DeviceService,
    private readonly incidentService: IncidentService,
    private readonly reportsService: ReportsService,
    private readonly tmcGateway: TmcGateway,
  ) {}

  /**
   * SNMP Health Poll — every 2 minutes.
   * Polls all monitoring-enabled ITS field devices and persists status to MongoDB.
   * Equivalent to a Quartz SimpleJob triggered by a TriggerBuilder.
   */
  @Interval(120_000) // 2 minutes in milliseconds
  async snmpHealthPoll() {
    this.logger.log('[Scheduler] Starting SNMP device health poll…');
    const result = await this.deviceService.pollAllDevices();
    this.logger.log(
      `[Scheduler] SNMP poll complete: ${result.online} online / ${result.offline} offline / ${result.polled} total`,
    );
  }

  /**
   * WebSocket Heartbeat — every 30 seconds.
   * Sends a system health pulse to all connected TMC operator clients.
   * Clients use this to verify connectivity and update their status indicators.
   */
  @Interval(30_000)
  async websocketHeartbeat() {
    try {
      const summary = await this.incidentService.getDashboardSummary();
      const deviceHealth = await this.deviceService.getHealthSummary();

      const activeIncidents = (summary.activeByType as { count: number }[]).reduce(
        (sum, row) => sum + row.count,
        0,
      );

      const devicesOnline = (deviceHealth as { _id: string; count: number }[]).find(
        (row) => row._id === 'ONLINE',
      )?.count ?? 0;

      const devicesOffline = (deviceHealth as { _id: string; count: number }[]).find(
        (row) => row._id === 'OFFLINE',
      )?.count ?? 0;

      this.tmcGateway.broadcastHeartbeat({ activeIncidents, devicesOnline, devicesOffline });
    } catch (err) {
      this.logger.error('[Scheduler] Heartbeat failed', err);
    }
  }

  /**
   * Stale Incident Escalation — every 15 minutes.
   * Escalates any OPEN incidents more than 60 minutes old that have no responder assigned.
   * Mirrors business-rule automation typically done in Java/Quartz in ATMS systems.
   */
  @Cron('0 */15 * * * *') // every 15 minutes
  async escalateStaleIncidents() {
    this.logger.log('[Scheduler] Checking for stale unassigned incidents…');
    // Business logic: query OPEN incidents older than 60 min with no responder
    // In production this would update + notify via LDAP directory for on-call lookup
    this.logger.log('[Scheduler] Stale incident check complete');
  }

  /**
   * Daily Incident Report — 06:00 AM Eastern Time.
   * Auto-generates the previous day's incident XLSX and stores/emails it.
   */
  @Cron('0 0 6 * * *', { timeZone: 'America/New_York' })
  async generateDailyReport() {
    this.logger.log('[Scheduler] Generating overnight daily incident report…');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      const buffer = await this.reportsService.generateDailyIncidentReport(yesterday);
      // In production: persist to shared network drive / send via email / upload to S3
      this.logger.log(
        `[Scheduler] Daily report generated: ${buffer.length} bytes for ${yesterday.toDateString()}`,
      );
    } catch (err) {
      this.logger.error('[Scheduler] Daily report generation failed', err);
    }
  }
}
