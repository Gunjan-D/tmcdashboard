import { Module } from '@nestjs/common';
import { TmcGateway } from './tmc.gateway';

@Module({
  providers: [TmcGateway],
  exports: [TmcGateway],
})
export class GatewayModule {}
