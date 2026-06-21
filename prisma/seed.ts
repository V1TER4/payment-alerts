import {
  BillStatus,
  PrismaClient,
  RecurrenceFrequency,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const adminDefaultPermissions = [
  'dashboard.view',
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
  'permissions.view',
  'permissions.update',
  'categories.view',
  'categories.create',
  'categories.update',
  'categories.delete',
  'bills.view',
  'bills.create',
  'bills.update',
  'bills.delete',
  'notifications.view',
  'notifications.create',
  'notifications.update',
  'notifications.delete',
  'history.view',
];

const userDefaultPermissions = [
  'dashboard.view',
  'users.view',
  'users.update',
  'categories.view',
  'categories.create',
  'categories.update',
  'categories.delete',
  'bills.view',
  'bills.create',
  'bills.update',
  'bills.delete',
  'notifications.view',
  'history.view',
];

const defaultCategories = [
  'Moradia',
  'Água',
  'Energia',
  'Internet',
  'Telefonia',
  'Streaming',
  'Transporte',
  'Alimentação',
  'Educação',
  'Saúde',
  'Impostos',
  'Cartão de Crédito',
  'Empréstimos',
  'Outros',
];

async function seedDefaultCategories(userId: string): Promise<void> {
  await prisma.$transaction(
    defaultCategories.map((name) =>
      prisma.category.upsert({
        where: { userId_name: { userId, name } },
        create: { userId, name, isDefault: true },
        update: { isDefault: true },
      }),
    ),
  );
}

async function upsertDemoData(): Promise<void> {
  const defaultPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@contas.local' },
    create: {
      name: 'Administrador',
      email: 'admin@contas.local',
      passwordHash: defaultPassword,
      role: UserRole.ADMIN,
      permissions: adminDefaultPermissions,
      notificationChannels: ['EMAIL'],
      reminderDays: [7, 3, 1, 0],
    },
    update: {
      name: 'Administrador',
      role: UserRole.ADMIN,
      permissions: adminDefaultPermissions,
      notificationChannels: ['EMAIL'],
      reminderDays: [7, 3, 1, 0],
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@contas.local' },
    create: {
      name: 'Usuário Demo',
      email: 'demo@contas.local',
      passwordHash: defaultPassword,
      role: UserRole.USER,
      permissions: userDefaultPermissions,
      notificationChannels: ['EMAIL', 'WHATSAPP'],
      reminderDays: [7, 3, 1, 0],
    },
    update: {
      name: 'Usuário Demo',
      role: UserRole.USER,
      permissions: userDefaultPermissions,
      notificationChannels: ['EMAIL', 'WHATSAPP'],
      reminderDays: [7, 3, 1, 0],
    },
  });

  await seedDefaultCategories(admin.id);
  await seedDefaultCategories(demo.id);

  const internet = await prisma.category.findFirst({
    where: { userId: admin.id, name: 'Internet' },
  });

  const energia = await prisma.category.findFirst({
    where: { userId: admin.id, name: 'Energia' },
  });

  if (internet) {
    const existingInternetBill = await prisma.bill.findFirst({
      where: {
        userId: admin.id,
        name: 'Internet Escritório',
      },
    });

    if (!existingInternetBill) {
      await prisma.bill.create({
        data: {
          userId: admin.id,
          categoryId: internet.id,
          name: 'Internet Escritório',
          description: 'Plano empresarial',
          amount: 129.9,
          dueDate: new Date('2026-07-15T00:00:00.000Z'),
          status: BillStatus.PENDING,
          isRecurring: true,
          recurrenceSeriesId: randomUUID(),
          recurrenceFrequency: RecurrenceFrequency.MONTHLY,
          recurrenceDayOfMonth: 15,
        },
      });
    }
  }

  if (energia) {
    const existingEnergyBill = await prisma.bill.findFirst({
      where: {
        userId: admin.id,
        name: 'Energia Escritório',
      },
    });

    if (!existingEnergyBill) {
      await prisma.bill.create({
        data: {
          userId: admin.id,
          categoryId: energia.id,
          name: 'Energia Escritório',
          description: 'Conta de energia do mês',
          amount: 349.45,
          dueDate: new Date('2026-06-18T00:00:00.000Z'),
          status: BillStatus.OVERDUE,
          isRecurring: true,
          recurrenceSeriesId: randomUUID(),
          recurrenceFrequency: RecurrenceFrequency.MONTHLY,
          recurrenceDayOfMonth: 18,
        },
      });
    }
  }

  const demoExistingBill = await prisma.bill.findFirst({
    where: {
      userId: admin.id,
      name: 'Assinatura SaaS',
    },
  });

  if (!demoExistingBill) {
    await prisma.bill.create({
      data: {
        userId: admin.id,
        name: 'Assinatura SaaS',
        description: 'Ferramenta de produtividade',
        amount: 79.9,
        dueDate: new Date('2026-06-25T00:00:00.000Z'),
        status: BillStatus.PAID,
        isRecurring: true,
        recurrenceSeriesId: randomUUID(),
        recurrenceFrequency: RecurrenceFrequency.MONTHLY,
        recurrenceDayOfMonth: 25,
        lastPaidAt: new Date('2026-06-10T00:00:00.000Z'),
      },
    });
  }
}

upsertDemoData()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
