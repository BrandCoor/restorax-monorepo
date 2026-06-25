import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface DecodedUser {
  sub: string;
  email: string;
  role: string;
  restaurantId: string | null;
  branchId: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): DecodedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: DecodedUser }>();
    return request.user;
  },
);
