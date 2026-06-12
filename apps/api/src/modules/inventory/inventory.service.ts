import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PurchaseOrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import type { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto.js";
import type { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto.js";

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getTransactions(user: RequestUser) {
    const records = await this.prisma.inventoryTransaction.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { material: true, warehouse: true },
      orderBy: { transactionTime: "desc" }
    });

    return records.map((record) => ({
      id: record.id,
      materialCode: record.material.code,
      materialName: record.material.name,
      transactionType: record.transactionType,
      quantity: record.quantity,
      warehouseName: record.warehouse.name,
      transactionTime: record.transactionTime
    }));
  }

  async getPurchaseOrders(user: RequestUser) {
    const records = await this.prisma.purchaseOrder.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { supplier: true, material: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }]
    });

    return records.map((record) => ({
      id: record.id,
      orderNo: record.orderNo,
      supplierName: record.supplier.name,
      materialCode: record.material.code,
      quantity: record.quantity,
      dueDate: record.dueDate,
      status: record.status,
      approvalRemark: record.approvalRemark
    }));
  }

  getReceipts(user: RequestUser) {
    return this.prisma.inspection.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId, type: "IQC" },
      orderBy: { inspectionNo: "desc" }
    });
  }

  async createPurchaseOrder(user: RequestUser, dto: CreatePurchaseOrderDto) {
    await this.requirePermission(user, "inventory:manage");
    const order = await this.prisma.purchaseOrder.create({
      data: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        orderNo: dto.orderNo,
        supplierId: dto.supplierId,
        materialId: dto.materialId,
        quantity: dto.quantity,
        dueDate: new Date(dto.dueDate)
      }
    });
    await this.auditService.log(user.tenantId, "CREATE_PURCHASE_ORDER", "PurchaseOrder", order.id, dto, user.userId);
    return order;
  }

  async updatePurchaseOrder(user: RequestUser, id: string, dto: UpdatePurchaseOrderDto) {
    await this.requirePermission(user, "inventory:manage");
    const existing = await this.getPurchaseOrderOrThrow(user, id);
    if (existing.status !== PurchaseOrderStatus.DRAFT && existing.status !== PurchaseOrderStatus.REJECTED) {
      throw new BadRequestException("仅草稿或驳回状态采购单允许编辑");
    }
    const updated: Record<string, unknown> = { ...dto };
    if (dto.dueDate) updated.dueDate = new Date(dto.dueDate);
    const order = await this.prisma.purchaseOrder.update({ where: { id }, data: updated });
    await this.auditService.log(user.tenantId, "UPDATE_PURCHASE_ORDER", "PurchaseOrder", id, dto, user.userId);
    return order;
  }

  async submitPurchaseOrder(user: RequestUser, id: string) {
    await this.requirePermission(user, "inventory:purchase:submit");
    const existing = await this.getPurchaseOrderOrThrow(user, id);
    if (existing.status !== PurchaseOrderStatus.DRAFT && existing.status !== PurchaseOrderStatus.REJECTED) {
      throw new BadRequestException("当前状态不允许提交审批");
    }

    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedBy: user.userId,
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        approvalRemark: null
      }
    });
    await this.auditService.log(user.tenantId, "SUBMIT_PURCHASE_ORDER", "PurchaseOrder", id, {}, user.userId);
    return order;
  }

  async approvePurchaseOrder(user: RequestUser, id: string) {
    await this.requirePermission(user, "inventory:purchase:approve");
    const existing = await this.getPurchaseOrderOrThrow(user, id);
    if (existing.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException("仅已提交采购单允许审批");
    }
    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: user.userId,
        rejectedAt: null,
        rejectedBy: null,
        approvalRemark: null
      }
    });
    await this.auditService.log(user.tenantId, "APPROVE_PURCHASE_ORDER", "PurchaseOrder", id, {}, user.userId);
    return order;
  }

  async rejectPurchaseOrder(user: RequestUser, id: string, remark?: string) {
    await this.requirePermission(user, "inventory:purchase:approve");
    const existing = await this.getPurchaseOrderOrThrow(user, id);
    if (existing.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException("仅已提交采购单允许驳回");
    }
    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: user.userId,
        approvedAt: null,
        approvedBy: null,
        approvalRemark: remark?.trim() || null
      }
    });
    await this.auditService.log(user.tenantId, "REJECT_PURCHASE_ORDER", "PurchaseOrder", id, { remark }, user.userId);
    return order;
  }

  private async getPurchaseOrderOrThrow(user: RequestUser, id: string) {
    const existing = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) {
      throw new NotFoundException("采购单不存在");
    }
    return existing;
  }

  private async requirePermission(user: RequestUser, permission: string) {
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

    const permissions = record.roleAssignments.flatMap((assignment) =>
      assignment.role.permissions.map((item) => item.code)
    );
    if (!permissions.includes(permission)) {
      throw new ForbiddenException("当前账号无权执行该操作");
    }
  }
}
