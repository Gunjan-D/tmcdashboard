import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Incident, IncidentSchema } from './incident.schema';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Incident.name, schema: IncidentSchema }]),
    GatewayModule,
  ],
  providers: [IncidentService],
  controllers: [IncidentController],
  exports: [IncidentService],
})
export class IncidentModule {}
