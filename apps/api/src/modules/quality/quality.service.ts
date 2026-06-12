import { Injectable, NotFoundException } from "@nestjs/common";
import { InspectionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import type { CreateInspectionDto, UpdateInspectionDto } from "./dto/inspection.dto.js";

@Injectable()
export class QualityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getInspections(user: RequestUser) {
    const records = await this.prisma.inspection.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { material: true },
      orderBy: { inspectionNo: "desc" }
    });

    return records.map((record) => ({
      id: record.id,
      inspectionNo: record.inspectionNo,
      type: record.type,
      sourceNo: record.sourceNo,
      materialCode: record.material.code,
      status: record.status,
      inspector: record.inspector
    }));
  }

  async getNcRecords(user: RequestUser) {
    const inspections = await this.prisma.inspection.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId, status: "FAIL" },
      include: { material: true }
    });

    return inspections.map((item) => ({
      id: item.id,
      ncNo: `NC-${item.inspectionNo}`,
      sourceNo: item.sourceNo,
      materialCode: item.material.code,
      status: "OPEN"
    }));
  }

  async getCapa(user: RequestUser) {
    const failedCount = await this.prisma.inspection.count({
      where: { tenantId: user.tenantId, factoryId: user.factoryId, status: "FAIL" }
    });

    return [
      {
        id: "CAPA-001",
        title: "来料检验异常闭环",
        owner: "质量经理",
        status: failedCount > 0 ? "处理中" : "稳定",
        dueDate: "2026-06-12"
      }
    ];
  }

  async createInspection(user: RequestUser, dto: CreateInspectionDto) {
    const inspection = await this.prisma.inspection.create({
      data: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        inspectionNo: dto.inspectionNo,
        type: dto.type,
        sourceNo: dto.sourceNo,
        materialId: dto.materialId,
        inspector: dto.inspector,
        status: InspectionStatus.PENDING
      }
    });
    await this.auditService.log(user.tenantId, "CREATE_INSPECTION", "Inspection", inspection.id, dto, user.userId);
    return inspection;
  }

  async updateInspection(user: RequestUser, id: string, dto: UpdateInspectionDto) {
    const existing = await this.prisma.inspection.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) throw new NotFoundException("检验单不存在");
    const inspection = await this.prisma.inspection.update({ where: { id }, data: dto });
    await this.auditService.log(user.tenantId, "UPDATE_INSPECTION", "Inspection", id, dto, user.userId);
    return inspection;
  }
}
