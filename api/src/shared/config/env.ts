export const env = {
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  holidayProviderUrl:
    process.env.HOLIDAY_PROVIDER_URL ?? 'https://brasilapi.com.br/api/feriados/v1',
  smtpHost: process.env.SMTP_HOST ?? 'localhost',
  smtpPort: Number(process.env.SMTP_PORT ?? 1025),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  whatsappProviderUrl: process.env.WHATSAPP_PROVIDER_URL ?? '',
  smsProviderUrl: process.env.SMS_PROVIDER_URL ?? '',
  mailgunApiKey: process.env.MAILGUN_API_KEY ?? '',
  mailgunDomain: process.env.MAILGUN_DOMAIN ?? '',
  maingunFrom: process.env.EMAIL_FROM ?? 'alerts@payment-alerts.local',
};
