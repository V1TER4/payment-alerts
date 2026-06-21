import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/prisma/prisma.service';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  permissions: true,
  notificationChannels: true,
  reminderDays: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  }

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: userSelect,
    });
  }

  updatePreferences(
    id: string,
    data: Prisma.UserUpdateInput,
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  updatePermissions(id: string, permissions: Prisma.JsonValue) {
    return this.prisma.user.update({
      where: { id },
      data: { permissions: permissions as Prisma.InputJsonValue },
      select: userSelect,
    });
  }
}
