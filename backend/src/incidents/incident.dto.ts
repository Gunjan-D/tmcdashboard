import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from './incident.schema';

class CoordinatesDto {
  @ApiProperty({ example: 39.2976 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -75.6049 })
  @IsNumber()
  lng: number;
}

export class CreateIncidentDto {
  @ApiProperty({ enum: IncidentType, example: IncidentType.ACCIDENT })
  @IsEnum(IncidentType)
  type: IncidentType;

  @ApiPropertyOptional({ enum: IncidentSeverity, default: IncidentSeverity.MODERATE })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiProperty({ example: 'I-95 NB MM 42.3 near Smyrna, DE' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiPropertyOptional({ type: CoordinatesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @ApiProperty({ example: 'Multi-vehicle accident blocking 2 lanes. EMS on scene.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Unit 7 – DSP Troop 3' })
  @IsOptional()
  @IsString()
  responderUnit?: string;

  @ApiPropertyOptional({ type: [String], example: ['Lane 1', 'Lane 2'] })
  @IsOptional()
  @IsArray()
  affectedLanes?: string[];

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  estimatedClearanceMinutes?: number;

  @ApiProperty({ example: 'CCTV-Camera-047' })
  @IsNotEmpty()
  @IsString()
  reportedBy: string;
}

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ example: 'DSP unit has cleared the scene.' })
  @IsOptional()
  @IsString()
  timelineNote?: string;

  @ApiPropertyOptional({ example: 'operator-jsmith' })
  @IsOptional()
  @IsString()
  operator?: string;
}

export class IncidentFilterDto {
  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ enum: IncidentType })
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}
