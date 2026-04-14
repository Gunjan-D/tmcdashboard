import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsNotEmpty() @IsString()
  username: string;

  @IsNotEmpty() @IsString()
  password: string;
}

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Validates credentials against LDAP (or local store in dev).
   * Returns a signed JWT bearer token valid for 8 hours.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Operator login – returns JWT bearer token' })
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }
}
