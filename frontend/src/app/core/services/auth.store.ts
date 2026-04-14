import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  fullName: string;
  email: string;
}

/**
 * AuthStore — signal-based state store for authentication.
 *
 * Uses Angular Signals (new in Angular 16+, stable in 17+) instead of
 * BehaviorSubject for reactive state — a key desired skill in the job spec.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  // ── Writable signals ─────────────────────────────────────
  private readonly _user = signal<AuthUser | null>(this.loadStoredUser());
  private readonly _token = signal<string | null>(localStorage.getItem('tmc_token'));
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // ── Computed (derived) signals ───────────────────────────
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token() && !!this._user());
  readonly isOperator = computed(() => !!this._user());
  readonly isSupervisor = computed(() => this._user()?.role === 'SUPERVISOR');

  // Demo credentials for offline / GitHub Pages mode
  private readonly DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
    'operator.jsmith': {
      password: 'Tmc@2026!',
      user: { id: 1, username: 'operator.jsmith', role: 'OPERATOR', fullName: 'John Smith', email: 'jsmith@deldot.gov' },
    },
    'supervisor.mjones': {
      password: 'Super@2026!',
      user: { id: 2, username: 'supervisor.mjones', role: 'SUPERVISOR', fullName: 'Mary Jones', email: 'mjones@deldot.gov' },
    },
  };

  private demoLogin(username: string, password: string): boolean {
    const entry = this.DEMO_USERS[username];
    if (entry && entry.password === password) {
      const token = 'demo.' + btoa(JSON.stringify({ sub: entry.user.id, username, role: entry.user.role }));
      localStorage.setItem('tmc_token', token);
      localStorage.setItem('tmc_user', JSON.stringify(entry.user));
      this._token.set(token);
      this._user.set(entry.user);
      this._loading.set(false);
      this.router.navigate(['/dashboard']);
      return true;
    }
    return false;
  }

  login(username: string, password: string): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .post<{ access_token: string; user: AuthUser }>(
        `${environment.apiUrl}/auth/login`,
        { username, password },
      )
      .subscribe({
        next: ({ access_token, user }) => {
          localStorage.setItem('tmc_token', access_token);
          localStorage.setItem('tmc_user', JSON.stringify(user));
          this._token.set(access_token);
          this._user.set(user);
          this._loading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          // Backend unreachable (GitHub Pages / offline) — fall back to demo auth
          if (err.status === 0 || err.status === 504 || err.status === 502) {
            if (!this.demoLogin(username, password)) {
              this._error.set('Login failed. Please check your credentials.');
              this._loading.set(false);
            }
          } else {
            this._error.set(err.error?.message ?? 'Login failed. Please check your credentials.');
            this._loading.set(false);
          }
        },
      });
  }

  logout(): void {
    localStorage.removeItem('tmc_token');
    localStorage.removeItem('tmc_user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private loadStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('tmc_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
