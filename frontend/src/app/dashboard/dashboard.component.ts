import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../core/services/api.service';
import { WebSocketService, Heartbeat } from '../core/services/websocket.service';
import { AuthStore } from '../core/services/auth.store';
import { DashboardSummary, Incident } from '../core/models/incident.model';
import { DeviceHealthStat } from '../core/models/device.model';

/**
 * DashboardComponent — TMC operations overview.
 *
 * Demonstrates Angular Signals (SIGNALS skill requirement):
 *  - signal()    for writable state
 *  - computed()  for derived values
 *  - effect()    for reactive side-effects (updating title bar on KPI change)
 *
 * Also demonstrates:
 *  - WebSocket real-time updates (heartbeat, incident alerts)
 *  - AJAX/REST API calls via ApiService
 *  - JSON data binding in Angular templates
 */
@Component({
  selector: 'tmc-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly ws = inject(WebSocketService);
  private readonly snack = inject(MatSnackBar);
  readonly auth = inject(AuthStore);

  private readonly destroy$ = new Subject<void>();

  // ── Angular Signals – writable state ────────────────────
  readonly loading = signal(true);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly deviceHealth = signal<DeviceHealthStat[]>([]);
  readonly heartbeat = signal<Heartbeat | null>(null);
  readonly recentAlerts = signal<string[]>([]);
  readonly wsConnected = signal(false);

  // ── Computed signals – derived state ─────────────────────
  readonly totalActive = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    return s.activeByType.reduce((sum, row) => sum + row.count, 0);
  });

  readonly criticalCount = computed(
    () => this.summary()?.bySeverity.find((s) => s._id === 'CRITICAL')?.count ?? 0,
  );

  readonly devicesOnline = computed(
    () => this.deviceHealth().find((h) => h._id === 'ONLINE')?.count ?? 0,
  );

  readonly devicesOffline = computed(
    () => this.deviceHealth().find((h) => h._id === 'OFFLINE')?.count ?? 0,
  );

  // ── Effect – update document title when KPIs change ─────
  constructor() {
    effect(() => {
      const cnt = this.totalActive();
      document.title = cnt > 0 ? `(${cnt}) DE TMC Dashboard` : 'DE TMC Dashboard';
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.subscribeToWebSocket();
  }

  private loadDashboardData(): void {
    this.loading.set(true);

    this.api.getIncidentSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api.getDeviceHealth().subscribe({
      next: (data) => this.deviceHealth.set(data),
    });
  }

  private subscribeToWebSocket(): void {
    // Heartbeat – live KPI updates from the scheduler
    this.ws.onHeartbeat().pipe(takeUntil(this.destroy$)).subscribe((hb) => {
      this.heartbeat.set(hb);
      this.wsConnected.set(true);
    });

    // New incident alerts
    this.ws.onIncidentCreated().pipe(takeUntil(this.destroy$)).subscribe((inc: Incident) => {
      const msg = `🚨 New ${inc.severity} incident: ${inc.location}`;
      this.recentAlerts.update((arr) => [msg, ...arr].slice(0, 5));
      this.snack.open(msg, 'Dismiss', { duration: 6000, panelClass: ['tmc-alert-snack'] });
      this.loadDashboardData(); // refresh KPIs
    });

    // Device offline alerts
    this.ws.onDeviceAlert().pipe(takeUntil(this.destroy$)).subscribe((alert) => {
      const msg = `⚠️ Device OFFLINE: ${alert.name} at ${alert.location}`;
      this.recentAlerts.update((arr) => [msg, ...arr].slice(0, 5));
    });
  }

  refresh(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
