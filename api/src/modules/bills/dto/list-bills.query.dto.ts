import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class ListBillsQueryDto {
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ enum: BillStatus, example: BillStatus.PENDING })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @ApiPropertyOptional({ example: 'ckz8x9abc0000b9x0c1d2e3f4' })
  @IsOptional()
  categoryId?: string;
}
