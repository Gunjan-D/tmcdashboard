import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { ApiService } from '../core/services/api.service';
import { WebSocketService } from '../core/services/websocket.service';
import { Device, DeviceHealthStat, DeviceAlert } from '../core/models/device.model';

/**
 * DevicesComponent — ITS device monitoring grid.
 *
 * Demonstrates:
 *  - Polling ITS devices via REST/AJAX (ApiService)
 *  - SNMP status display (device.snmpStatus JSON map)
 *  - WebSocket device-alert notifications
 *  - Angular Signals for reactive UI state
 *  - Angular Material table + chips
 */
@Component({
  selector: 'tmc-devices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.scss',
})
export class DevicesComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly ws = inject(WebSocketService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(false);
  readonly polling = signal<string | null>(null); // deviceId being polled
  readonly devices = signal<Device[]>([]);
  readonly health = signal<DeviceHealthStat[]>([]);
  readonly alerts = signal<DeviceAlert[]>([]);
  readonly typeFilter = signal<string>('');

  readonly deviceTypes = [
    'TRAFFIC_SIGNAL', 'CCTV_CAMERA', 'DMS', 'RAMP_METER',
    'WEATHER_STATION', 'VEHICLE_DETECTOR', 'WRONG_WAY_SENSOR', 'BLUETOOTH_READER',
  ];

  readonly displayedColumns = ['deviceId', 'name', 'type', 'status', 'location', 'lastPolledAt', 'failureCount', 'actions'];

  ngOnInit(): void {
    this.loadDevices();
    this.loadHealth();
    this.ws.onDeviceAlert().pipe(takeUntil(this.destroy$)).subscribe((alert) => {
      this.alerts.update((arr) => [alert, ...arr].slice(0, 10));
      this.snack.open(`Device OFFLINE: ${alert.name}`, 'Dismiss', { duration: 5000 });
      this.loadHealth(); // Refresh health badges
    });
  }

  loadDevices(): void {
    this.loading.set(true);
    this.api.getDevices(this.typeFilter() || undefined).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.devices.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadHealth(): void {
    this.api.getDeviceHealth().pipe(takeUntil(this.destroy$)).subscribe({
      next: (h) => this.health.set(h),
    });
  }

  pollDevice(device: Device): void {
    this.polling.set(device.deviceId);
    this.api.pollDevice(device.deviceId).subscribe({
      next: (updated) => {
        this.devices.update((list) =>
          list.map((d) => (d.deviceId === updated.deviceId ? updated : d)),
        );
        this.polling.set(null);
        this.snack.open(`Polled ${device.deviceId}: ${updated.status}`, 'OK', { duration: 2500 });
        this.loadHealth();
      },
      error: () => {
        this.polling.set(null);
        this.snack.open(`Poll failed for ${device.deviceId}`, 'Dismiss', { duration: 3000 });
      },
    });
  }

  filterByType(type: string): void {
    this.typeFilter.set(type);
    this.loadDevices();
  }

  getDeviceIcon(type: string): string {
    const icons: Record<string, string> = {
      TRAFFIC_SIGNAL:   'traffic',
      CCTV_CAMERA:      'videocam',
      DMS:              'signpost',
      RAMP_METER:       'merge',
      WEATHER_STATION:  'wb_cloudy',
      VEHICLE_DETECTOR: 'sensors',
      WRONG_WAY_SENSOR: 'do_not_enter',
      BLUETOOTH_READER: 'bluetooth',
    };
    return icons[type] ?? 'device_hub';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
