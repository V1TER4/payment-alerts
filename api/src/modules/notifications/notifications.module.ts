import { Module } from '@nestjs/common';

import { CalendarModule } from '../../infra/calendar/calendar.module';
import { EmailNotifier } from '../../infra/notifiers/email.notifier';
import { SmsNotifier, WhatsAppNotifier } from '../../infra/notifiers/http.notifier';
import { AccessControlModule } from '../../shared/access-control.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { BillsModule } from '../bills/bills.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, CalendarModule, BillsModule, AccessControlModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailNotifier, SmsNotifier, WhatsAppNotifier],
  exports: [NotificationsService],
})
export class NotificationsModule {}
