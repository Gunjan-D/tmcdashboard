import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Incident, IncidentDocument } from '../incidents/incident.schema';
import { Device, DeviceDocument } from '../devices/device.schema';

/**
 * ReportsService — generates XLSX reports using ExcelJS.
 *
 * Mirrors the Java poi (Apache POI) pattern requested in the job description.
 * ExcelJS is the Node.js equivalent: workbook → worksheet → styled cells → stream.
 *
 * Reports produced:
 *  1. Daily Incident Summary (XLSX)
 *  2. Device Health Report (XLSX)
 *  3. Monthly Operations Report (multi-sheet XLSX)
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  /** DE DOT brand colour palette */
  private readonly COLORS = {
    headerBg:   'FF002D72',  // Delaware DOT navy
    headerText: 'FFFFFFFF',
    criticalBg: 'FFFF0000',
    highBg:     'FFFF6600',
    moderateBg: 'FFFFC000',
    lowBg:      'FF92D050',
    offlineBg:  'FFFF0000',
    onlineBg:   'FF00B050',
    altRow:     'FFE9EFF8',
  };

  constructor(
    @InjectModel(Incident.name)
    private readonly incidentModel: Model<IncidentDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  /** Generates a Daily Incident Summary XLSX and returns it as a Buffer. */
  async generateDailyIncidentReport(date: Date = new Date()): Promise<Buffer> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const incidents = await this.incidentModel
      .find({ detectedAt: { $gte: start, $lte: end } })
      .sort({ detectedAt: 1 })
      .lean()
      .exec();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DE DOT TMC Operations';
    workbook.created = new Date();

    // ── Sheet 1: Incident List ────────────────────────────────────────────
    const sheet = workbook.addWorksheet('Daily Incidents', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    this.styleTitle(sheet, `Delaware TMC – Daily Incident Report`, `Date: ${start.toDateString()}`, 10);

    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'Incident ID',  key: 'incidentId',       width: 18 },
      { header: 'Type',         key: 'type',             width: 18 },
      { header: 'Severity',     key: 'severity',         width: 12 },
      { header: 'Status',       key: 'status',           width: 14 },
      { header: 'Location',     key: 'location',         width: 35 },
      { header: 'Description',  key: 'description',      width: 45 },
      { header: 'Reported By',  key: 'reportedBy',       width: 20 },
      { header: 'Detected At',  key: 'detectedAt',       width: 20 },
      { header: 'Resolved At',  key: 'resolvedAt',       width: 20 },
      { header: 'Duration',     key: 'duration',         width: 14 },
    ];

    sheet.getRow(3).values = columns.map((c) => c.header as string) as ExcelJS.CellValue[];
    this.styleHeaderRow(sheet.getRow(3), columns.length);
    sheet.columns = columns;

    incidents.forEach((inc: any, idx) => {
      const duration = inc.resolvedAt
        ? `${Math.round((new Date(inc.resolvedAt).getTime() - new Date(inc.detectedAt).getTime()) / 60000)} min`
        : 'Active';

      const row = sheet.addRow({
        incidentId:  inc.incidentId,
        type:        inc.type,
        severity:    inc.severity,
        status:      inc.status,
        location:    inc.location,
        description: inc.description,
        reportedBy:  inc.reportedBy,
        detectedAt:  new Date(inc.detectedAt).toLocaleString(),
        resolvedAt:  inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : '—',
        duration,
      });

      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.COLORS.altRow } };
        });
      }

      // Colour-code severity cell
      const severityCell = row.getCell('severity');
      const sevColour = {
        CRITICAL: this.COLORS.criticalBg,
        HIGH:     this.COLORS.highBg,
        MODERATE: this.COLORS.moderateBg,
        LOW:      this.COLORS.lowBg,
      }[inc.severity as string] ?? 'FFFFFFFF';

      severityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sevColour } };
      severityCell.font = { bold: true };
    });

    // ── Sheet 2: Summary Pivot ────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Summary');
    this.styleTitle(summarySheet, 'Incident Summary', `Total: ${incidents.length} incidents`, 3);

    summarySheet.getRow(3).values = ['Severity', 'Count'];
    this.styleHeaderRow(summarySheet.getRow(3), 2);

    const bySeverity = incidents.reduce((acc: Record<string, number>, i: any) => {
      acc[i.severity] = (acc[i.severity] ?? 0) + 1;
      return acc;
    }, {});

    Object.entries(bySeverity).forEach(([sev, cnt]) => {
      summarySheet.addRow([sev, cnt]);
    });

    this.logger.log(`Generated daily incident report: ${incidents.length} incidents for ${start.toDateString()}`);

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  /** Generates a Device Health XLSX report. */
  async generateDeviceHealthReport(): Promise<Buffer> {
    const devices = await this.deviceModel.find().sort({ type: 1, deviceId: 1 }).lean().exec();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Device Health', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    this.styleTitle(sheet, 'Delaware TMC – Device Health Report', `Generated: ${new Date().toLocaleString()}`, 9);

    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'Device ID',       key: 'deviceId',      width: 22 },
      { header: 'Name',            key: 'name',          width: 36 },
      { header: 'Type',            key: 'type',          width: 20 },
      { header: 'Status',          key: 'status',        width: 14 },
      { header: 'Location',        key: 'location',      width: 35 },
      { header: 'IP Address',      key: 'ipAddress',     width: 16 },
      { header: 'Last Polled',     key: 'lastPolledAt',  width: 22 },
      { header: 'Failure Count',   key: 'failureCount',  width: 14 },
      { header: 'Firmware',        key: 'firmware',      width: 16 },
    ];

    sheet.getRow(3).values = columns.map((c) => c.header as string) as ExcelJS.CellValue[];
    this.styleHeaderRow(sheet.getRow(3), columns.length);
    sheet.columns = columns;

    devices.forEach((d: any, idx) => {
      const row = sheet.addRow({
        deviceId:     d.deviceId,
        name:         d.name,
        type:         d.type,
        status:       d.status,
        location:     d.location,
        ipAddress:    d.ipAddress,
        lastPolledAt: d.lastPolledAt ? new Date(d.lastPolledAt).toLocaleString() : 'Never',
        failureCount: d.failureCount ?? 0,
        firmware:     d.firmwareVersion ?? 'N/A',
      });

      const statusCell = row.getCell('status');
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: d.status === 'ONLINE' ? this.COLORS.onlineBg : this.COLORS.offlineBg },
      };
      statusCell.font = { bold: true };
    });

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private styleTitle(sheet: ExcelJS.Worksheet, title: string, subtitle: string, mergeEnd: number) {
    sheet.mergeCells(`A1:${String.fromCharCode(64 + mergeEnd)}1`);
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF002D72' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 28;

    sheet.mergeCells(`A2:${String.fromCharCode(64 + mergeEnd)}2`);
    const subCell = sheet.getCell('A2');
    subCell.value = subtitle;
    subCell.font = { size: 11, italic: true };
    subCell.alignment = { horizontal: 'center' };
  }

  private styleHeaderRow(row: ExcelJS.Row, colCount: number) {
    row.height = 20;
    for (let i = 1; i <= colCount; i++) {
      const cell = row.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: this.COLORS.headerBg } };
      cell.font = { bold: true, color: { argb: this.COLORS.headerText }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
      };
    }
  }
}
