import { Injectable } from "@nestjs/common";
import type { AiInteractionType } from "@prisma/client";
import { AuditService } from "../audit/audit.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  private async buildEvidence(user: RequestUser) {
    const [orders, inspections, integrations, equipments] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId },
        include: { product: true }
      }),
      this.prisma.inspection.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId }
      }),
      this.prisma.integrationJob.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId },
        take: 5,
        orderBy: { triggeredAt: "desc" }
      }),
      this.prisma.equipment.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId }
      })
    ]);

    return {
      orders: orders.map((item) => `${item.orderNo}:${item.progress}%`),
      inspections: inspections.map((item) => `${item.inspectionNo}:${item.status}`),
      integrations: integrations.map((item) => `${item.system}:${item.status}`),
      equipments: equipments.map((item) => `${item.code}:${item.healthScore}`)
    };
  }

  private async createInteraction(user: RequestUser, type: AiInteractionType, prompt: string, result: string, evidence: string[]) {
    const interaction = await this.prisma.aiInteraction.create({
      data: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        type,
        prompt,
        result,
        evidence
      }
    });

    await this.auditService.log(user.tenantId, "AI_INTERACTION", "AiInteraction", interaction.id, { type, prompt }, user.userId);
    return interaction;
  }

  async askSchedule(user: RequestUser, prompt: string) {
    const evidence = await this.buildEvidence(user);
    const result = `建议优先保障高优工单 ${evidence.orders[0] ?? "WO-240615"}，并同步检查设备健康与缺料预警。`;
    return this.createInteraction(user, "ASK_SCHEDULE", prompt, result, [...evidence.orders, ...evidence.equipments].slice(0, 5));
  }

  async analyzeRootCause(user: RequestUser, prompt: string) {
    const evidence = await this.buildEvidence(user);
    const result = `当前异常更可能来自设备健康下降与来料/检验等待叠加，而非单一排程问题。`;
    return this.createInteraction(user, "ROOT_CAUSE", prompt, result, [...evidence.equipments, ...evidence.inspections].slice(0, 5));
  }

  async generateSummary(user: RequestUser, prompt: string) {
    const evidence = await this.buildEvidence(user);
    const result = `今日经营摘要：工单推进正常，待处理重点为缺料补货、设备校准和 IQC 放行。`;
    return this.createInteraction(user, "SUMMARY", prompt, result, [...evidence.orders, ...evidence.integrations, ...evidence.inspections].slice(0, 6));
  }
}
