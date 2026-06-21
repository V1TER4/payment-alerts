import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Moradia' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: '#0ea5e9', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}
