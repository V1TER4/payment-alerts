import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Permission } from '../domain/permissions';
import { UserContext } from '../domain/user-context.interface';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: UserContext }>();
    const user = request.user;

    if (!user || user.role === 'SYSTEM') {
      return false;
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    return required.every((permission) => user.permissions?.includes(permission));
  }
}
