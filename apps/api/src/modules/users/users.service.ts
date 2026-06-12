import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuditService } from "../audit/audit.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AssignRolesDto } from "./dto/assign-roles.dto.js";
import type { CreateUserDto } from "./dto/create-user.dto.js";
import type { UpdateUserDto } from "./dto/update-user.dto.js";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getUsers(user: RequestUser) {
    const users = await this.prisma.user.findMany({
      where: { tenantId: user.tenantId },
      include: {
        roleAssignments: { include: { role: true } }
      },
      orderBy: { username: "asc" }
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      status: u.status,
      organizationId: u.organizationId,
      departmentId: u.departmentId,
      defaultFactoryId: u.defaultFactoryId,
      roles: u.roleAssignments.map((ra) => ({ id: ra.role.id, code: ra.role.code, name: ra.role.name }))
    }));
  }

  async createUser(user: RequestUser, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId: user.tenantId, username: dto.username }
    });
    if (existing) throw new ConflictException("用户名已存在");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        tenantId: user.tenantId,
        organizationId: dto.organizationId,
        departmentId: dto.departmentId,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
        defaultFactoryId: dto.defaultFactoryId,
        roleAssignments: dto.roleIds?.length
          ? { create: dto.roleIds.map((roleId) => ({ roleId })) }
          : undefined
      }
    });

    await this.auditService.log(user.tenantId, "CREATE_USER", "User", newUser.id, { username: dto.username }, user.userId);
    return { id: newUser.id, username: newUser.username, displayName: newUser.displayName, status: newUser.status };
  }

  async updateUser(user: RequestUser, id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) throw new NotFoundException("用户不存在");

    const updated = await this.prisma.user.update({ where: { id }, data: dto });
    await this.auditService.log(user.tenantId, "UPDATE_USER", "User", id, dto, user.userId);
    return { id: updated.id, username: updated.username, displayName: updated.displayName, status: updated.status };
  }

  async assignRoles(user: RequestUser, id: string, dto: AssignRolesDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) throw new NotFoundException("用户不存在");

    await this.prisma.userRole.deleteMany({ where: { userId: id } });
    if (dto.roleIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ userId: id, roleId }))
      });
    }

    await this.auditService.log(user.tenantId, "ASSIGN_ROLES", "User", id, dto, user.userId);
    return { success: true };
  }

  async deactivateUser(user: RequestUser, id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) throw new NotFoundException("用户不存在");

    await this.prisma.user.update({ where: { id }, data: { status: UserStatus.INACTIVE } });
    await this.auditService.log(user.tenantId, "DEACTIVATE_USER", "User", id, {}, user.userId);
    return { success: true };
  }

  getRoles(user: RequestUser) {
    return this.prisma.role.findMany({
      where: { tenantId: user.tenantId },
      include: { permissions: true },
      orderBy: { code: "asc" }
    });
  }
}
