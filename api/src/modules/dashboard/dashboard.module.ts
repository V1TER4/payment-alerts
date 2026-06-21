import { Module } from '@nestjs/common';

import { CalendarModule } from '../../infra/calendar/calendar.module';
import { AccessControlModule } from '../../shared/access-control.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [PrismaModule, CalendarModule, AccessControlModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
