import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { UserContext } from '../../shared/domain/user-context.interface';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { ListBillsQueryDto } from './dto/list-bills.query.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@ApiTags('bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @RequirePermissions('bills.view')
  @ApiOperation({ summary: 'Lista as contas do usuário com filtros de período e status' })
  @ApiQuery({ name: 'from', required: false, example: '2026-08-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-08-31' })
  @ApiQuery({ name: 'status', required: false, example: 'PENDING' })
  @ApiQuery({ name: 'categoryId', required: false, example: 'ckz8x9abc0000b9x0c1d2e3f4' })
  @ApiOkResponse({ description: 'Lista de contas retornada com sucesso.' })
  @Get()
  list(@CurrentUser() user: UserContext, @Query() query: ListBillsQueryDto) {
    return this.billsService.list(user.sub, query);
  }

  @RequirePermissions('bills.view')
  @ApiOperation({ summary: 'Retorna uma conta específica' })
  @ApiParam({ name: 'id', example: 'ckz8x9abc0000b9x0c1d2e3f4' })
  @ApiOkResponse({ description: 'Conta localizada com sucesso.' })
  @Get(':id')
  findOne(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.billsService.findById(user.sub, id);
  }

  @RequirePermissions('bills.create')
  @ApiOperation({ summary: 'Cria uma nova conta a pagar' })
  @ApiBody({ type: CreateBillDto })
  @ApiOkResponse({ description: 'Conta criada com sucesso.' })
  @Post()
  create(@CurrentUser() user: UserContext, @Body() dto: CreateBillDto) {
    return this.billsService.create(user.sub, dto);
  }

  @RequirePermissions('bills.update')
  @ApiOperation({ summary: 'Atualiza uma conta existente' })
  @ApiParam({ name: 'id', example: 'ckz8x9abc0000b9x0c1d2e3f4' })
  @ApiBody({ type: UpdateBillDto })
  @ApiOkResponse({ description: 'Conta atualizada com sucesso.' })
  @Patch(':id')
  update(@CurrentUser() user: UserContext, @Param('id') id: string, @Body() dto: UpdateBillDto) {
    return this.billsService.update(user.sub, id, dto);
  }

  @RequirePermissions('bills.delete')
  @ApiOperation({ summary: 'Remove uma conta' })
  @ApiParam({ name: 'id', example: 'ckz8x9abc0000b9x0c1d2e3f4' })
  @ApiOkResponse({ description: 'Conta removida com sucesso.' })
  @Delete(':id')
  remove(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.billsService.remove(user.sub, id);
  }
}
