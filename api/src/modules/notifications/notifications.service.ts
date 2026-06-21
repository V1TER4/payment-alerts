import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationChannel, NotificationStatus, Prisma } from '@prisma/client';

import { CalendarService } from '../../infra/calendar/calendar.service';
import { EmailNotifier } from '../../infra/notifiers/email.notifier';
import { SmsNotifier, WhatsAppNotifier } from '../../infra/notifiers/http.notifier';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { startOfDay } from '../../shared/utils/date.util';
import { BillsService } from '../bills/bills.service';
import { ListNotificationHistoryQueryDto } from './dto/list-notification-history.query.dto';
import { NotifierPayload } from './interfaces/notifier.interface';

type NotificationHistoryItem = Prisma.NotificationHistoryGetPayload<{
  include: { notification: { include: { bill: { include: { category: true } } } } };
}>;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billsService: BillsService,
    private readonly calendarService: CalendarService,
    private readonly emailNotifier: EmailNotifier,
    private readonly whatsAppNotifier: WhatsAppNotifier,
    private readonly smsNotifier: SmsNotifier,
  ) { }

  async listHistory(userId: string, query: ListNotificationHistoryQueryDto): Promise<{ items: NotificationHistoryItem[] }> {
    return {
      items: await this.prisma.notificationHistory.findMany({
        where: {
          userId,
          ...(query.from || query.to
            ? {
              sentAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
            : {}),
        },
        include: {
          notification: {
            include: {
              bill: {
                include: { category: true },
              },
            },
          },
        },
        orderBy: { sentAt: 'desc' },
      }),
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM, { timeZone: 'America/Sao_Paulo' })
  async runDailyJob(): Promise<void> {
    await this.syncAndSendDueNotifications();
  }

  async syncAndSendDueNotifications(referenceDate = new Date()): Promise<void> {
    this.logger.log('Starting syncAndSendDueNotifications');
    
    await this.billsService.ensureRecurringOccurrences();
    this.logger.log('Recurring occurrences ensured');
    
    const overdueCount = await this.billsService.syncOverdueBills(referenceDate);
    if (overdueCount > 0) {
      this.logger.log(`Marked ${overdueCount} bills as overdue`);
    }

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        notificationChannels: true,
        reminderDays: true,
      },
    });
    this.logger.log(`Found ${users.length} users`);

    if (users.length === 0) {
      this.logger.log('No users found, skipping notification creation');
      return;
    }

    for (const user of users) {
      this.logger.log(`Processing user ${user.id} (${user.email})`);
      const reminderDays = this.toNumberArray(user.reminderDays);
      const channels = this.toChannelArray(user.notificationChannels);
      this.logger.log(`User reminderDays: ${JSON.stringify(reminderDays)}, channels: ${JSON.stringify(channels)}`);
      
      const bills = await this.billsService.listPendingForNotifications(user.id);
      this.logger.log(`Found ${bills.length} pending bills for user`);

      if (bills.length === 0) {
        continue;
      }

      for (const bill of bills) {
        for (const reminderDay of reminderDays) {
          const scheduledFor = await this.calendarService.notificationDateForDueDate(bill.dueDate, reminderDay);
          this.logger.log(`Bill ${bill.id} - reminder ${reminderDay} days - scheduledFor: ${scheduledFor.toISOString()}`);
          
          for (const channel of channels) {
            const existing = await this.prisma.notification.findFirst({
              where: {
                userId: user.id,
                billId: bill.id,
                channel,
                scheduledFor,
              },
            });

            if (existing) {
              this.logger.log(`Notification already exists for bill ${bill.id}, channel ${channel}`);
              continue;
            }

            const message = this.buildMessage(bill, reminderDay, scheduledFor);
            const title = bill.dueDate < startOfDay(referenceDate) ? 'Conta em atraso' : 'Conta próxima do vencimento';

            await this.prisma.notification.create({
              data: {
                userId: user.id,
                billId: bill.id,
                channel,
                scheduledFor,
                status: NotificationStatus.PENDING,
                title,
                message,
              },
            });
            this.logger.log(`Created pending notification for bill ${bill.id}, channel ${channel}`);
          }
        }
      }
    }

    const dueNotifications = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.PENDING,
        scheduledFor: { lte: referenceDate },
      },
      include: {
        user: true,
        bill: {
          include: { category: true },
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });
    this.logger.log(`Found ${dueNotifications.length} due notifications to send`);

    if (dueNotifications.length === 0) {
      this.logger.log('No due notifications to send');
      return;
    }

    for (const notification of dueNotifications) {
      try {
        this.logger.log(`Sending notification ${notification.id} via ${notification.channel} to ${notification.user.email}`);
        
        const provider = await this.sendByChannel(notification.channel, {
          to: notification.user.email,
          subject: notification.title,
          message: notification.message,
          metadata: {
            notificationId: notification.id,
            billId: notification.billId,
          },
        });
        this.logger.log(`Notification ${notification.id} sent successfully via ${notification.channel} using provider ${provider.provider}`);

        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: referenceDate,
            errorMessage: null,
            histories: {
              create: {
                userId: notification.userId,
                channel: notification.channel,
                status: NotificationStatus.SENT,
                provider: provider.provider,
                providerId: provider.providerId,
                payload: {
                  to: notification.user.email,
                  subject: notification.title,
                  message: notification.message,
                },
              },
            },
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send notification ${notification.id}: ${errorMessage}`);
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
            errorMessage,
            histories: {
              create: {
                userId: notification.userId,
                channel: notification.channel,
                status: NotificationStatus.FAILED,
                errorMessage,
                payload: {
                  to: notification.user.email,
                  subject: notification.title,
                  message: notification.message,
                },
              },
            },
          },
        });
      }
    }
    
    this.logger.log('Finished syncAndSendDueNotifications');
  }

  private async sendByChannel(
    channel: NotificationChannel,
    payload: NotifierPayload,
  ): Promise<{ provider: string; providerId?: string }> {
    console.log(`Sending notification via channel ${channel} with payload:`, payload);
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailNotifier.send(payload);
      case NotificationChannel.SMS:
        return this.smsNotifier.send(payload);
      case NotificationChannel.WHATSAPP:
        return this.whatsAppNotifier.send(payload);
      default:
        return this.emailNotifier.send(payload);
    }
  }

  private buildMessage(bill: { name: string; amount: Prisma.Decimal | string; dueDate: Date; description: string | null }, reminderDay: number, scheduledFor: Date): string {
    const amount = typeof bill.amount === 'string' ? Number(bill.amount) : Number(bill.amount.toString());
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
    const dueDateLabel = dateFormatter.format(bill.dueDate);
    const scheduledForLabel = dateFormatter.format(scheduledFor);
    const reminderLabel = reminderDay === 0 ? 'no dia do vencimento' : `${reminderDay} dia(s) antes`;
    const description = bill.description ? `\nDescrição: ${bill.description}` : '';

    return [
      'Você possui uma conta a vencer.',
      `Conta: ${bill.name}`,
      `Valor: ${formatter.format(amount)}`,
      `Vencimento: ${dueDateLabel}`,
      `Aviso configurado para: ${reminderLabel}`,
      `Envio previsto em: ${scheduledForLabel}`,
      description,
      '',
      'Não esqueça de realizar o pagamento.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private toNumberArray(value: Prisma.JsonValue): number[] {
    if (!Array.isArray(value)) {
      return [7, 3, 1, 0];
    }

    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item >= 0);
  }

  private toChannelArray(value: Prisma.JsonValue): NotificationChannel[] {
    if (!Array.isArray(value)) {
      return [NotificationChannel.EMAIL];
    }

    return value.filter((item): item is NotificationChannel =>
      item === NotificationChannel.EMAIL || item === NotificationChannel.SMS || item === NotificationChannel.WHATSAPP,
    );
  }
}
