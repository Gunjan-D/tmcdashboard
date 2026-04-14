import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Incident } from '../models/incident.model';
import { DeviceAlert } from '../models/device.model';

export interface Heartbeat {
  activeIncidents: number;
  devicesOnline: number;
  devicesOffline: number;
  serverTime: string;
}

/**
 * WebSocketService — manages the Socket.io connection to the TMC NestJS gateway.
 *
 * Provides typed Observables for each real-time event channel.
 * Reconnects automatically on disconnect (Socket.io default behaviour).
 *
 * This service demonstrates the WebSocket skill requirement by:
 *  - Establishing a persistent ws:// connection
 *  - Authenticating via JWT on connection
 *  - Exposing strongly-typed event streams for Angular components to subscribe
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket!: Socket;
  private readonly destroy$ = new Subject<void>();

  connect(token: string, username: string): void {
    if (this.socket?.connected) return;

    this.socket = io(`${environment.wsUrl}${environment.wsNamespace}`, {
      auth: { token },           // JWT passed on handshake
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected to TMC gateway');
      // Announce operator to the server – joins 'operators' broadcast room
      this.socket.emit('operator:join', { username });
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
  }

  // ── Typed event streams ─────────────────────────────────

  onIncidentCreated(): Observable<Incident> {
    return this.fromSocketEvent<Incident>('incident:created');
  }

  onIncidentUpdated(): Observable<Incident> {
    return this.fromSocketEvent<Incident>('incident:updated');
  }

  onIncidentAcknowledged(): Observable<{ incidentId: string; acknowledgedBy: string }> {
    return this.fromSocketEvent('incident:acknowledged');
  }

  onDeviceAlert(): Observable<DeviceAlert> {
    return this.fromSocketEvent<DeviceAlert>('device:alert');
  }

  onHeartbeat(): Observable<Heartbeat> {
    return this.fromSocketEvent<Heartbeat>('scheduler:heartbeat');
  }

  acknowledgeIncident(incidentId: string, username: string): void {
    this.socket?.emit('incident:acknowledge', { incidentId, username });
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private fromSocketEvent<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      const handler = (data: T) => observer.next(data);
      this.socket?.on(event, handler);
      return () => this.socket?.off(event, handler);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
