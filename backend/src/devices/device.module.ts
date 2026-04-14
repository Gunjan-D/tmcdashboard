import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './device.schema';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { SnmpService } from './snmp.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    GatewayModule,
  ],
  providers: [DeviceService, SnmpService],
  controllers: [DeviceController],
  exports: [DeviceService],
})
export class DeviceModule {}
