import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { IncidentService } from './incident.service';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  IncidentFilterDto,
} from './incident.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('incidents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('api/incidents')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  /**
   * POST /api/incidents
   * Creates a new incident and broadcasts to all connected TMC operators via WebSocket.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report a new traffic incident' })
  @ApiResponse({ status: 201, description: 'Incident created and operators notified.' })
  create(@Body() dto: CreateIncidentDto) {
    return this.incidentService.create(dto);
  }

  /**
   * GET /api/incidents
   * Returns paginated, filtered incidents. Supports status, severity, type, date range.
   */
  @Get()
  @ApiOperation({ summary: 'List incidents with optional filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated incident list with total count.' })
  findAll(@Query() filter: IncidentFilterDto) {
    return this.incidentService.findAll(filter);
  }

  /**
   * GET /api/incidents/summary
   * Dashboard statistics – active counts by type and severity.
   */
  @Get('summary')
  @ApiOperation({ summary: 'Dashboard summary – active incidents by type & severity' })
  getSummary() {
    return this.incidentService.getDashboardSummary();
  }

  /**
   * GET /api/incidents/:id
   * Fetch a single incident with full timeline history.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get single incident with full activity timeline' })
  @ApiParam({ name: 'id', example: 'TMC-2026-01000' })
  findOne(@Param('id') id: string) {
    return this.incidentService.findOne(id);
  }

  /**
   * PATCH /api/incidents/:id
   * Update incident status, responder, or add a timeline note.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update incident – status, responder, notes' })
  @ApiParam({ name: 'id', example: 'TMC-2026-01000' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @Request() req: any,
  ) {
    if (!dto.operator) dto.operator = req.user?.username ?? 'operator';
    return this.incidentService.update(id, dto);
  }

  /**
   * DELETE /api/incidents/:id
   * Soft-closes an incident (TMC policy: records are never hard-deleted).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close (soft-delete) an incident' })
  @ApiParam({ name: 'id', example: 'TMC-2026-01000' })
  close(@Param('id') id: string, @Request() req: any) {
    return this.incidentService.close(id, req.user?.username ?? 'operator');
  }
}
