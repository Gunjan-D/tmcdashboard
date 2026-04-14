import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthStore } from '../../../core/services/auth.store';
import { WebSocketService } from '../../../core/services/websocket.service';

interface NavItem {
  route: string;
  icon: string;
  label: string;
}

/**
 * ShellComponent — app chrome: top toolbar + left sidebar + router outlet.
 * Initialises the WebSocket connection once the operator is authenticated.
 */
@Component({
  selector: 'tmc-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">

      <!-- Sidebar -->
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <mat-icon>traffic</mat-icon>
          <div>
            <div class="brand-title">DE TMC</div>
            <div class="brand-sub">Operations Dashboard</div>
          </div>
        </div>

        <mat-nav-list>
          <a
            mat-list-item
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="active-nav"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>

        <div class="sidebar-footer">
          <div class="operator-info">
            <mat-icon>account_circle</mat-icon>
            <div>
              <div class="op-name">{{ auth.user()?.fullName }}</div>
              <div class="op-role">{{ auth.user()?.role }}</div>
            </div>
          </div>
          <button mat-icon-button matTooltip="Sign out" (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </mat-sidenav>

      <!-- Main content -->
      <mat-sidenav-content class="main-content">

        <!-- Top toolbar -->
        <mat-toolbar class="top-toolbar">
          <span class="toolbar-spacer"></span>

          <div class="toolbar-right">
            <span class="ws-chip" [class.live]="ws.isConnected">
              <mat-icon>{{ ws.isConnected ? 'wifi' : 'wifi_off' }}</mat-icon>
              {{ ws.isConnected ? 'Live' : 'Offline' }}
            </span>

            <span class="time-display" [title]="'Server time'">
              {{ now | date:'EEE MMM dd, HH:mm:ss' }} ET
            </span>
          </div>
        </mat-toolbar>

        <!-- Page content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>

      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }
    .sidenav { width: var(--tmc-sidebar-w); background: var(--tmc-bg-panel); display: flex; flex-direction: column; }
    .brand { display: flex; align-items: center; gap: 12px; padding: 20px 16px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); mat-icon { font-size: 32px; color: var(--tmc-gold) !important; font-family: 'Material Icons' !important; } .brand-title { font-size: 1rem; font-weight: 700; color: var(--tmc-gold); } .brand-sub { font-size: 0.7rem; color: #ffffff; } }
    mat-nav-list { padding-top: 8px; flex: 1; a { color: #ffffff; border-radius: 6px; margin: 2px 8px; mat-icon { color: #ffffff !important; font-family: 'Material Icons' !important; font-size: 22px; } &.active-nav { color: #90caf9; background: rgba(0,45,114,0.4); mat-icon { color: #90caf9 !important; } } &:hover { background: rgba(255,255,255,0.05); color: #ffffff; } span { color: #ffffff !important; } } }
    .sidebar-footer { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 8px; color: #ffffff; mat-icon { color: #ffffff !important; font-family: 'Material Icons' !important; } .operator-info { display: flex; align-items: center; gap: 8px; flex: 1; .op-name { font-size: 0.82rem; font-weight: 500; color: #ffffff; } .op-role { font-size: 0.7rem; color: rgba(255,255,255,0.75); } } }
    .main-content { display: flex; flex-direction: column; background: var(--tmc-bg-dark); }
    .top-toolbar { background: var(--tmc-bg-panel); border-bottom: 1px solid rgba(255,255,255,0.07); height: var(--tmc-header-h); padding: 0 20px; flex-shrink: 0; }
    .toolbar-spacer { flex: 1; }
    .toolbar-right { display: flex; align-items: center; gap: 16px; }
    .ws-chip { display: flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); font-size: 0.78rem; color: #ffffff; mat-icon { font-size: 15px; color: #ffffff !important; font-family: 'Material Icons' !important; } &.live { color: #69f0ae; border-color: #69f0ae44; mat-icon { color: #69f0ae !important; } } }
    .time-display { font-family: monospace; font-size: 0.82rem; color: #ffffff; }
    .page-content { flex: 1; overflow-y: auto; }
  `],
})
export class ShellComponent implements OnInit {
  readonly auth = inject(AuthStore);
  readonly ws = inject(WebSocketService);

  readonly navItems: NavItem[] = [
    { route: '/dashboard', icon: 'dashboard',   label: 'Dashboard' },
    { route: '/incidents', icon: 'warning',      label: 'Incidents' },
    { route: '/devices',   icon: 'device_hub',   label: 'Devices' },
    { route: '/reports',   icon: 'assessment',   label: 'Reports' },
  ];

  now = new Date();
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Connect WebSocket after authentication
    const token = this.auth.token();
    const username = this.auth.user()?.username;
    if (token && username) {
      this.ws.connect(token, username);
    }

    // Clock tick
    this.timer = setInterval(() => { this.now = new Date(); }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.ws.disconnect();
  }
}
