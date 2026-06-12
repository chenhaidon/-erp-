import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  override handleRequest<TUser = { factoryId: string }>(
    error: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
    _status?: unknown
  ): TUser {
    if (error || !user) {
      throw error ?? new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const factoryHeader = request.headers["x-factory-id"];

    if (typeof factoryHeader === "string" && factoryHeader.trim()) {
      (user as unknown as { factoryId: string }).factoryId = factoryHeader;
    }

    return user;
  }
}
