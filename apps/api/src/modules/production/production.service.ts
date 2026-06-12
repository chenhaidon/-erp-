import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ProductionOrderStatus } from "@prisma/client";
import { AuditService } from "../audit/audit.service.js";
import { EventsGateway } from "../events/events.gateway.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ReportOperationDto } from "./dto/report-operation.dto.js";
import type { CreateProductionOrderDto } from "./dto/create-production-order.dto.js";
import type { UpdateProductionOrderDto } from "./dto/update-production-order.dto.js";

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly events: EventsGateway
  ) {}

  private factoryRoom(user: RequestUser) {
    return `tenant:${user.tenantId}:factory:${user.factoryId}`;
  }

  async getKanbanOrders(user: RequestUser) {
    const orders = await this.prisma.productionOrder.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { product: true },
      orderBy: [{ priority: "asc" }, { plannedEndDate: "asc" }]
    });

    const grouped: Record<string, typeof orders> = {
      DRAFT: [], RELEASED: [], IN_PROGRESS: [], PAUSED: [], COMPLETED: [], CLOSED: []
    };
    for (const order of orders) {
      grouped[order.status]?.push(order);
    }
    return grouped;
  }

  async getOrders(user: RequestUser) {
    const orders = await this.prisma.productionOrder.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { product: true },
      orderBy: [{ priority: "asc" }, { plannedEndDate: "asc" }]
    });

    return orders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      productCode: order.product.code,
      productName: order.product.name,
      quantity: order.quantity,
      plannedStartDate: order.plannedStartDate,
      plannedEndDate: order.plannedEndDate,
      status: order.status,
      progress: order.progress,
      priority: order.priority
    }));
  }

  async createOrder(user: RequestUser, dto: CreateProductionOrderDto) {
    const order = await this.prisma.productionOrder.create({
      data: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        orderNo: dto.orderNo,
        productId: dto.productId,
        routingHeaderId: dto.routingHeaderId,
        quantity: dto.quantity,
        plannedStartDate: new Date(dto.plannedStartDate),
        plannedEndDate: new Date(dto.plannedEndDate),
        priority: dto.priority ?? 3
      }
    });
    await this.auditService.log(user.tenantId, "CREATE_ORDER", "ProductionOrder", order.id, dto, user.userId);
    return order;
  }

  async updateOrder(user: RequestUser, id: string, dto: UpdateProductionOrderDto) {
    const existing = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) throw new NotFoundException("工单不存在");
    const updated: Record<string, unknown> = { ...dto };
    if (dto.plannedStartDate) updated.plannedStartDate = new Date(dto.plannedStartDate);
    if (dto.plannedEndDate) updated.plannedEndDate = new Date(dto.plannedEndDate);
    const order = await this.prisma.productionOrder.update({ where: { id }, data: updated });
    await this.auditService.log(user.tenantId, "UPDATE_ORDER", "ProductionOrder", id, dto, user.userId);
    this.events.emit(this.factoryRoom(user), "order:updated", { id, status: order.status, progress: order.progress });
    return order;
  }

  async deleteOrder(user: RequestUser, id: string) {
    const existing = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) throw new NotFoundException("工单不存在");
    if (existing.status !== ProductionOrderStatus.DRAFT) {
      throw new BadRequestException("只有草稿状态的工单可以删除");
    }
    await this.prisma.productionOrder.delete({ where: { id } });
    await this.auditService.log(user.tenantId, "DELETE_ORDER", "ProductionOrder", id, {}, user.userId);
  }

  async releaseOrder(user: RequestUser, id: string) {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });

    if (!order) {
      throw new NotFoundException("工单不存在");
    }

    const updated = await this.prisma.productionOrder.update({
      where: { id },
      data: { status: ProductionOrderStatus.RELEASED }
    });

    await this.auditService.log(user.tenantId, "RELEASE_ORDER", "ProductionOrder", id, { orderNo: order.orderNo }, user.userId);
    this.events.emit(this.factoryRoom(user), "order:updated", { id, status: ProductionOrderStatus.RELEASED, progress: order.progress });
    return updated;
  }

  async reportOperation(user: RequestUser, id: string, dto: ReportOperationDto) {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId },
      include: {
        routingHeader: {
          include: { operations: true }
        }
      }
    });

    if (!order) {
      throw new NotFoundException("工单不存在");
    }

    const operation = dto.operationCode
      ? order.routingHeader?.operations.find((item) => item.operationCode === dto.operationCode)
      : order.routingHeader?.operations[0];

    const report = await this.prisma.operationReport.create({
      data: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        productionOrderId: order.id,
        routingOperationId: operation?.id,
        reportType: dto.reportType as never,
        reportedQty: dto.reportedQty,
        scrapQty: dto.scrapQty ?? 0,
        operatorName: user.username
      }
    });

    const progress = Math.min(100, Number((order.progress + dto.reportedQty / Math.max(order.quantity, 1) * 100).toFixed(1)));
    await this.prisma.productionOrder.update({
      where: { id: order.id },
      data: {
        progress,
        status: progress >= 100 ? ProductionOrderStatus.COMPLETED : ProductionOrderStatus.IN_PROGRESS
      }
    });

    await this.auditService.log(user.tenantId, "REPORT_OPERATION", "OperationReport", report.id, dto, user.userId);
    this.events.emit(this.factoryRoom(user), "order:updated", { id, progress, status: progress >= 100 ? ProductionOrderStatus.COMPLETED : ProductionOrderStatus.IN_PROGRESS });
    return report;
  }

  async runMrp(user: RequestUser) {
    const balances = await this.prisma.inventoryBalance.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { material: true }
    });

    const gaps = balances
      .map((balance) => {
        const netAvailable = balance.onHandQty + balance.inTransitQty - balance.reservedQty;
        const shortage = Math.max(0, balance.material.safetyStock - netAvailable);
        return {
          materialCode: balance.material.code,
          netAvailable,
          safetyStock: balance.material.safetyStock,
          shortage
        };
      })
      .filter((item) => item.shortage > 0);

    const mrpRun = await this.prisma.mrpRun.create({
      data: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        runNo: `MRP-${Date.now()}`,
        status: "COMPLETED",
        summary: {
          suggestions: gaps.map((gap) => ({
            materialCode: gap.materialCode,
            suggestedQty: gap.shortage
          }))
        }
      }
    });

    await this.auditService.log(user.tenantId, "RUN_MRP", "MrpRun", mrpRun.id, mrpRun.summary, user.userId);
    return mrpRun;
  }

  getMrpResult(user: RequestUser, id: string) {
    return this.prisma.mrpRun.findFirstOrThrow({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
  }

  async getSchedule(user: RequestUser) {
    const orders = await this.prisma.productionOrder.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: {
        product: true,
        routingHeader: { include: { operations: { include: { workCenter: true }, orderBy: { sequence: "asc" } } } }
      },
      orderBy: [{ priority: "asc" }, { plannedStartDate: "asc" }]
    });

    return orders.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      productName: o.product.name,
      quantity: o.quantity,
      plannedStartDate: o.plannedStartDate,
      plannedEndDate: o.plannedEndDate,
      status: o.status,
      progress: o.progress,
      priority: o.priority,
      workCenters: o.routingHeader?.operations.map(op => op.workCenter.code) ?? []
    }));
  }

  async rescheduleOrder(user: RequestUser, id: string, dto: import("./dto/reschedule-order.dto.js").RescheduleOrderDto) {
    const existing = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) throw new NotFoundException("工单不存在");
    const data: Record<string, unknown> = {};
    if (dto.plannedStartDate) data.plannedStartDate = new Date(dto.plannedStartDate);
    if (dto.plannedEndDate) data.plannedEndDate = new Date(dto.plannedEndDate);
    if (dto.priority !== undefined) data.priority = dto.priority;
    const order = await this.prisma.productionOrder.update({ where: { id }, data });
    await this.auditService.log(user.tenantId, "RESCHEDULE_ORDER", "ProductionOrder", id, dto, user.userId);
    this.events.emit(this.factoryRoom(user), "order:updated", { id, status: order.status, progress: order.progress });
    return order;
  }
}
