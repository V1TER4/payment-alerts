import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationChannel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { UserContext } from '../../shared/domain/user-context.interface';
import { UsersService } from './users.service';

class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({
    enum: NotificationChannel,
    isArray: true,
    example: ['EMAIL', 'WHATSAPP'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  notificationChannels?: Array<'EMAIL' | 'SMS' | 'WHATSAPP'>;

  @ApiPropertyOptional({
    type: [Number],
    example: [7, 3, 1, 0],
    description: 'Lista de antecedências em dias para envio dos alertas.',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Type(() => Number)
  reminderDays?: number[];
}

class UpdateUserPermissionsDto {
  @ApiProperty({ isArray: true, example: ['bills.view', 'bills.create'] })
  @IsArray()
  permissions!: string[];
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Retorna o perfil do usuário autenticado' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Perfil do usuário autenticado retornado com sucesso.' })
  @Get('me')
  me(@CurrentUser() user: UserContext) {
    return this.usersService.findById(user.sub);
  }

  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Atualiza canais de notificação e dias de antecedência' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateNotificationPreferencesDto })
  @ApiOkResponse({ description: 'Preferências atualizadas com sucesso.' })
  @Patch('me/preferences')
  updatePreferences(
    @CurrentUser() user: UserContext,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.usersService.updatePreferences(user.sub, {
      notificationChannels: dto.notificationChannels ?? undefined,
      reminderDays: dto.reminderDays ?? undefined,
    });
  }

  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Lista usuários do sistema' })
  @ApiOkResponse({ description: 'Usuários retornados com sucesso.' })
  @Get()
  list() {
    return this.usersService.list();
  }

  @RequirePermissions('permissions.view')
  @ApiOperation({ summary: 'Retorna permissões do usuário informado' })
  @ApiOkResponse({ description: 'Permissões retornadas com sucesso.' })
  @Get(':id/permissions')
  permissions(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @RequirePermissions('permissions.update')
  @ApiOperation({ summary: 'Atualiza permissões do usuário' })
  @ApiBody({ type: UpdateUserPermissionsDto })
  @ApiOkResponse({ description: 'Permissões atualizadas com sucesso.' })
  @Patch(':id/permissions')
  updatePermissions(@Param('id') id: string, @Body() dto: UpdateUserPermissionsDto) {
    return this.usersService.updatePermissions(id, dto.permissions);
  }
}
