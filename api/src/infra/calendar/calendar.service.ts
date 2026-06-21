import { Injectable } from '@nestjs/common';

import { HolidayScope } from '@prisma/client';

import { HolidaysService } from '../../modules/holidays/holidays.service';

@Injectable()
export class CalendarService {
  constructor(private readonly holidaysService: HolidaysService) {}

  async isBusinessDay(date: Date): Promise<boolean> {
    const day = date.getDay();
    if (day === 0 || day === 6) {
      return false;
    }

    return !(await this.holidaysService.isHoliday(date, HolidayScope.NATIONAL));
  }

  async previousBusinessDay(date: Date): Promise<Date> {
    const cursor = new Date(date);
    cursor.setHours(0, 0, 0, 0);

    while (!(await this.isBusinessDay(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    return this.startOfDay(cursor);
  }

  async nextBusinessDay(date: Date): Promise<Date> {
    const cursor = new Date(date);
    cursor.setHours(0, 0, 0, 0);

    while (!(await this.isBusinessDay(cursor))) {
      cursor.setDate(cursor.getDate() + 1);
    }

    return this.startOfDay(cursor);
  }

  async notificationDateForDueDate(dueDate: Date, reminderDaysAhead: number): Promise<Date> {
    const target = new Date(dueDate);
    target.setDate(target.getDate() - reminderDaysAhead);
    target.setHours(8, 0, 0, 0);

    if (reminderDaysAhead === 0) {
      return (await this.isBusinessDay(dueDate)) ? this.startOfDay(dueDate) : this.nextBusinessDay(dueDate);
    }

    return (await this.isBusinessDay(target)) ? target : this.nextBusinessDay(target);
  }

  startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(8, 0, 0, 0);
    return copy;
  }
}
