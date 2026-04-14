import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../core/services/auth.store';

@Component({
  selector: 'tmc-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-page">
      <div class="de-header">
        <div class="seal"></div>
        <div>
          <div class="agency">State of Delaware</div>
          <div class="dept">Department of Transportation</div>
        </div>
      </div>

      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>traffic</mat-icon>
            TMC Operations Dashboard
          </mat-card-title>
          <mat-card-subtitle>Traffic Management Center — Operator Login</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="submit()" #f="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput [(ngModel)]="username" name="username" autocomplete="username" required />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input
                matInput
                [type]="showPw ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                autocomplete="current-password"
                required
              />
              <button mat-icon-button matSuffix type="button" (click)="showPw = !showPw">
                <mat-icon>{{ showPw ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <div class="error-msg" *ngIf="auth.error()">{{ auth.error() }}</div>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="full-width login-btn"
              [disabled]="auth.loading()"
            >
              <mat-spinner *ngIf="auth.loading()" diameter="20"></mat-spinner>
              <span *ngIf="!auth.loading()">Sign In</span>
            </button>
          </form>

          <div class="demo-cred">
            <strong>Demo credentials:</strong><br>
            Operator: <code>operator.jsmith</code> / <code>Tmc&#64;2026!</code><br>
            Supervisor: <code>supervisor.mjones</code> / <code>Super&#64;2026!</code>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="ldap-note">
        In production, authentication uses <strong>State of Delaware Active Directory (LDAP)</strong>
        via ldapjs BIND operation.
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--tmc-bg-dark); padding: 20px; }
    .de-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; .agency { font-size: 1.1rem; font-weight: 600; color: var(--tmc-gold); } .dept { font-size: 0.85rem; color: var(--tmc-text-muted); } .seal { width: 48px; height: 48px; background: var(--tmc-navy); border-radius: 50%; border: 2px solid var(--tmc-gold); } }
    .login-card { width: 100%; max-width: 420px; mat-card-title { display: flex; align-items: center; gap: 8px; } }
    .full-width { width: 100%; margin-bottom: 8px; }
    .login-btn { height: 44px; margin-top: 8px; }
    .error-msg { color: #ef5350; font-size: 0.85rem; margin-bottom: 8px; }
    .demo-cred { margin-top: 20px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.8rem; color: var(--tmc-text-muted); code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 3px; color: #90caf9; } }
    .ldap-note { margin-top: 16px; font-size: 0.78rem; color: var(--tmc-text-muted); text-align: center; max-width: 420px; }
  `],
})
export class LoginComponent {
  readonly auth = inject(AuthStore);
  username = '';
  password = '';
  showPw = false;

  submit(): void {
    if (this.username && this.password) {
      this.auth.login(this.username, this.password);
    }
  }
}
