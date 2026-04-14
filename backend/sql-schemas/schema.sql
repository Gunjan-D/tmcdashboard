-- ============================================================
-- Delaware TMC – Relational Database Schema
-- Supports: Oracle 19c, MySQL 8, PostgreSQL 15, MS SQL Server
-- ============================================================
-- Incidents table (mirrored from MongoDB for BI/reporting)

-- === Oracle / MS SQL Server syntax ===
CREATE TABLE tmc_incidents (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- Oracle; use SERIAL for PG, AUTO_INCREMENT for MySQL
    incident_id     VARCHAR2(20)  NOT NULL UNIQUE,  -- TMC-YYYY-NNNNN
    incident_type   VARCHAR2(30)  NOT NULL,
    severity        VARCHAR2(12)  NOT NULL,
    status          VARCHAR2(16)  NOT NULL DEFAULT 'OPEN',
    location        VARCHAR2(200) NOT NULL,
    lat             NUMBER(9,6),
    lng             NUMBER(9,6),
    description     CLOB,           -- TEXT in PG/MySQL
    responder_unit  VARCHAR2(100),
    reported_by     VARCHAR2(100),
    detected_at     TIMESTAMP     NOT NULL DEFAULT SYSTIMESTAMP,
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP     DEFAULT SYSTIMESTAMP,
    updated_at      TIMESTAMP     DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_inc_status      ON tmc_incidents(status);
CREATE INDEX idx_inc_severity    ON tmc_incidents(severity);
CREATE INDEX idx_inc_detected_at ON tmc_incidents(detected_at DESC);

-- Incident timeline (audit trail)
CREATE TABLE tmc_incident_timeline (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    incident_id VARCHAR2(20) NOT NULL REFERENCES tmc_incidents(incident_id) ON DELETE CASCADE,
    occurred_at TIMESTAMP    NOT NULL DEFAULT SYSTIMESTAMP,
    action      VARCHAR2(500),
    operator    VARCHAR2(100)
);

-- ITS Devices
CREATE TABLE tmc_devices (
    id                 NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    device_id          VARCHAR2(30)  NOT NULL UNIQUE,
    device_name        VARCHAR2(150) NOT NULL,
    device_type        VARCHAR2(30)  NOT NULL,
    status             VARCHAR2(16)  NOT NULL DEFAULT 'UNKNOWN',
    location           VARCHAR2(200),
    lat                NUMBER(9,6),
    lng                NUMBER(9,6),
    ip_address         VARCHAR2(45)  NOT NULL,
    snmp_port          NUMBER(5)     DEFAULT 161,
    snmp_community     VARCHAR2(50)  DEFAULT 'public',
    firmware_version   VARCHAR2(50),
    manufacturer       VARCHAR2(100),
    monitoring_enabled NUMBER(1)     DEFAULT 1,
    failure_count      NUMBER        DEFAULT 0,
    last_polled_at     TIMESTAMP
);

-- Operators (LDAP-synced shadow table)
CREATE TABLE tmc_operators (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username    VARCHAR2(100) NOT NULL UNIQUE,
    full_name   VARCHAR2(200),
    email       VARCHAR2(200),
    role        VARCHAR2(30)  DEFAULT 'OPERATOR',
    active      NUMBER(1)     DEFAULT 1,
    last_login  TIMESTAMP
);

-- Scheduled Report Run Log
CREATE TABLE tmc_report_runs (
    id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    report_type VARCHAR2(50),
    run_at      TIMESTAMP DEFAULT SYSTIMESTAMP,
    status      VARCHAR2(20),
    file_path   VARCHAR2(500),
    rows_count  NUMBER
);

-- ============================================================
-- MySQL 8 equivalent (replace Oracle syntax):
-- NUMBER       → INT / DECIMAL
-- NUMBER(1)    → TINYINT(1)
-- VARCHAR2     → VARCHAR
-- CLOB         → LONGTEXT
-- SYSTIMESTAMP → NOW()
-- GENERATED ALWAYS AS IDENTITY → AUTO_INCREMENT
-- ============================================================

-- ============================================================
-- PostgreSQL 15 equivalent:
-- NUMBER       → INTEGER / NUMERIC
-- VARCHAR2     → VARCHAR
-- CLOB         → TEXT
-- SYSTIMESTAMP → NOW()
-- GENERATED ALWAYS AS IDENTITY → GENERATED ALWAYS AS IDENTITY (same)
-- ============================================================
