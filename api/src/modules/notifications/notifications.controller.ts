import { Controller, Get, Post, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { UserContext } from '../../shared/domain/user-context.interface';
import { ListNotificationHistoryQueryDto } from './dto/list-notification-history.query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) { }

  @RequirePermissions('history.view')
  @ApiOperation({ summary: 'Lista o histórico de envios do usuário' })
  @ApiQuery({ name: 'from', required: false, example: '2026-08-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-08-31' })
  @ApiOkResponse({ description: 'Histórico retornado com sucesso.' })
  @Get('history')
  history(@CurrentUser() user: UserContext, @Query() query: ListNotificationHistoryQueryDto) {
    return this.notificationsService.listHistory(user.sub, query);
  }

  @RequirePermissions('notifications.create')
  @ApiOperation({ summary: 'Dispara notificações pendentes manualmente' })
  @ApiOkResponse({ description: 'Notificações disparadas com sucesso.' })
  @Post('trigger')
  async trigger() {
    this.logger.log('Triggering notifications manually...');
    try {
      await this.notificationsService.syncAndSendDueNotifications();
      this.logger.log('Notifications triggered successfully');
      return { success: true, message: 'Notificações disparadas com sucesso' };
    } catch (error) {
      this.logger.error('Error triggering notifications', error);
      throw error;
    }
  }
}
