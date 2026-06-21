import { Module } from '@nestjs/common';

import { CalendarModule } from '../../infra/calendar/calendar.module';
import { AccessControlModule } from '../../shared/access-control.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';

@Module({
  imports: [PrismaModule, CalendarModule, AccessControlModule],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
