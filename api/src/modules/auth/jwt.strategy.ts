import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { UserContext } from '../../shared/domain/user-context.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'change-me',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: UserContext): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, permissions: true, apiToken: true },
    });

    if (!user || user.role === 'SYSTEM') {
      throw new UnauthorizedException();
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token || user.apiToken !== token) {
      throw new UnauthorizedException();
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? (user.permissions as string[]) : [],
    };
  }
}
