import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";

@Injectable()
export class CostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getProductionCosts(user: RequestUser) {
    const orders = await this.prisma.productionOrder.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { product: true, costs: true },
      orderBy: { costs: { totalCost: "desc" } }
    });

    return orders.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      productName: o.product.name,
      quantity: o.quantity,
      status: o.status,
      materialCost: o.costs?.materialCost ?? 0,
      laborCost: o.costs?.laborCost ?? 0,
      overheadCost: o.costs?.overheadCost ?? 0,
      totalCost: o.costs?.totalCost ?? 0,
      calculated: !!o.costs
    }));
  }

  async calculateProductionCost(user: RequestUser, orderId: string) {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id: orderId, tenantId: user.tenantId, factoryId: user.factoryId },
      include: {
        routingHeader: {
          include: {
            operations: { include: { workCenter: true } }
          }
        }
      }
    });
    if (!order) throw new NotFoundException("工单不存在");

    // Material cost: BOM items × material unit cost
    const bom = await this.prisma.bomHeader.findFirst({
      where: { tenantId: user.tenantId, factoryId: user.factoryId, materialId: order.productId, status: "ACTIVE" },
      include: { items: { include: { componentMaterial: true } } }
    });

    const materialCost = bom
      ? bom.items.reduce((sum, item) =>
          sum + item.quantity * (1 + item.lossRate / 100) * order.quantity * item.componentMaterial.unitCost, 0)
      : 0;

    // Labor cost: routing operations × work center hourly rate × standard minutes / 60
    const laborCost = order.routingHeader
      ? order.routingHeader.operations.reduce((sum, op) =>
          sum + (op.standardMinutes / 60) * op.workCenter.hourlyRate * order.quantity, 0)
      : 0;

    const overheadCost = Number((materialCost * 0.1).toFixed(2));
    const totalCost = Number((materialCost + laborCost + overheadCost).toFixed(2));

    const cost = await this.prisma.productionCost.upsert({
      where: { productionOrderId: orderId },
      create: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        productionOrderId: orderId,
        materialCost: Number(materialCost.toFixed(2)),
        laborCost: Number(laborCost.toFixed(2)),
        overheadCost,
        totalCost
      },
      update: {
        materialCost: Number(materialCost.toFixed(2)),
        laborCost: Number(laborCost.toFixed(2)),
        overheadCost,
        totalCost
      }
    });

    await this.auditService.log(user.tenantId, "CALCULATE_COST", "ProductionCost", cost.id, { orderId, totalCost }, user.userId);
    return cost;
  }

  async getPurchaseSummary(user: RequestUser) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { supplier: true, material: true },
      orderBy: { dueDate: "desc" }
    });

    const bySupplier: Record<string, { supplier: string; totalAmount: number; orderCount: number }> = {};
    let grandTotal = 0;

    for (const o of orders) {
      const amount = o.unitPrice > 0 ? o.quantity * o.unitPrice : o.totalAmount;
      grandTotal += amount;
      if (!bySupplier[o.supplierId]) {
        bySupplier[o.supplierId] = { supplier: o.supplier.name, totalAmount: 0, orderCount: 0 };
      }
      bySupplier[o.supplierId].totalAmount += amount;
      bySupplier[o.supplierId].orderCount++;
    }

    return {
      grandTotal: Number(grandTotal.toFixed(2)),
      bySupplier: Object.values(bySupplier).map(s => ({ ...s, totalAmount: Number(s.totalAmount.toFixed(2)) })),
      orders: orders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        supplierName: o.supplier.name,
        materialCode: o.material.code,
        quantity: o.quantity,
        unitPrice: o.unitPrice,
        totalAmount: o.unitPrice > 0 ? Number((o.quantity * o.unitPrice).toFixed(2)) : o.totalAmount,
        status: o.status
      }))
    };
  }

  async getCostOverview(user: RequestUser) {
    const [costs, purchase] = await Promise.all([
      this.prisma.productionCost.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId }
      }),
      this.getPurchaseSummary(user)
    ]);

    const totalProductionCost = costs.reduce((s, c) => s + c.totalCost, 0);
    const totalPurchaseCost = purchase.grandTotal;

    return {
      totalProductionCost: Number(totalProductionCost.toFixed(2)),
      totalPurchaseCost,
      estimatedMargin: 0,
      ordersCalculated: costs.length
    };
  }
}
