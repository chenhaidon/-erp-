import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RefreshDto } from "./dto/refresh.dto.js";
import type { RequestUser } from "./interfaces/request-user.interface.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { username: dto.username },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: { permissions: true }
            }
          }
        }
      }
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    if (!user.defaultFactoryId) {
      throw new UnauthorizedException("用户未配置默认工厂");
    }

    const payload: RequestUser = {
      userId: user.id,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      factoryId: user.defaultFactoryId,
      username: user.username
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get("JWT_ACCESS_SECRET", "smart-erp-access"),
      expiresIn: "8h"
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get("JWT_REFRESH_SECRET", "smart-erp-refresh"),
      expiresIn: "7d"
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        tenantId: user.tenantId,
        organizationId: user.organizationId,
        defaultFactoryId: user.defaultFactoryId,
        roles: user.roleAssignments.map((assignment) => ({
          code: assignment.role.code,
          name: assignment.role.name,
          dataScope: assignment.role.dataScope
        })),
        permissions: user.roleAssignments.flatMap((assignment) =>
          assignment.role.permissions.map((permission) => permission.code)
        )
      }
    };
  }

  async refresh(dto: RefreshDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException("刷新令牌无效");
    }

    const payload: RequestUser = {
      userId: storedToken.user.id,
      tenantId: storedToken.user.tenantId,
      organizationId: storedToken.user.organizationId,
      factoryId: storedToken.user.defaultFactoryId ?? "",
      username: storedToken.user.username
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get("JWT_ACCESS_SECRET", "smart-erp-access"),
      expiresIn: "8h"
    });

    return { accessToken };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
    return { success: true };
  }

  async me(user: RequestUser) {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: { permissions: true }
            }
          }
        }
      }
    });

    return {
      id: record.id,
      username: record.username,
      displayName: record.displayName,
      tenantId: record.tenantId,
      organizationId: record.organizationId,
      defaultFactoryId: user.factoryId,
      roles: record.roleAssignments.map((assignment) => ({
        code: assignment.role.code,
        name: assignment.role.name,
        dataScope: assignment.role.dataScope
      })),
      permissions: record.roleAssignments.flatMap((assignment) =>
        assignment.role.permissions.map((permission) => permission.code)
      )
    };
  }
}
