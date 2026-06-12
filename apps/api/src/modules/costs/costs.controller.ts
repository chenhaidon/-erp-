import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { CostsService } from "./costs.service.js";

@Controller("costs")
@UseGuards(JwtAuthGuard)
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Get("overview")
  overview(@CurrentUser() user: RequestUser) {
    return this.costsService.getCostOverview(user);
  }

  @Get("production-orders")
  productionCosts(@CurrentUser() user: RequestUser) {
    return this.costsService.getProductionCosts(user);
  }

  @Post("production-orders/:id/calculate")
  calculateCost(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.costsService.calculateProductionCost(user, id);
  }

  @Get("purchase-summary")
  purchaseSummary(@CurrentUser() user: RequestUser) {
    return this.costsService.getPurchaseSummary(user);
  }
}
