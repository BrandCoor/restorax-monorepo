import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface UserPayload {
  sub: string;
  email: string;
  role: string;
  restaurantId: string | null;
  branchId: string | null;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: UserPayload }>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException(
        'Bu işlem için gerekli yetkiye sahip değilsiniz.',
      );
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        'Bu işlem için gerekli yetkiye sahip değilsiniz.',
      );
    }

    return true;
  }
}
