import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { DeviceModule } from '../devices/device.module';
import { IncidentModule } from '../incidents/incident.module';
import { ReportsModule } from '../reports/reports.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [DeviceModule, IncidentModule, ReportsModule, GatewayModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
