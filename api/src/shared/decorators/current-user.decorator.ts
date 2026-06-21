import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserContext } from '../domain/user-context.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserContext => {
    const request = context.switchToHttp().getRequest();
    return request.user as UserContext;
  },
);
