import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { ReportsService } from "./reports.service.js";
import { ReportQueryDto } from "./dto/report-query.dto.js";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("production-summary")
  productionSummary(@CurrentUser() user: RequestUser, @Query() dto: ReportQueryDto) {
    return this.reportsService.getProductionSummary(user, dto);
  }

  @Get("quality-trend")
  qualityTrend(@CurrentUser() user: RequestUser, @Query() dto: ReportQueryDto) {
    return this.reportsService.getQualityTrend(user, dto);
  }

  @Get("inventory-snapshot")
  inventorySnapshot(@CurrentUser() user: RequestUser) {
    return this.reportsService.getInventorySnapshot(user);
  }

  @Get("purchase-summary")
  purchaseSummary(@CurrentUser() user: RequestUser) {
    return this.reportsService.getPurchaseSummary(user);
  }

  @Get("export")
  async export(@CurrentUser() user: RequestUser, @Query() dto: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportExcel(user, dto);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="erp-report-${dto.startDate}-${dto.endDate}.xlsx"`
    });
    res.send(buffer);
  }
}
