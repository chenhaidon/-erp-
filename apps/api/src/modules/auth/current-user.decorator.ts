import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { RequestUser } from "./interfaces/request-user.interface.js";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
  return request.user;
});
