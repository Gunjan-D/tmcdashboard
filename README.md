# Delaware TMC Operations Dashboard
### Full-Stack Portfolio Project 

---
This project is intended solely for personal learning and practice purposes and does not involve any real or sensitive data. 

## Project Overview

A production-grade **Traffic Management Center (TMC) Operations Dashboard** built for the
Delaware Department of Transportation (DE DOT). The system supports 24×7 ITS corridor
monitoring across the I-95, US-1, US-13 and DE-40 corridors in Smyrna, DE.

**Core capabilities:**
- Real-time traffic incident lifecycle management (OPEN → ASSIGNED → IN_PROGRESS → RESOLVED)
- ITS field device health monitoring via SNMP (traffic signals, CCTV cameras, VMS signs, ramp meters)
- WebSocket push notifications to TMC operators
- Automated Quartz-style scheduled jobs (device polls, daily reports)
- Excel (XLSX) report generation — Daily Incident Summary & Device Health
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
│
├── backend/                          # NestJS REST API + WebSocket Gateway
│   ├── src/
│   │   ├── main.ts                   # Bootstrap: CORS, ValidationPipe, Swagger
│   │   ├── app.module.ts             # Root module: MongoDB, Schedule, JWT
│   │   ├── auth/                     # JWT + LDAP authentication
│   │   │   ├── auth.service.ts       # bcrypt + LDAP bind
│   │   │   ├── auth.controller.ts    # POST /api/auth/login
│   │   │   ├── jwt.strategy.ts       # Passport JWT strategy
│   │   │   └── jwt-auth.guard.ts
│   │   ├── incidents/                # Incident lifecycle module
│   │   │   ├── incident.schema.ts    # Mongoose schema + indexes
│   │   │   ├── incident.dto.ts       # class-validator DTOs
│   │   │   ├── incident.service.ts   # Business logic + WebSocket broadcast
│   │   │   └── incident.controller.ts # REST: GET/POST/PATCH/DELETE
│   │   ├── devices/                  # ITS device monitoring
│   │   │   ├── device.schema.ts      # Mongoose schema
│   │   │   ├── snmp.service.ts       # SNMP GET/WALK + NTCIP OID map
│   │   │   ├── device.service.ts     # Poll logic, seeding, health summary
│   │   │   └── device.controller.ts  # REST: GET/POST poll
│   │   ├── gateway/                  # WebSocket (Socket.io)
│   │   │   └── tmc.gateway.ts        # Channels: incident:*, device:*, heartbeat
│   │   ├── reports/                  # XLSX generation
│   │   │   ├── reports.service.ts    # ExcelJS workbooks, DE DOT branding
│   │   │   └── reports.controller.ts # GET /api/reports/* → blob stream
│   │   └── scheduler/                # Quartz-equivalent cron jobs
│   │       └── scheduler.service.ts  # SNMP poll (2 min), heartbeat (30 s), daily report
│   ├── sql-schemas/
│   │   └── schema.sql                # Oracle / MySQL / PostgreSQL / MS SQL DDL
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                         # Angular 17 SPA
    ├── src/
    │   ├── app/
    │   │   ├── app.config.ts         # Providers: router, HttpClient+interceptors, animations
    │   │   ├── app.routes.ts         # Lazy-loaded routes with auth guard
    │   │   ├── core/
    │   │   │   ├── models/           # TypeScript interfaces: Incident, Device
    │   │   │   ├── services/
    │   │   │   │   ├── api.service.ts        # All REST/AJAX calls (HttpClient)
    │   │   │   │   ├── websocket.service.ts  # Socket.io typed observables
    │   │   │   │   └── auth.store.ts         # Signal-based auth state store
    │   │   │   ├── interceptors/
    │   │   │   │   └── auth.interceptor.ts   # JWT Bearer injection
    │   │   │   └── guards/auth.guard.ts
    │   │   ├── login/login.component.ts       # Login page
    │   │   ├── dashboard/                     # KPI cards + live charts (SIGNALS)
    │   │   ├── incidents/                     # Full incident management table
    │   │   ├── devices/                       # SNMP device grid + alerts
    │   │   ├── reports/                       # Excel download page
    │   │   └── shared/layout/shell/           # Sidebar + toolbar shell
    │   ├── environments/
    │   │   ├── environment.ts        # Dev: localhost:3000
    │   │   └── environment.prod.ts   # Prod: Apache reverse proxy /api
    │   └── styles.scss               # DE DOT dark theme, Material overrides
    ├── angular.json
    └── package.json
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
# Set environment variables (optional – defaults work for local dev):
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

### Angular Signals (SIGNALS – desired skill)
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
# Apache httpd.conf – reverse proxy for TMC backend
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
**Delaware DOT Traffic Management Center Product Specialist** role.

*Technologies: Angular 17 · TypeScript · NestJS · Node.js · MongoDB · Socket.io · ExcelJS ·
SNMP/NTCIP · LDAP · JWT · Angular Material · Angular Signals · Oracle/MySQL/PostgreSQL DDL*
