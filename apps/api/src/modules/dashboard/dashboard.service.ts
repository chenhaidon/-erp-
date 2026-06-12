import { Injectable } from "@nestjs/common";
import { PurchaseOrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: RequestUser) {
    const [orders, inspections, balances, equipments, purchaseOrders] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId }
      }),
      this.prisma.inspection.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId }
      }),
      this.prisma.inventoryBalance.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId }
      }),
      this.prisma.equipment.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId }
      }),
      this.prisma.purchaseOrder.findMany({
        where: { tenantId: user.tenantId, factoryId: user.factoryId }
      })
    ]);

    const deliveryRate = orders.length
      ? Number((orders.reduce((sum, item) => sum + item.progress, 0) / orders.length).toFixed(1))
      : 0;
    const equipmentOee = equipments.length
      ? Number((equipments.reduce((sum, item) => sum + item.oee, 0) / equipments.length).toFixed(1))
      : 0;
    const riskOrders = balances.filter((item) => item.onHandQty + item.inTransitQty - item.reservedQty < 0).length;
    const positiveBalances = balances.filter((item) => item.onHandQty > 0).length;
    const inventoryAccuracy = balances.length
      ? Number(((positiveBalances / balances.length) * 100).toFixed(1))
      : 100;

    return {
      deliveryRate,
      equipmentOee,
      riskOrders,
      inventoryAccuracy,
      openOrders: orders.length,
      pendingInspections: inspections.filter((item) => item.status === "PENDING").length,
      pendingPurchaseApprovals: purchaseOrders.filter((item) => item.status === PurchaseOrderStatus.SUBMITTED).length,
      qualityAlerts: inspections.filter((item) => item.status === "FAIL").length,
      equipmentAlerts: equipments.filter((item) => item.status !== "RUNNING" || item.healthScore < 85).length
    };
  }
}
