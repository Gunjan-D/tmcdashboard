import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard – DE TMC',
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./incidents/incidents.component').then((m) => m.IncidentsComponent),
        title: 'Incidents – DE TMC',
      },
      {
        path: 'devices',
        loadComponent: () =>
          import('./devices/devices.component').then((m) => m.DevicesComponent),
        title: 'Devices – DE TMC',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./reports/reports.component').then((m) => m.ReportsComponent),
        title: 'Reports – DE TMC',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
