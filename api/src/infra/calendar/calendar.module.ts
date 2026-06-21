import { Module } from '@nestjs/common';

import { HolidaysModule } from '../../modules/holidays/holidays.module';
import { CalendarService } from './calendar.service';

@Module({
  imports: [HolidaysModule],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
