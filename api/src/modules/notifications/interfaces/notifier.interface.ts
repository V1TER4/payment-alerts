import { NotificationChannel } from '@prisma/client';

export type NotifierPayload = {
  to: string;
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export interface Notifier {
  channel: NotificationChannel;
  send(payload: NotifierPayload): Promise<{ provider: string; providerId?: string }>;
}
