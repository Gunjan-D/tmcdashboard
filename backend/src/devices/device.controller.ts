import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DeviceService } from './device.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('devices')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('api/devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  /** GET /api/devices – list all ITS devices, optional type filter */
  @Get()
  @ApiOperation({ summary: 'List all ITS devices with current SNMP status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by device type' })
  findAll(@Query('type') type?: string) {
    return this.deviceService.findAll(type);
  }

  /** GET /api/devices/health – aggregate status counts for the dashboard */
  @Get('health')
  @ApiOperation({ summary: 'Device health summary – counts by status' })
  getHealthSummary() {
    return this.deviceService.getHealthSummary();
  }

  /** GET /api/devices/:id – single device with full SNMP data */
  @Get(':id')
  @ApiOperation({ summary: 'Get device details and last SNMP poll result' })
  @ApiParam({ name: 'id', example: 'CAM-I95-040-NB' })
  findOne(@Param('id') id: string) {
    return this.deviceService.findOne(id);
  }

  /** POST /api/devices/:id/poll – on-demand SNMP poll for a device */
  @Post(':id/poll')
  @ApiOperation({ summary: 'Trigger on-demand SNMP poll for a device' })
  @ApiParam({ name: 'id', example: 'CAM-I95-040-NB' })
  poll(@Param('id') id: string) {
    return this.deviceService.pollDevice(id);
  }

  /** POST /api/devices/poll-all – poll all monitoring-enabled devices */
  @Post('poll-all')
  @ApiOperation({ summary: 'Poll all enabled devices (used by scheduler)' })
  pollAll() {
    return this.deviceService.pollAllDevices();
  }
}
