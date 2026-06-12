import { Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";
import { PrismaService } from "../prisma/prisma.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import type { ReportQueryDto } from "./dto/report-query.dto.js";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductionSummary(user: RequestUser, dto: ReportQueryDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const reports = await this.prisma.operationReport.findMany({
      where: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        reportTime: { gte: start, lte: end }
      },
      orderBy: { reportTime: "asc" }
    });

    const byWeek = new Map<string, { week: string; completed: number; scrapped: number }>();
    for (const r of reports) {
      const d = new Date(r.reportTime);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = weekStart.toISOString().slice(0, 10);
      if (!byWeek.has(key)) byWeek.set(key, { week: key, completed: 0, scrapped: 0 });
      const entry = byWeek.get(key)!;
      entry.completed += r.reportedQty;
      entry.scrapped += r.scrapQty;
    }

    return Array.from(byWeek.values());
  }

  async getQualityTrend(user: RequestUser, dto: ReportQueryDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    const inspections = await this.prisma.inspection.findMany({
      where: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        status: { in: ["PASS", "FAIL"] }
      }
    });

    const byWeek = new Map<string, { week: string; pass: number; fail: number }>();
    const filtered = inspections.filter(i => {
      const id = i.inspectionNo;
      return id >= start.toISOString().slice(0, 10) || true;
    });

    for (const insp of filtered) {
      const key = dto.startDate.slice(0, 7);
      if (!byWeek.has(key)) byWeek.set(key, { week: key, pass: 0, fail: 0 });
      const entry = byWeek.get(key)!;
      if (insp.status === "PASS") entry.pass++;
      else if (insp.status === "FAIL") entry.fail++;
    }

    return Array.from(byWeek.values()).map(item => ({
      week: item.week,
      passRate: item.pass + item.fail > 0
        ? Number(((item.pass / (item.pass + item.fail)) * 100).toFixed(1))
        : 0,
      total: item.pass + item.fail
    }));
  }

  async getInventorySnapshot(user: RequestUser) {
    const balances = await this.prisma.inventoryBalance.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { material: true, warehouse: true },
      orderBy: { material: { code: "asc" } }
    });

    return balances.map(b => ({
      materialCode: b.material.code,
      materialName: b.material.name,
      warehouseName: b.warehouse.name,
      onHand: b.onHandQty,
      reserved: b.reservedQty,
      inTransit: b.inTransitQty
    }));
  }

  async getPurchaseSummary(user: RequestUser) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { supplier: true, material: true }
    });

    const total = orders.length;
    const onTime = orders.filter(o => o.status === "RECEIVED" || o.status === "PARTIAL_RECEIVED").length;
    const onTimeRate = total > 0 ? Number(((onTime / total) * 100).toFixed(1)) : 0;

    return {
      total,
      onTime,
      onTimeRate,
      bySupplier: Object.values(
        orders.reduce((acc: Record<string, { supplier: string; count: number }>, o) => {
          const key = o.supplier.name;
          if (!acc[key]) acc[key] = { supplier: key, count: 0 };
          acc[key].count++;
          return acc;
        }, {})
      )
    };
  }

  async exportExcel(user: RequestUser, dto: ReportQueryDto) {
    const [production, inventory, purchase] = await Promise.all([
      this.getProductionSummary(user, dto),
      this.getInventorySnapshot(user),
      this.getPurchaseSummary(user)
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Smart ERP";
    workbook.created = new Date();

    const prodSheet = workbook.addWorksheet("生产报表");
    prodSheet.addRow(["周次", "完工数量", "报废数量"]);
    for (const row of production) prodSheet.addRow([row.week, row.completed, row.scrapped]);

    const invSheet = workbook.addWorksheet("库存快照");
    invSheet.addRow(["物料编码", "物料名称", "仓库", "在手数量", "预留数量", "在途数量"]);
    for (const row of inventory) invSheet.addRow([row.materialCode, row.materialName, row.warehouseName, row.onHand, row.reserved, row.inTransit]);

    const poSheet = workbook.addWorksheet("采购汇总");
    poSheet.addRow(["总单数", "按时到货", "准时率"]);
    poSheet.addRow([purchase.total, purchase.onTime, `${purchase.onTimeRate}%`]);

    return workbook.xlsx.writeBuffer();
  }
}
