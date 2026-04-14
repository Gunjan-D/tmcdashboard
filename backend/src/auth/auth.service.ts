import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

/**
 * AuthService — handles credential validation and JWT issuance.
 *
 * LDAP Integration:
 *  In production this service connects to the State of Delaware Active Directory
 *  (LDAP/Active Directory) to authenticate TMC operators using their state
 *  network credentials. The ldapjs library is used for LDAP BIND operations.
 *
 *  For the demo environment, a local user store with bcrypt-hashed passwords
 *  is used, matching the same interface the LDAP integration would provide.
 *
 * Security:
 *  - Passwords hashed with bcrypt (cost factor 12)
 *  - JWT access tokens (8 h expiry, HS256 — swap to RS256 in production)
 *  - Sensitive fields (password) never included in JWT payload
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /** Demo user store – replace with LDAP bind in production. */
  private readonly users = [
    {
      id: 1,
      username: 'operator.jsmith',
      passwordHash: bcrypt.hashSync('Tmc@2026!', 12),
      role: 'OPERATOR',
      fullName: 'John Smith',
      email: 'jsmith@dot.delaware.gov',
    },
    {
      id: 2,
      username: 'supervisor.mjones',
      passwordHash: bcrypt.hashSync('Super@2026!', 12),
      role: 'SUPERVISOR',
      fullName: 'Mary Jones',
      email: 'mjones@dot.delaware.gov',
    },
  ];

  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string) {
    // In production: perform LDAP BIND against DE Active Directory
    // const ldapResult = await this.ldapService.authenticate(username, password);
    const user = this.users.find((u) => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      this.logger.warn(`Failed login attempt for username: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    };

    const access_token = this.jwtService.sign(payload);
    this.logger.log(`Operator logged in: ${user.username} [${user.role}]`);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    };
  }

  async validateToken(payload: { sub: number; username: string; role: string }) {
    return payload; // JWT Guard calls this to confirm the token is still valid
  }
}
