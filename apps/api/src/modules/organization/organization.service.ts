import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getFactories(user: RequestUser) {
    return this.prisma.userFactoryScope.findMany({
      where: { userId: user.userId },
      include: { factory: true }
    }).then((records) => records.map((record) => record.factory));
  }

  async switchFactory(user: RequestUser, factoryId: string) {
    const scope = await this.prisma.userFactoryScope.findUnique({
      where: {
        userId_factoryId: {
          userId: user.userId,
          factoryId
        }
      }
    });

    if (!scope) {
      throw new ForbiddenException("无权切换到该工厂");
    }

    await this.prisma.user.update({
      where: { id: user.userId },
      data: { defaultFactoryId: factoryId }
    });

    return { success: true, factoryId };
  }

  async getOrganizations(user: RequestUser) {
    return this.prisma.organization.findMany({
      where: { tenantId: user.tenantId },
      include: { factories: true, departments: true }
    });
  }
}
