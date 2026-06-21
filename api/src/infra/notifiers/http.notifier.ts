import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import axios from 'axios';

import { env } from '../../shared/config/env';
import { Notifier, NotifierPayload } from '../../modules/notifications/interfaces/notifier.interface';

@Injectable()
export class WhatsAppNotifier implements Notifier {
  channel = NotificationChannel.WHATSAPP;

  async send(payload: NotifierPayload): Promise<{ provider: string; providerId?: string }> {
    if (!env.whatsappProviderUrl) {
      return { provider: 'mock-whatsapp', providerId: `wa-${Date.now()}` };
    }

    const response = await axios.post(env.whatsappProviderUrl, payload);
    return { provider: 'whatsapp-provider', providerId: response.data?.id };
  }
}

@Injectable()
export class SmsNotifier implements Notifier {
  channel = NotificationChannel.SMS;

  async send(payload: NotifierPayload): Promise<{ provider: string; providerId?: string }> {
    if (!env.smsProviderUrl) {
      return { provider: 'mock-sms', providerId: `sms-${Date.now()}` };
    }

    const response = await axios.post(env.smsProviderUrl, payload);
    return { provider: 'sms-provider', providerId: response.data?.id };
  }
}
