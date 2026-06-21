import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillStatus, RecurrenceFrequency } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBillDto {
  @ApiProperty({ example: 'Internet' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Plano empresarial do escritório' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 129.9 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: '2026-08-15', description: 'Obrigatório apenas para contas não recorrentes.' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Serviços' })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({ example: 'ckz8x9abc0000b9x0c1d2e3f4' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: RecurrenceFrequency, example: RecurrenceFrequency.MONTHLY })
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  recurrenceFrequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 31 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  recurrenceDayOfMonth?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 6, description: '0 = domingo, 6 = sábado.' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  recurrenceDayOfWeek?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 31 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  recurrenceDay?: number;

  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  recurrenceMonth?: number;

  @ApiPropertyOptional({ enum: BillStatus, example: BillStatus.PENDING })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;
}
