import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PasswordService } from '../../infra/security/password.service';
import { UserDefaultPermissions } from '../../shared/domain/permissions';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SYSTEM';
  permissions: Prisma.JsonValue;
  notificationChannels: Prisma.JsonValue;
  reminderDays: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly categoriesService: CategoriesService,
  ) { }

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: SafeUser }> {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: UserRole.USER,
        permissions: UserDefaultPermissions,
        notificationChannels: ['EMAIL'],
        reminderDays: [7, 3, 1, 0],
      },
    });

    const accessToken = this.sign(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { apiToken: accessToken },
    });

    await this.categoriesService.seedDefaults(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        notificationChannels: user.notificationChannels,
        reminderDays: user.reminderDays,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials - Email');
    }

    if (user.role === UserRole.SYSTEM) {
      throw new UnauthorizedException('SYSTEM users cannot login');
    }

    const valid = await this.passwordService.compare(dto.password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials - Password');
    }

    let token = user.apiToken;
    let shouldUpdateToken = !token;

    if (token) {
      try {
        this.jwtService.verify(token);
      } catch (err) {
        shouldUpdateToken = true;
      }
    }

    if (shouldUpdateToken) {
      token = this.sign(user);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { apiToken: token },
      });
    }

    return {
      accessToken: token as string,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        notificationChannels: user.notificationChannels,
        reminderDays: user.reminderDays,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  private sign(user: Pick<SafeUser, 'id' | 'email' | 'role'>): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
