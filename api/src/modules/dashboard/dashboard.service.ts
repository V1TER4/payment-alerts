import { Injectable } from '@nestjs/common';
import { BillStatus, Prisma } from '@prisma/client';

import { CalendarService } from '../../infra/calendar/calendar.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { startOfDay } from '../../shared/utils/date.util';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

type DashboardBill = Prisma.BillGetPayload<{ include: { category: true } }>;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarService: CalendarService,
  ) {}

  async overview(userId: string, query: DashboardQueryDto) {
    const range = this.resolveRange(query);
    const now = new Date();
    const paidRange = range ?? this.currentMonthRange(now);
    const dueDateFilter = this.toDateFilter(range ?? this.currentMonthRange(now));

    const [totalToPay, totalPaid, overdueCount, upcomingBills, billsInRange] = await Promise.all([
      this.prisma.bill.aggregate({
        where: {
          userId,
          status: BillStatus.PENDING,
          dueDate: dueDateFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.bill.aggregate({
        where: {
          userId,
          status: BillStatus.PAID,
          lastPaidAt: {
            gte: paidRange.from,
            lte: paidRange.to,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.bill.count({
        where: {
          userId,
          status: { in: [BillStatus.PENDING, BillStatus.OVERDUE] },
          dueDate: { lt: startOfDay(now) },
        },
      }),
      this.prisma.bill.findMany({
        where: {
          userId,
          status: BillStatus.PENDING,
          dueDate: {
            gte: now,
            lte: range ? range.to : this.endOfMonth(now),
          },
        },
        include: { category: true },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }) as Promise<DashboardBill[]>,
      this.prisma.bill.findMany({
        where: {
          userId,
          dueDate: dueDateFilter,
        },
        include: { category: true },
        orderBy: { dueDate: 'asc' },
      }) as Promise<DashboardBill[]>,
    ]);

    return {
      period: {
        from: (range ?? this.currentMonthRange(now)).from,
        to: (range ?? this.currentMonthRange(now)).to,
      },
      metrics: {
        totalToPay: this.toMoney(totalToPay._sum?.amount),
        totalPaid: this.toMoney(totalPaid._sum?.amount),
        overdueCount,
      },
      upcomingBills: await Promise.all(upcomingBills.map((bill) => this.mapBill(bill))),
      billsInRange: await Promise.all(billsInRange.map((bill) => this.mapBill(bill))),
    };
  }

  private resolveRange(query: DashboardQueryDto): { from: Date; to: Date } | null {
    if (!query.from && !query.to) {
      return null;
    }

    return {
      from: query.from ? new Date(query.from) : this.startOfMonth(new Date()),
      to: query.to ? new Date(query.to) : this.endOfMonth(new Date()),
    };
  }

  private currentMonthRange(reference: Date): { from: Date; to: Date } {
    return {
      from: this.startOfMonth(reference),
      to: this.endOfMonth(reference),
    };
  }

  private toDateFilter(range: { from: Date; to: Date }): Prisma.DateTimeFilter {
    return {
      gte: range.from,
      lte: range.to,
    };
  }

  private startOfMonth(date: Date): Date {
    const copy = new Date(date);
    copy.setDate(1);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfMonth(date: Date): Date {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + 1, 0);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private toMoney(value: Prisma.Decimal | null | undefined): number {
    return value ? Number(value.toString()) : 0;
  }

  private async mapBill(bill: DashboardBill) {
    const isBusinessDay = await this.calendarService.isBusinessDay(bill.dueDate);

    return {
      id: bill.id,
      name: bill.name,
      description: bill.description,
      amount: bill.amount.toString(),
      dueDate: bill.dueDate,
      status: bill.status,
      isRecurring: bill.isRecurring,
      recurrenceFrequency: bill.recurrenceFrequency,
      categoryName: bill.category?.name ?? null,
      categoryColor: bill.category?.color ?? null,
      isDueDateNonBusinessDay: !isBusinessDay,
    };
  }
}
