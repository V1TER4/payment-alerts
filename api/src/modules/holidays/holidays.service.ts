import { Injectable } from '@nestjs/common';
import { Holiday, HolidayScope } from '@prisma/client';
import axios from 'axios';

import { env } from '../../shared/config/env';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { endOfDay, startOfDay } from '../../shared/utils/date.util';

type HolidayProviderItem = {
  date: string;
  name: string;
};

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async isHoliday(date: Date, scope: HolidayScope = HolidayScope.NATIONAL): Promise<boolean> {
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        isActive: true,
        scope,
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
      },
    });

    return Boolean(holiday);
  }

  async list(year: number): Promise<{ items: Holiday[] }> {
    const items = await this.prisma.holiday.findMany({
      where: {
        scope: HolidayScope.NATIONAL,
        date: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
      orderBy: { date: 'asc' },
    });

    return { items };
  }

  async syncNationalHolidays(year: number): Promise<number> {
    const existing = await this.prisma.holiday.count({
      where: {
        scope: HolidayScope.NATIONAL,
        date: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
    });

    if (existing > 0) {
      return existing;
    }

    const response = await axios.get<HolidayProviderItem[]>(`${env.holidayProviderUrl}/${year}`);

    await this.prisma.holiday.createMany({
      data: response.data.map((holiday) => ({
        date: new Date(`${holiday.date}T00:00:00.000Z`),
        name: holiday.name,
        scope: HolidayScope.NATIONAL,
        source: 'brasilapi',
      })),
      skipDuplicates: true,
    });

    return response.data.length;
  }

  async upsertManyNational(items: Array<{ date: string; name: string }>): Promise<number> {
    const result = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.holiday.upsert({
          where: {
            date_name_scope: {
              date: new Date(`${item.date}T00:00:00.000Z`),
              name: item.name,
              scope: HolidayScope.NATIONAL,
            },
          },
          create: {
            date: new Date(`${item.date}T00:00:00.000Z`),
            name: item.name,
            scope: HolidayScope.NATIONAL,
            source: 'seed',
          },
          update: {
            source: 'seed',
            isActive: true,
          },
        }),
      ),
    );

    return result.length;
  }

  async ensureYearCached(year: number): Promise<void> {
    await this.syncNationalHolidays(year);
  }

  async holidayExplanations(date: Date): Promise<{ isHoliday: boolean; holidayName?: string }> {
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        scope: HolidayScope.NATIONAL,
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
      },
    });

    return holiday ? { isHoliday: true, holidayName: holiday.name } : { isHoliday: false };
  }

  async upsertHolidayFromSource(date: Date, name: string, scope: HolidayScope): Promise<void> {
    await this.prisma.holiday.upsert({
      where: {
        date_name_scope: {
          date,
          name,
          scope,
        },
      },
      create: {
        date,
        name,
        scope,
        source: 'manual',
      },
      update: {
        isActive: true,
        source: 'manual',
      },
    });
  }
}
