import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * TMC WebSocket Gateway
 *
 * Provides real-time, bi-directional communication to Angular frontend clients.
 *
 * Channels emitted by the server:
 *  - incident:created     – new incident detected
 *  - incident:updated     – existing incident status change
 *  - device:alert         – device went offline / recovered
 *  - scheduler:heartbeat  – periodic system health pulse (every 30 s)
 *
 * Channels listened from clients:
 *  - operator:join        – operator declares their username; joined to 'operators' room
 *  - incident:acknowledge – operator acknowledges a real-time alert
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:80'],
    credentials: true,
  },
  namespace: '/tmc',
})
export class TmcGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(TmcGateway.name);
  private connectedOperators = new Map<string, string>(); // socketId → username

  afterInit(server: Server) {
    this.logger.log('TMC WebSocket gateway initialised');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const username = this.connectedOperators.get(client.id) ?? 'unknown';
    this.connectedOperators.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (${username})`);
  }

  /** Operator identifies themselves after connecting. */
  @SubscribeMessage('operator:join')
  handleOperatorJoin(
    @MessageBody() data: { username: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.connectedOperators.set(client.id, data.username);
    client.join('operators');
    this.logger.log(`Operator joined: ${data.username} (${client.id})`);
    return { status: 'joined', operators: this.connectedOperators.size };
  }

  /** Operator acknowledges an incident alert. */
  @SubscribeMessage('incident:acknowledge')
  handleAcknowledge(
    @MessageBody() data: { incidentId: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Incident ${data.incidentId} acknowledged by ${data.username}`);
    // Broadcast acknowledgement to all operators so duplicate handling is prevented
    this.server.to('operators').emit('incident:acknowledged', {
      incidentId: data.incidentId,
      acknowledgedBy: data.username,
      timestamp: new Date(),
    });
  }

  // ── Server-side broadcast helpers (called by services) ──────────────────

  broadcastIncidentUpdate(event: 'incident:created' | 'incident:updated', payload: object) {
    this.server?.to('operators').emit(event, payload);
  }

  broadcastDeviceAlert(payload: {
    deviceId: string;
    name: string;
    status: string;
    location: string;
    timestamp: Date;
  }) {
    this.server?.to('operators').emit('device:alert', payload);
  }

  broadcastHeartbeat(stats: { activeIncidents: number; devicesOnline: number; devicesOffline: number }) {
    this.server?.emit('scheduler:heartbeat', { ...stats, serverTime: new Date() });
  }

  getConnectedCount(): number {
    return this.connectedOperators.size;
  }
}
