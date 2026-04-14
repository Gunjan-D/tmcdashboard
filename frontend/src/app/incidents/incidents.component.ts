import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../core/services/api.service';
import { WebSocketService } from '../core/services/websocket.service';
import { Incident, IncidentPage, IncidentStatus, IncidentSeverity } from '../core/models/incident.model';

/**
 * IncidentsComponent — Full incident management table.
 *
 * Demonstrates:
 *  - Angular Material table with sorting, filtering, pagination
 *  - Angular Signals for reactive state management
 *  - REST API (AJAX) calls with rxjs Observables
 *  - WebSocket real-time incident updates pushed from NestJS gateway
 *  - Reactive Forms for filter controls
 */
@Component({
  selector: 'tmc-incidents',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './incidents.component.html',
  styleUrl: './incidents.component.scss',
})
export class IncidentsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly ws = inject(WebSocketService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // ── Angular Signals ──────────────────────────────────────
  readonly loading = signal(false);
  readonly incidents = signal<Incident[]>([]);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);

  readonly displayedColumns: string[] = [
    'incidentId', 'type', 'severity', 'status', 'location',
    'reportedBy', 'detectedAt', 'actions',
  ];

  readonly statusOptions: IncidentStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  readonly severityOptions: IncidentSeverity[] = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
  readonly typeOptions = ['ACCIDENT', 'CONGESTION', 'ROAD_CLOSURE', 'WEATHER', 'DEBRIS', 'SIGNAL_FAILURE', 'CONSTRUCTION', 'SPECIAL_EVENT'];

  filterForm: FormGroup = this.fb.group({
    status:   [''],
    severity: [''],
    type:     [''],
    dateFrom: [''],
    dateTo:   [''],
  });

  ngOnInit(): void {
    this.loadIncidents();
    this.subscribeToRealTimeUpdates();
  }

  loadIncidents(): void {
    this.loading.set(true);
    const f = this.filterForm.value;

    this.api.getIncidents({
      page: this.currentPage(),
      limit: this.pageSize(),
      status:   f.status   || undefined,
      severity: f.severity || undefined,
      type:     f.type     || undefined,
      dateFrom: f.dateFrom || undefined,
      dateTo:   f.dateTo   || undefined,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (page: IncidentPage) => {
        this.incidents.set(page.data);
        this.totalCount.set(page.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadIncidents();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadIncidents();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage.set(1);
    this.loadIncidents();
  }

  updateStatus(incident: Incident, status: IncidentStatus): void {
    this.api.updateIncident(incident.incidentId, { status }).subscribe({
      next: () => {
        this.snack.open(`Incident ${incident.incidentId} updated to ${status}`, 'OK', { duration: 3000 });
        this.loadIncidents();
      },
      error: () => this.snack.open('Update failed', 'Dismiss', { duration: 3000 }),
    });
  }

  acknowledgeAlert(incident: Incident): void {
    const username = JSON.parse(localStorage.getItem('tmc_user') || '{}')?.username ?? 'operator';
    this.ws.acknowledgeIncident(incident.incidentId, username);
    this.snack.open(`Acknowledged: ${incident.incidentId}`, 'OK', { duration: 2500 });
  }

  private subscribeToRealTimeUpdates(): void {
    this.ws.onIncidentCreated().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadIncidents(); // Refresh when new incident arrives
    });

    this.ws.onIncidentUpdated().pipe(takeUntil(this.destroy$)).subscribe((updated) => {
      this.incidents.update((list) =>
        list.map((i) => (i.incidentId === updated.incidentId ? (updated as Incident) : i)),
      );
    });
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity}`;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      OPEN: 'fiber_new',
      ASSIGNED: 'assignment',
      IN_PROGRESS: 'directions_car',
      RESOLVED: 'check_circle',
      CLOSED: 'archive',
    };
    return icons[status] ?? 'help';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
