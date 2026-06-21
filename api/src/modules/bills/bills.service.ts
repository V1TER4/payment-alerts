import { Injectable, NotFoundException } from '@nestjs/common';
import { BillStatus, Prisma, RecurrenceFrequency } from '@prisma/client';
import { randomUUID } from 'crypto';

import { CalendarService } from '../../infra/calendar/calendar.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { startOfDay } from '../../shared/utils/date.util';
import { CreateBillDto } from './dto/create-bill.dto';
import { ListBillsQueryDto } from './dto/list-bills.query.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

type BillWithCategory = Prisma.BillGetPayload<{ include: { category: true } }>;

type BillView = {
  id: string;
  userId: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  recurrenceSeriesId: string | null;
  name: string;
  description: string | null;
  amount: string;
  dueDate: Date;
  status: BillStatus;
  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
  recurrenceDayOfMonth: number | null;
  recurrenceDayOfWeek: number | null;
  recurrenceDay: number | null;
  recurrenceMonth: number | null;
  lastPaidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isDueDateNonBusinessDay: boolean;
  adjustedDueDate: Date | null;
};

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarService: CalendarService,
  ) { }

  async list(userId: string, query: ListBillsQueryDto): Promise<{ items: BillView[] }> {
    const items = await this.prisma.bill.findMany({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.from || query.to
          ? {
            dueDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
          : {}),
      },
      include: { category: true },
      orderBy: { dueDate: 'asc' },
    });

    return { items: await Promise.all(items.map((bill) => this.toView(bill))) };
  }

  async findById(userId: string, id: string): Promise<BillView> {
    const bill = await this.prisma.bill.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return this.toView(bill);
  }

  async create(userId: string, dto: CreateBillDto): Promise<BillView> {
    const categoryId = await this.resolveCategoryId(userId, dto.categoryId, dto.categoryName);
    const isRecurring = dto.isRecurring ?? false;
    const recurrenceSeriesId = isRecurring ? randomUUID() : null;
    const dueDate = isRecurring
      ? this.resolveFirstRecurringDueDate(dto)
      : this.requireDueDate(dto.dueDate);

    const bill = await this.prisma.bill.create({
      data: {
        userId,
        categoryId,
        recurrenceSeriesId,
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        dueDate,
        status: dto.status ?? BillStatus.PENDING,
        isRecurring,
        recurrenceFrequency: isRecurring ? dto.recurrenceFrequency ?? RecurrenceFrequency.MONTHLY : null,
        recurrenceDayOfMonth: isRecurring ? this.recurrenceDayOfMonth(dto) : null,
        recurrenceDayOfWeek: isRecurring ? this.recurrenceDayOfWeek(dto) : null,
        recurrenceDay: isRecurring ? this.recurrenceDay(dto) : null,
        recurrenceMonth: isRecurring ? this.recurrenceMonth(dto) : null,
        lastPaidAt: dto.status === BillStatus.PAID ? new Date() : null,
      },
      include: { category: true },
    });

    if (isRecurring && recurrenceSeriesId) {
      await this.ensureFutureOccurrences({
        userId,
        categoryId,
        recurrenceSeriesId,
        bill,
        horizonMonths: 12,
      });
    }

    return this.toView(bill);
  }

  async update(userId: string, id: string, dto: UpdateBillDto): Promise<BillView> {
    const current = await this.prisma.bill.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!current) {
      throw new NotFoundException('Bill not found');
    }

    const categoryId = await this.resolveCategoryId(
      userId,
      dto.categoryId ?? undefined,
      dto.categoryName ?? undefined,
      current.categoryId,
    );
    const isRecurring = dto.isRecurring ?? current.isRecurring;
    const recurrenceSeriesId = isRecurring ? randomUUID() : null;
    const nextStatus = dto.status ?? current.status;
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : current.dueDate;

    // Check if recurring flag was disabled - remove future occurrences
    const wasRecurring = current.isRecurring;
    const isTurningOffRecurring = wasRecurring && !isRecurring && current.recurrenceSeriesId;

    const bill = await this.prisma.bill.update({
      where: { id },
      data: {
        categoryId,
        name: dto.name ?? current.name,
        description: dto.description ?? current.description,
        amount: dto.amount ?? current.amount,
        dueDate,
        status: nextStatus,
        isRecurring,
        recurrenceSeriesId,
        recurrenceFrequency:
          isRecurring ? dto.recurrenceFrequency ?? current.recurrenceFrequency : null,
        recurrenceDayOfMonth:
          isRecurring ? this.recurrenceDayOfMonth(dto, current) : null,
        recurrenceDayOfWeek:
          isRecurring ? this.recurrenceDayOfWeek(dto, current) : null,
        recurrenceDay: isRecurring ? this.recurrenceDay(dto, current) : null,
        recurrenceMonth: isRecurring ? this.recurrenceMonth(dto, current) : null,
        lastPaidAt:
          nextStatus === BillStatus.PAID
            ? current.lastPaidAt ?? new Date()
            : nextStatus === BillStatus.PENDING
              ? null
              : current.lastPaidAt,
      },
      include: { category: true },
    });

    if (isRecurring && recurrenceSeriesId) {
      await this.ensureFutureOccurrences({
        userId,
        categoryId,
        recurrenceSeriesId,
        bill,
        horizonMonths: 12,
      });
    }

    // If turning off recurring, delete all future occurrences
    if (isTurningOffRecurring) {
      const now = startOfDay(new Date());
      await this.prisma.bill.deleteMany({
        where: {
          recurrenceSeriesId: current.recurrenceSeriesId,
          dueDate: { gt: now },
          id: { not: id },
        },
      });
    }

    return this.toView(bill);
  }

  async remove(userId: string, id: string): Promise<void> {
    const bill = await this.prisma.bill.findFirst({ where: { id, userId } });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    // If it's part of a recurring series, delete all related bills
    if (bill.recurrenceSeriesId) {
      await this.prisma.bill.deleteMany({
        where: { recurrenceSeriesId: bill.recurrenceSeriesId },
      });
    } else {
      await this.prisma.bill.delete({ where: { id } });
    }
  }

  async listPendingForNotifications(userId: string): Promise<BillWithCategory[]> {
    return this.prisma.bill.findMany({
      where: {
        userId,
        status: { in: [BillStatus.PENDING, BillStatus.OVERDUE] },
      },
      include: { category: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async syncOverdueBills(referenceDate = new Date()): Promise<number> {
    const result = await this.prisma.bill.updateMany({
      where: {
        status: BillStatus.PENDING,
        dueDate: {
          lt: startOfDay(referenceDate),
        },
      },
      data: {
        status: BillStatus.OVERDUE,
      },
    });

    return result.count;
  }

  async ensureRecurringOccurrences(userId?: string): Promise<number> {
    const seriesBills = await this.prisma.bill.findMany({
      where: {
        isRecurring: true,
        recurrenceSeriesId: { not: null },
        ...(userId ? { userId } : {}),
      },
      include: { category: true },
      distinct: ['recurrenceSeriesId'],
      orderBy: [{ recurrenceSeriesId: 'asc' }, { dueDate: 'asc' }],
    });

    let created = 0;
    const horizon = this.addMonths(startOfDay(new Date()), 12);

    for (const bill of seriesBills) {
      created += await this.ensureFutureOccurrences({
        userId: bill.userId,
        categoryId: bill.categoryId,
        recurrenceSeriesId: bill.recurrenceSeriesId!,
        bill,
        horizonDate: horizon,
      });
    }

    return created;
  }

  private async ensureFutureOccurrences(params: {
    userId: string;
    categoryId: string | null;
    recurrenceSeriesId: string;
    bill: BillWithCategory;
    horizonMonths?: number;
    horizonDate?: Date;
  }): Promise<number> {
    const horizon = params.horizonDate ?? this.addMonths(startOfDay(new Date()), params.horizonMonths ?? 12);
    let cursor = new Date(params.bill.dueDate);
    let created = 0;

    while (true) {
      const next = this.nextRecurringDate(cursor, params.bill);
      if (next > horizon) {
        break;
      }

      const existing = await this.prisma.bill.findFirst({
        where: {
          userId: params.userId,
          recurrenceSeriesId: params.recurrenceSeriesId,
          dueDate: next,
        },
      });

      if (!existing) {
        await this.prisma.bill.create({
          data: {
            userId: params.userId,
            categoryId: params.categoryId,
            recurrenceSeriesId: params.recurrenceSeriesId,
            name: params.bill.name,
            description: params.bill.description,
            amount: params.bill.amount,
            dueDate: next,
            status: BillStatus.PENDING,
            isRecurring: false,
            recurrenceFrequency: params.bill.recurrenceFrequency,
            recurrenceDayOfMonth: params.bill.recurrenceDayOfMonth,
            recurrenceDayOfWeek: params.bill.recurrenceDayOfWeek,
            recurrenceDay: params.bill.recurrenceDay,
            recurrenceMonth: params.bill.recurrenceMonth,
          },
        });
        created += 1;
      }

      cursor = next;
    }

    return created;
  }

  private resolveFirstRecurringDueDate(dto: CreateBillDto): Date {
    const now = startOfDay(new Date());
    const frequency = dto.recurrenceFrequency ?? RecurrenceFrequency.MONTHLY;

    if (frequency === RecurrenceFrequency.WEEKLY) {
      return this.firstWeeklyDate(now, dto.recurrenceDayOfWeek ?? now.getDay());
    }

    if (frequency === RecurrenceFrequency.YEARLY) {
      return this.firstYearlyDate(now, dto.recurrenceDay ?? now.getDate(), dto.recurrenceMonth ?? now.getMonth() + 1);
    }

    return this.firstMonthlyDate(now, dto.recurrenceDayOfMonth ?? now.getDate());
  }

  private nextRecurringDate(current: Date, bill: BillWithCategory): Date {
    switch (bill.recurrenceFrequency) {
      case RecurrenceFrequency.WEEKLY:
        return this.advanceWeeklyDate(current, bill.recurrenceDayOfWeek ?? current.getDay());
      case RecurrenceFrequency.YEARLY:
        return this.advanceYearlyDate(
          current,
          bill.recurrenceDay ?? current.getDate(),
          bill.recurrenceMonth ?? current.getMonth() + 1,
        );
      case RecurrenceFrequency.MONTHLY:
      default:
        return this.advanceMonthlyDate(current, bill.recurrenceDayOfMonth ?? current.getDate());
    }
  }

  private firstWeeklyDate(current: Date, dayOfWeek: number): Date {
    const date = startOfDay(current);
    const delta = (dayOfWeek - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + delta);
    return date;
  }

  private advanceWeeklyDate(current: Date, dayOfWeek: number): Date {
    const date = startOfDay(current);
    date.setDate(date.getDate() + 7);
    return this.withDayOfWeek(date, dayOfWeek);
  }

  private firstMonthlyDate(current: Date, dayOfMonth: number): Date {
    const date = startOfDay(current);
    const candidate = this.withDayOfMonth(date, dayOfMonth);
    if (candidate < current) {
      return this.withDayOfMonth(this.addMonths(date, 1), dayOfMonth);
    }
    return candidate;
  }

  private advanceMonthlyDate(current: Date, dayOfMonth: number): Date {
    return this.withDayOfMonth(this.addMonths(current, 1), dayOfMonth);
  }

  private firstYearlyDate(current: Date, day: number, month: number): Date {
    const date = startOfDay(current);
    const candidate = this.withMonthAndDay(date, month, day);
    if (candidate < current) {
      return this.withMonthAndDay(this.addYears(date, 1), month, day);
    }
    return candidate;
  }

  private advanceYearlyDate(current: Date, day: number, month: number): Date {
    return this.withMonthAndDay(this.addYears(current, 1), month, day);
  }

  private withDayOfMonth(date: Date, dayOfMonth: number): Date {
    const copy = startOfDay(date);
    const maxDay = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
    copy.setDate(Math.min(dayOfMonth, maxDay));
    return copy;
  }

  private withDayOfWeek(date: Date, dayOfWeek: number): Date {
    const copy = startOfDay(date);
    const delta = (dayOfWeek - copy.getDay() + 7) % 7;
    copy.setDate(copy.getDate() + delta);
    return copy;
  }

  private withMonthAndDay(date: Date, month: number, day: number): Date {
    const copy = startOfDay(date);
    const targetMonth = Math.min(Math.max(month, 1), 12) - 1;
    const maxDay = new Date(copy.getFullYear(), targetMonth + 1, 0).getDate();
    copy.setMonth(targetMonth, Math.min(day, maxDay));
    return copy;
  }

  private addMonths(date: Date, months: number): Date {
    const copy = startOfDay(date);
    copy.setMonth(copy.getMonth() + months);
    return copy;
  }

  private addYears(date: Date, years: number): Date {
    const copy = startOfDay(date);
    copy.setFullYear(copy.getFullYear() + years);
    return copy;
  }

  private recurrenceDayOfMonth(dto: Partial<CreateBillDto>, current?: BillWithCategory | null): number | null {
    const frequency = dto.recurrenceFrequency ?? current?.recurrenceFrequency ?? null;
    if (frequency === RecurrenceFrequency.MONTHLY) {
      return dto.recurrenceDayOfMonth ?? current?.recurrenceDayOfMonth ?? null;
    }
    return current?.recurrenceDayOfMonth ?? null;
  }

  private recurrenceDayOfWeek(dto: Partial<CreateBillDto>, current?: BillWithCategory | null): number | null {
    const frequency = dto.recurrenceFrequency ?? current?.recurrenceFrequency ?? null;
    if (frequency === RecurrenceFrequency.WEEKLY) {
      return dto.recurrenceDayOfWeek ?? current?.recurrenceDayOfWeek ?? null;
    }
    return current?.recurrenceDayOfWeek ?? null;
  }

  private recurrenceDay(dto: Partial<CreateBillDto>, current?: BillWithCategory | null): number | null {
    const frequency = dto.recurrenceFrequency ?? current?.recurrenceFrequency ?? null;
    if (frequency === RecurrenceFrequency.YEARLY) {
      return dto.recurrenceDay ?? current?.recurrenceDay ?? null;
    }
    return current?.recurrenceDay ?? null;
  }

  private recurrenceMonth(dto: Partial<CreateBillDto>, current?: BillWithCategory | null): number | null {
    const frequency = dto.recurrenceFrequency ?? current?.recurrenceFrequency ?? null;
    if (frequency === RecurrenceFrequency.YEARLY) {
      return dto.recurrenceMonth ?? current?.recurrenceMonth ?? null;
    }
    return current?.recurrenceMonth ?? null;
  }

  private requireDueDate(dueDate?: string): Date {
    if (!dueDate) {
      throw new NotFoundException('Due date is required for non-recurring bills');
    }

    return startOfDay(new Date(dueDate));
  }

  private async resolveCategoryId(
    userId: string,
    categoryId?: string | null,
    categoryName?: string | null,
    currentCategoryId?: string | null,
  ): Promise<string | null> {
    if (categoryId) {
      const category = await this.prisma.category.findFirst({ where: { id: categoryId, userId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      return categoryId;
    }

    if (!categoryName?.trim()) {
      return currentCategoryId ?? null;
    }

    const category = await this.prisma.category.upsert({
      where: {
        userId_name: {
          userId,
          name: categoryName.trim(),
        },
      },
      create: {
        userId,
        name: categoryName.trim(),
      },
      update: {},
    });

    return category.id;
  }

  private async toView(bill: BillWithCategory): Promise<BillView> {
    const isBusinessDay = await this.calendarService.isBusinessDay(bill.dueDate);
    const adjustedDueDate = isBusinessDay ? null : await this.calendarService.previousBusinessDay(bill.dueDate);

    return {
      id: bill.id,
      userId: bill.userId,
      categoryId: bill.categoryId,
      categoryName: bill.category?.name ?? null,
      categoryColor: bill.category?.color ?? null,
      recurrenceSeriesId: bill.recurrenceSeriesId,
      name: bill.name,
      description: bill.description,
      amount: bill.amount.toString(),
      dueDate: bill.dueDate,
      status: bill.status,
      isRecurring: bill.isRecurring,
      recurrenceFrequency: bill.recurrenceFrequency,
      recurrenceDayOfMonth: bill.recurrenceDayOfMonth,
      recurrenceDayOfWeek: bill.recurrenceDayOfWeek,
      recurrenceDay: bill.recurrenceDay,
      recurrenceMonth: bill.recurrenceMonth,
      lastPaidAt: bill.lastPaidAt,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
      isDueDateNonBusinessDay: !isBusinessDay,
      adjustedDueDate,
    };
  }
}
