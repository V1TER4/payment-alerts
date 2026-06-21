import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class SyncHolidaysDto {
  @ApiProperty({ example: 2026, description: 'Ano-base para sincronizar os feriados nacionais.' })
  @IsInt()
  @Min(2000)
  year!: number;

  @ApiPropertyOptional({ example: 35, description: 'Código do estado para futuras extensões de sincronização.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  stateCode?: number;
}
