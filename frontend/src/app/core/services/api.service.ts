import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Incident,
  IncidentPage,
  CreateIncidentPayload,
  DashboardSummary,
} from '../models/incident.model';
import { Device, DeviceHealthStat } from '../models/device.model';

/**
 * ApiService — centralised HTTP client for all REST API calls.
 *
 * Uses Angular's HttpClient (AJAX / XHR under the hood) with typed observables.
 * All endpoints are based on the NestJS backend at environment.apiUrl.
 *
 * Authentication header is injected transparently by AuthInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Auth ──────────────────────────────────────────────────

  login(username: string, password: string): Observable<{ access_token: string; user: object }> {
    return this.http.post<{ access_token: string; user: object }>(
      `${this.base}/auth/login`,
      { username, password },
    );
  }

  // ── Incidents ─────────────────────────────────────────────

  getIncidents(filters: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Observable<IncidentPage> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<IncidentPage>(`${this.base}/incidents`, { params });
  }

  getIncident(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.base}/incidents/${id}`);
  }

  getIncidentSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/incidents/summary`);
  }

  createIncident(payload: CreateIncidentPayload): Observable<Incident> {
    return this.http.post<Incident>(`${this.base}/incidents`, payload);
  }

  updateIncident(id: string, payload: Partial<Incident> & { timelineNote?: string }): Observable<Incident> {
    return this.http.patch<Incident>(`${this.base}/incidents/${id}`, payload);
  }

  closeIncident(id: string): Observable<Incident> {
    return this.http.delete<Incident>(`${this.base}/incidents/${id}`);
  }

  // ── Devices ───────────────────────────────────────────────

  getDevices(type?: string): Observable<Device[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<Device[]>(`${this.base}/devices`, { params });
  }

  getDevice(id: string): Observable<Device> {
    return this.http.get<Device>(`${this.base}/devices/${id}`);
  }

  getDeviceHealth(): Observable<DeviceHealthStat[]> {
    return this.http.get<DeviceHealthStat[]>(`${this.base}/devices/health`);
  }

  pollDevice(id: string): Observable<Device> {
    return this.http.post<Device>(`${this.base}/devices/${id}/poll`, {});
  }

  // ── Reports ───────────────────────────────────────────────

  /** Returns a Blob; caller creates an object URL and triggers download. */
  downloadDailyIncidentReport(date?: string): Observable<Blob> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get(`${this.base}/reports/incidents/daily`, {
      params,
      responseType: 'blob',
    });
  }

  downloadDeviceHealthReport(): Observable<Blob> {
    return this.http.get(`${this.base}/reports/devices/health`, {
      responseType: 'blob',
    });
  }
}
