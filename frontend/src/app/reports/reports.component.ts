import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ApiService } from '../core/services/api.service';

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

/**
 * ReportsComponent — lets operators download XLSX reports.
 *
 * Demonstrates:
 *  - Triggering AJAX calls that return binary Blob data (Excel files)
 *  - Programmatic browser download via ObjectURL (vanilla JS)
 *  - Angular Material UI
 *  - ExcelJS usage (via backend ReportsService)
 *
 * Analogous to Apache POI file generation in the Java ATMS stack.
 */
@Component({
  selector: 'tmc-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);

  readonly downloading = signal<string | null>(null);
  readonly selectedDate = signal(new Date().toISOString().slice(0, 10));

  readonly reports: ReportDef[] = [
    {
      id: 'daily-incidents',
      title: 'Daily Incident Report',
      description: 'All incidents detected on the selected date. Includes severity, location, responder, timeline and resolution time. Multi-sheet XLSX with summary pivot.',
      icon: 'warning',
      category: 'Incidents',
    },
    {
      id: 'device-health',
      title: 'Device Health Report',
      description: 'Current SNMP status of all 200+ ITS field devices. Colour-coded by status (ONLINE/OFFLINE/DEGRADED). Ideal for shift-change briefings.',
      icon: 'sensors',
      category: 'Devices',
    },
  ];

  downloadReport(report: ReportDef): void {
    this.downloading.set(report.id);

    const obs$ = report.id === 'daily-incidents'
      ? this.api.downloadDailyIncidentReport(this.selectedDate())
      : this.api.downloadDeviceHealthReport();

    obs$.subscribe({
      next: (blob: Blob) => {
        // Create an ObjectURL and programmatically click a hidden anchor
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const date = this.selectedDate();
        a.download = report.id === 'daily-incidents'
          ? `TMC_Incidents_${date}.xlsx`
          : `TMC_DeviceHealth_${new Date().toISOString().slice(0, 10)}.xlsx`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Free memory

        this.downloading.set(null);
        this.snack.open(`Downloaded: ${a.download}`, 'OK', { duration: 3500 });
      },
      error: () => {
        this.downloading.set(null);
        this.snack.open('Report generation failed. Check backend connection.', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
