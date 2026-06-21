import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { UserContext } from '../../shared/domain/user-context.interface';
import { HolidaysService } from './holidays.service';
import { SyncHolidaysDto } from './dto/sync-holidays.dto';

@ApiTags('holidays')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @ApiOperation({ summary: 'Lista os feriados cadastrados para um ano específico' })
  @ApiParam({ name: 'year', example: 2026 })
  @ApiOkResponse({ description: 'Lista de feriados retornada com sucesso.' })
  @Get(':year')
  list(@Param('year') year: string) {
    return this.holidaysService.list(Number(year));
  }

  @ApiOperation({ summary: 'Sincroniza os feriados nacionais do ano informado' })
  @ApiBody({ type: SyncHolidaysDto })
  @ApiOkResponse({ description: 'Sincronização executada com sucesso.' })
  @Post('sync')
  sync(@CurrentUser() _user: UserContext, @Body() dto: SyncHolidaysDto) {
    return this.holidaysService.syncNationalHolidays(dto.year);
  }
}
