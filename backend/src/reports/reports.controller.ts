import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /api/reports/incidents/daily?date=2026-04-13
   * Streams the XLSX daily incident report directly to the browser.
   */
  @Get('incidents/daily')
  @ApiOperation({ summary: 'Download daily incident report (XLSX)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-04-13' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async dailyIncidentReport(
    @Query('date') dateStr: string,
    @Res() res: Response,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const buffer = await this.reportsService.generateDailyIncidentReport(date);
    const filename = `TMC_Incidents_${date.toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }

  /**
   * GET /api/reports/devices/health
   * Downloads the current Device Health XLSX report.
   */
  @Get('devices/health')
  @ApiOperation({ summary: 'Download device health report (XLSX)' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async deviceHealthReport(@Res() res: Response) {
    const buffer = await this.reportsService.generateDeviceHealthReport();
    const filename = `TMC_DeviceHealth_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }
}
