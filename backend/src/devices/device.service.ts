import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument, DeviceStatus } from './device.schema';
import { SnmpService } from './snmp.service';
import { TmcGateway } from '../gateway/tmc.gateway';

@Injectable()
export class DeviceService implements OnModuleInit {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    private readonly snmpService: SnmpService,
    private readonly tmcGateway: TmcGateway,
  ) {}

  /** Seed sample ITS devices on first run when collection is empty. */
  async onModuleInit() {
    const count = await this.deviceModel.countDocuments().exec();
    if (count === 0) {
      await this.seedDevices();
    }
  }

  async findAll(type?: string): Promise<DeviceDocument[]> {
    const query = type ? { type } : {};
    return this.deviceModel.find(query).sort({ type: 1, deviceId: 1 }).lean().exec() as Promise<DeviceDocument[]>;
  }

  async findOne(deviceId: string): Promise<DeviceDocument> {
    const device = await this.deviceModel.findOne({ deviceId }).lean().exec();
    if (!device) throw new NotFoundException(`Device ${deviceId} not found`);
    return device as DeviceDocument;
  }

  /** Poll a single device via SNMP and persist the result. */
  async pollDevice(deviceId: string): Promise<DeviceDocument> {
    const device = await this.deviceModel.findOne({ deviceId }).exec();
    if (!device) throw new NotFoundException(`Device ${deviceId} not found`);

    const result = await this.snmpService.pollDevice(
      device.ipAddress,
      Number(device.snmpPort ?? 161),
      device.snmpCommunity ?? 'public',
    );

    const newStatus = result.success ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE;
    const failureCount = result.success ? 0 : (device.failureCount ?? 0) + 1;

    const updated = await this.deviceModel.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          status: newStatus,
          snmpStatus: result.data,
          lastPolledAt: new Date(),
          failureCount,
        },
      },
      { new: true, lean: true },
    ).exec();

    if (newStatus === DeviceStatus.OFFLINE && failureCount === 1) {
      // Broadcast device-down alert to TMC operators
      this.tmcGateway.broadcastDeviceAlert({
        deviceId,
        name: device.name,
        status: newStatus,
        location: device.location,
        timestamp: new Date(),
      });
      this.logger.warn(`Device OFFLINE: ${deviceId} at ${device.location}`);
    }

    return updated as DeviceDocument;
  }

  /** Poll all monitoring-enabled devices (called by SchedulerService). */
  async pollAllDevices(): Promise<{ polled: number; online: number; offline: number }> {
    const devices = await this.deviceModel
      .find({ monitoringEnabled: true })
      .lean()
      .exec();

    let online = 0, offline = 0;

    await Promise.allSettled(
      devices.map(async (d) => {
        try {
          const result = await this.pollDevice(d.deviceId);
          result.status === DeviceStatus.ONLINE ? online++ : offline++;
        } catch {
          offline++;
        }
      }),
    );

    this.logger.log(`SNMP poll complete – ${devices.length} devices polled: ${online} online / ${offline} offline`);
    return { polled: devices.length, online, offline };
  }

  /** Health summary for dashboard. */
  async getHealthSummary() {
    return this.deviceModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  /** Seed 15 representative DE DOT ITS devices across I-95 corridor. */
  private async seedDevices() {
    const seed = [
      { deviceId: 'SIG-I95-041-NB', name: 'Signal Controller I-95 NB MM41', type: 'TRAFFIC_SIGNAL',   ipAddress: '10.10.41.1',  location: 'I-95 NB MM 41.0', coordinates: { lat: 39.2900, lng: -75.6020 } },
      { deviceId: 'SIG-I95-042-SB', name: 'Signal Controller I-95 SB MM42', type: 'TRAFFIC_SIGNAL',   ipAddress: '10.10.42.1',  location: 'I-95 SB MM 42.0', coordinates: { lat: 39.2976, lng: -75.6049 } },
      { deviceId: 'CAM-I95-040-NB', name: 'CCTV Camera I-95 NB MM40',       type: 'CCTV_CAMERA',      ipAddress: '10.20.40.1',  location: 'I-95 NB MM 40.0', coordinates: { lat: 39.2834, lng: -75.5990 } },
      { deviceId: 'CAM-I95-043-SB', name: 'CCTV Camera I-95 SB MM43',       type: 'CCTV_CAMERA',      ipAddress: '10.20.43.1',  location: 'I-95 SB MM 43.2', coordinates: { lat: 39.3012, lng: -75.6091 } },
      { deviceId: 'DMS-I95-038-NB', name: 'Variable Message Sign I-95 MM38',type: 'DMS',              ipAddress: '10.30.38.1',  location: 'I-95 NB MM 38.0', coordinates: { lat: 39.2680, lng: -75.5900 } },
      { deviceId: 'DMS-RT1-010-SB', name: 'VMS Route 1 SB MM10',            type: 'DMS',              ipAddress: '10.30.10.1',  location: 'US-1 SB MM 10',   coordinates: { lat: 39.3100, lng: -75.5800 } },
      { deviceId: 'RM-I95-041-ON',  name: 'Ramp Meter I-95 MM41 On-Ramp',   type: 'RAMP_METER',       ipAddress: '10.40.41.1',  location: 'I-95 MM 41 On-Ramp', coordinates: { lat: 39.2912, lng: -75.6030 } },
      { deviceId: 'WX-I95-042',     name: 'Weather Station I-95 MM42',       type: 'WEATHER_STATION',  ipAddress: '10.50.42.1',  location: 'I-95 MM 42',      coordinates: { lat: 39.2980, lng: -75.6060 } },
      { deviceId: 'VD-I95-041-NB',  name: 'Vehicle Detector I-95 NB MM41',  type: 'VEHICLE_DETECTOR', ipAddress: '10.60.41.1',  location: 'I-95 NB MM 41',   coordinates: { lat: 39.2905, lng: -75.6025 } },
      { deviceId: 'VD-I95-042-SB',  name: 'Vehicle Detector I-95 SB MM42',  type: 'VEHICLE_DETECTOR', ipAddress: '10.60.42.1',  location: 'I-95 SB MM 42',   coordinates: { lat: 39.2970, lng: -75.6045 } },
      { deviceId: 'WWS-I95-040-NB', name: 'Wrong-Way Sensor I-95 NB MM40',  type: 'WRONG_WAY_SENSOR', ipAddress: '10.70.40.1',  location: 'I-95 NB MM 40',   coordinates: { lat: 39.2840, lng: -75.5985 } },
      { deviceId: 'BT-I95-042',     name: 'Bluetooth Reader I-95 MM42',      type: 'BLUETOOTH_READER', ipAddress: '10.80.42.1',  location: 'I-95 MM 42 Median', coordinates: { lat: 39.2968, lng: -75.6058 } },
      { deviceId: 'CAM-RT13-001',   name: 'CCTV Route 13 North',             type: 'CCTV_CAMERA',      ipAddress: '10.20.13.1',  location: 'US-13 MP 1.0',    coordinates: { lat: 39.3200, lng: -75.5600 } },
      { deviceId: 'DMS-RT13-002',   name: 'VMS Route 13 South',              type: 'DMS',              ipAddress: '10.30.13.2',  location: 'US-13 MP 2.0',    coordinates: { lat: 39.3050, lng: -75.5700 } },
      { deviceId: 'SIG-RT40-005',   name: 'Signal Controller Route 40 MM5',  type: 'TRAFFIC_SIGNAL',   ipAddress: '10.10.40.5',  location: 'DE-40 MM 5',      coordinates: { lat: 39.3150, lng: -75.5900 } },
    ];

    const docs = seed.map((d) => ({
      ...d,
      status: DeviceStatus.UNKNOWN,
      snmpCommunity: 'public',
      snmpPort: '161',
      monitoringEnabled: true,
      failureCount: 0,
    }));

    await this.deviceModel.insertMany(docs);
    this.logger.log(`Seeded ${docs.length} ITS devices for Delaware I-95 corridor`);
  }
}
