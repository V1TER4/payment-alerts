import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

import { env } from '../../shared/config/env';
import { Notifier, NotifierPayload } from '../../modules/notifications/interfaces/notifier.interface';

@Injectable()
export class EmailNotifier implements Notifier {
  private readonly logger = new Logger(EmailNotifier.name);
  channel = NotificationChannel.EMAIL;

  async send(payload: NotifierPayload): Promise<{ provider: string; providerId?: string }> {
    this.logger.log(`Sending email to ${payload.to}: ${payload.subject}`);

    // Verifica se as configurações do Mailgun estão disponíveis
    if (!env.mailgunApiKey || !env.mailgunDomain) {
      this.logger.warn('Mailgun not configured, using mock provider');
      return { provider: 'mock-email', providerId: `mock-${Date.now()}` };
    }

    try {
      const mailgun = new Mailgun(FormData);

      const client = mailgun.client({
        username: 'api',
        key: env.mailgunApiKey,
      });

      this.logger.debug(`Mailgun config - domain: ${env.mailgunDomain}, from: ${env.emailFrom}`);

      const result = await client.messages.create(env.mailgunDomain, {
        from: env.emailFrom,
        to: [payload.to],
        subject: payload.subject,
        text: payload.message,
      });

      this.logger.log(`Email sent successfully via Mailgun, ID: ${result.id}`);

      return {
        provider: 'mailgun',
        providerId: result.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
