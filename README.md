# Delaware TMC Operations Dashboard

> **Live Demo:** https://gunjan-d.github.io/tmcdashboard/dashboard
>
> **Demo Credentials:** `operator.jsmith` / `Tmc@2026!`  |  `supervisor.mjones` / `Super@2026!`

### Full-Stack Portfolio Project 

---
This project is intended solely for personal learning and practice purposes and does not involve any real or sensitive data. 

## Project Overview

A production-grade **Traffic Management Center (TMC) Operations Dashboard** built for the
Delaware Department of Transportation (DE DOT). The system supports 24Ã—7 ITS corridor
monitoring across the I-95, US-1, US-13 and DE-40 corridors in Smyrna, DE.

**Core capabilities:**
- Real-time traffic incident lifecycle management (OPEN â†’ ASSIGNED â†’ IN_PROGRESS â†’ RESOLVED)
- ITS field device health monitoring via SNMP (traffic signals, CCTV cameras, VMS signs, ramp meters)
- WebSocket push notifications to TMC operators
- Automated Quartz-style scheduled jobs (device polls, daily reports)
- Excel (XLSX) report generation â€” Daily Incident Summary & Device Health
- JWT authentication with LDAP integration path
- Full REST API with Swagger/OpenAPI documentation

---

## Skill Matrix

| Job Requirement | Technology Used | Where |
|---|---|---|
| **HTML, CSS, JS** (required) | Angular templates, global SCSS, TypeScript | `frontend/src/` |
| **JSON** (required) | All API payloads, MongoDB documents | Throughout |
| **AJAX / REST API** (required) | Angular `HttpClient`, NestJS controllers | `api.service.ts`, `*.controller.ts` |
| **WebSockets** (required) | Socket.io, `@nestjs/websockets` | `tmc.gateway.ts`, `websocket.service.ts` |
| **Angular / TypeScript** (desired) | Angular 17 standalone components | `frontend/src/app/` |
| **Angular SIGNALS** (desired) | `signal()`, `computed()`, `effect()` | `dashboard.component.ts`, `auth.store.ts` |
| **Angular Material** (desired) | Tables, cards, dialogs, sidebars, snackbars | All frontend components |
| **NestJS** (desired) | Application server, DI, decorators | `backend/src/` |
| **Node.js** (highly desired) | NestJS runtime | `backend/` |
| **MongoDB** (highly desired) | Mongoose schemas, aggregation pipelines | `*.schema.ts`, `*.service.ts` |
| **Oracle / MySQL / PostgreSQL / MS SQL** (desired) | DDL schemas provided | `backend/sql-schemas/schema.sql` |
| **SNMP** (desired) | `net-snmp` wrapper, NTCIP OID definitions | `snmp.service.ts` |
| **LDAP** (desired) | `ldapjs` integration path in `auth.service.ts` | `auth.service.ts` |
| **Quartz Scheduler** (desired) | `@nestjs/schedule` cron + interval decorators | `scheduler.service.ts` |
| **Excel / POI / node generators** (desired) | `exceljs` (Node POI equivalent) | `reports.service.ts` |
| **JDK / Java** (desired) | SQL schemas, Apache POI patterns, design notes | `sql-schemas/`, code comments |
| **Apache Web Server** (desired) | Proxy config, `environment.prod.ts` | `proxy.conf.json`, prod env |
| **JWT / Security** | `@nestjs/jwt`, `passport-jwt`, bcrypt | `auth.module.ts`, interceptor |
| **Postman / API testing** | Swagger UI at `/api/docs` | `main.ts` Swagger setup |
| **Build tools (Maven/Ant)** | npm scripts, tsconfig | `package.json` |

---

## Project Structure

```
DE-TMC-Dashboard/
â”‚
â”œâ”€â”€ backend/                          # NestJS REST API + WebSocket Gateway
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ main.ts                   # Bootstrap: CORS, ValidationPipe, Swagger
â”‚   â”‚   â”œâ”€â”€ app.module.ts             # Root module: MongoDB, Schedule, JWT
â”‚   â”‚   â”œâ”€â”€ auth/                     # JWT + LDAP authentication
â”‚   â”‚   â”‚   â”œâ”€â”€ auth.service.ts       # bcrypt + LDAP bind
â”‚   â”‚   â”‚   â”œâ”€â”€ auth.controller.ts    # POST /api/auth/login
â”‚   â”‚   â”‚   â”œâ”€â”€ jwt.strategy.ts       # Passport JWT strategy
â”‚   â”‚   â”‚   â””â”€â”€ jwt-auth.guard.ts
â”‚   â”‚   â”œâ”€â”€ incidents/                # Incident lifecycle module
â”‚   â”‚   â”‚   â”œâ”€â”€ incident.schema.ts    # Mongoose schema + indexes
â”‚   â”‚   â”‚   â”œâ”€â”€ incident.dto.ts       # class-validator DTOs
â”‚   â”‚   â”‚   â”œâ”€â”€ incident.service.ts   # Business logic + WebSocket broadcast
â”‚   â”‚   â”‚   â””â”€â”€ incident.controller.ts # REST: GET/POST/PATCH/DELETE
â”‚   â”‚   â”œâ”€â”€ devices/                  # ITS device monitoring
â”‚   â”‚   â”‚   â”œâ”€â”€ device.schema.ts      # Mongoose schema
â”‚   â”‚   â”‚   â”œâ”€â”€ snmp.service.ts       # SNMP GET/WALK + NTCIP OID map
â”‚   â”‚   â”‚   â”œâ”€â”€ device.service.ts     # Poll logic, seeding, health summary
â”‚   â”‚   â”‚   â””â”€â”€ device.controller.ts  # REST: GET/POST poll
â”‚   â”‚   â”œâ”€â”€ gateway/                  # WebSocket (Socket.io)
â”‚   â”‚   â”‚   â””â”€â”€ tmc.gateway.ts        # Channels: incident:*, device:*, heartbeat
â”‚   â”‚   â”œâ”€â”€ reports/                  # XLSX generation
â”‚   â”‚   â”‚   â”œâ”€â”€ reports.service.ts    # ExcelJS workbooks, DE DOT branding
â”‚   â”‚   â”‚   â””â”€â”€ reports.controller.ts # GET /api/reports/* â†’ blob stream
â”‚   â”‚   â””â”€â”€ scheduler/                # Quartz-equivalent cron jobs
â”‚   â”‚       â””â”€â”€ scheduler.service.ts  # SNMP poll (2 min), heartbeat (30 s), daily report
â”‚   â”œâ”€â”€ sql-schemas/
â”‚   â”‚   â””â”€â”€ schema.sql                # Oracle / MySQL / PostgreSQL / MS SQL DDL
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ tsconfig.json
â”‚
â””â”€â”€ frontend/                         # Angular 17 SPA
    â”œâ”€â”€ src/
    â”‚   â”œâ”€â”€ app/
    â”‚   â”‚   â”œâ”€â”€ app.config.ts         # Providers: router, HttpClient+interceptors, animations
    â”‚   â”‚   â”œâ”€â”€ app.routes.ts         # Lazy-loaded routes with auth guard
    â”‚   â”‚   â”œâ”€â”€ core/
    â”‚   â”‚   â”‚   â”œâ”€â”€ models/           # TypeScript interfaces: Incident, Device
    â”‚   â”‚   â”‚   â”œâ”€â”€ services/
    â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ api.service.ts        # All REST/AJAX calls (HttpClient)
    â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ websocket.service.ts  # Socket.io typed observables
    â”‚   â”‚   â”‚   â”‚   â””â”€â”€ auth.store.ts         # Signal-based auth state store
    â”‚   â”‚   â”‚   â”œâ”€â”€ interceptors/
    â”‚   â”‚   â”‚   â”‚   â””â”€â”€ auth.interceptor.ts   # JWT Bearer injection
    â”‚   â”‚   â”‚   â””â”€â”€ guards/auth.guard.ts
    â”‚   â”‚   â”œâ”€â”€ login/login.component.ts       # Login page
    â”‚   â”‚   â”œâ”€â”€ dashboard/                     # KPI cards + live charts (SIGNALS)
    â”‚   â”‚   â”œâ”€â”€ incidents/                     # Full incident management table
    â”‚   â”‚   â”œâ”€â”€ devices/                       # SNMP device grid + alerts
    â”‚   â”‚   â”œâ”€â”€ reports/                       # Excel download page
    â”‚   â”‚   â””â”€â”€ shared/layout/shell/           # Sidebar + toolbar shell
    â”‚   â”œâ”€â”€ environments/
    â”‚   â”‚   â”œâ”€â”€ environment.ts        # Dev: localhost:3000
    â”‚   â”‚   â””â”€â”€ environment.prod.ts   # Prod: Apache reverse proxy /api
    â”‚   â””â”€â”€ styles.scss               # DE DOT dark theme, Material overrides
    â”œâ”€â”€ angular.json
    â””â”€â”€ package.json
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- npm 10+

### 1. Backend
```bash
cd backend
npm install
# Set environment variables (optional â€“ defaults work for local dev):
# MONGO_URI=mongodb://localhost:27017/de_tmc
# JWT_SECRET=your-secret
npm run start:dev
# API:     http://localhost:3000/api
# Swagger: http://localhost:3000/api/docs
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
# App: http://localhost:4200
```

### Demo Login
| Role | Username | Password |
|---|---|---|
| Operator | `operator.jsmith` | `Tmc@2026!` |
| Supervisor | `supervisor.mjones` | `Super@2026!` |

---

## Key Technical Highlights

### Angular Signals (SIGNALS â€“ desired skill)
```typescript
// dashboard.component.ts
readonly totalActive = computed(() =>
  this.summary()?.activeByType.reduce((sum, row) => sum + row.count, 0) ?? 0
);

// Effect updates browser tab title reactively
effect(() => {
  const cnt = this.totalActive();
  document.title = cnt > 0 ? `(${cnt}) DE TMC Dashboard` : 'DE TMC Dashboard';
});
```

### WebSocket Real-time Events
```typescript
// NestJS gateway broadcasts to operator room
this.server.to('operators').emit('incident:created', incident);

// Angular component subscribes as Observable
this.ws.onIncidentCreated()
  .pipe(takeUntil(this.destroy$))
  .subscribe(incident => this.loadDashboardData());
```

### SNMP Device Polling (NTCIP 1202 OIDs)
```typescript
private readonly NTCIP_OIDs = {
  controllerMode: '1.3.6.1.4.1.1206.4.2.1.1.4.1.3.1',
  dmsMessageText: '1.3.6.1.4.1.1206.4.2.3.6.3.1.14.1.1.1',
  essAirTemperature: '1.3.6.1.4.1.1206.4.2.5.1.1.2.1',
};
```

### Quartz-equivalent Scheduler
```typescript
@Interval(120_000)           // Every 2 minutes
async snmpHealthPoll() { ... }

@Cron('0 0 6 * * *', { timeZone: 'America/New_York' })
async generateDailyReport() { ... }
```

### ExcelJS Report (Apache POI equivalent)
```typescript
const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('Daily Incidents');
// ... styled headers with DE DOT navy (#002D72)
// ... conditional severity cell colouring
// ... multi-sheet workbook with summary pivot
```

---

## Production Deployment (Apache + Node.js)

```apache
# Apache httpd.conf â€“ reverse proxy for TMC backend
ProxyPass        /api       http://localhost:3000/api
ProxyPassReverse /api       http://localhost:3000/api
ProxyPass        /tmc       ws://localhost:3000/tmc
ProxyPassReverse /tmc       ws://localhost:3000/tmc

# Serve Angular build from /var/www/tmc
DocumentRoot /var/www/tmc
<Directory /var/www/tmc>
    FallbackResource /index.html
</Directory>
```

---

## Author
Portfolio project demonstrating full-stack development for the
//////////////////////////////////////////////////////
