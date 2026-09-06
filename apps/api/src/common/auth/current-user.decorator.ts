import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from './authenticated-user';

/** `@CurrentUser()` — o utilizador autenticado pelo guard global. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  if (!request.user) {
    throw new Error('CurrentUser usado numa rota sem autenticação');
  }
  return request.user;
});
