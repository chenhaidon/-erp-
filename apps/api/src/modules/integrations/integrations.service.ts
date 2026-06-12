import { Injectable } from "@nestjs/common";
import type { IntegrationSystem } from "@prisma/client";
import { AuditService } from "../audit/audit.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async triggerSync(user: RequestUser, system: string) {
    const job = await this.prisma.integrationJob.create({
      data: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        system: system.toUpperCase() as IntegrationSystem,
        direction: "MANUAL",
        status: "PENDING",
        message: "已创建手动同步任务",
        payload: {}
      }
    });

    await this.auditService.log(user.tenantId, "TRIGGER_SYNC", "IntegrationJob", job.id, { system }, user.userId);
    return job;
  }

  getJobs(user: RequestUser) {
    return this.prisma.integrationJob.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      orderBy: { triggeredAt: "desc" }
    });
  }

  getMappings(user: RequestUser) {
    return this.prisma.integrationMapping.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ system: "asc" }, { entityName: "asc" }]
    });
  }
}
