import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { IncidentModule } from './incidents/incident.module';
import { DeviceModule } from './devices/device.module';
import { GatewayModule } from './gateway/gateway.module';
import { ReportsModule } from './reports/reports.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AuthModule } from './auth/auth.module';

/**
 * Root application module.
 *
 * Database strategy:
 *  - MongoDB (Mongoose) – primary store for incidents, devices and alerts.
 *  - In development (no MONGO_URI env var) uses MongoMemoryServer so no
 *    local MongoDB installation is required.
 *  - A separate `sql-schemas/` folder ships DDL for Oracle, MySQL,
 *    PostgreSQL and MS SQL Server.
 *
 * Scheduling: @nestjs/schedule wraps node-cron — same model as Quartz.
 */

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/de_tmc';

@Module({
  imports: [
    // MongoDB connection
    MongooseModule.forRoot(MONGO_URI),

    // Global cron/interval scheduler (Quartz Scheduler equivalent for Node.js)
    ScheduleModule.forRoot(),

    // JWT – shared secret, configurable via env
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'de-tmc-secret-change-in-prod',
      signOptions: { expiresIn: '8h' },
    }),

    // Feature modules
    AuthModule,
    IncidentModule,
    DeviceModule,
    GatewayModule,
    ReportsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
