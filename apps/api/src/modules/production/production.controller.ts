import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { ReportOperationDto } from "./dto/report-operation.dto.js";
import { CreateProductionOrderDto } from "./dto/create-production-order.dto.js";
import { UpdateProductionOrderDto } from "./dto/update-production-order.dto.js";
import { RescheduleOrderDto } from "./dto/reschedule-order.dto.js";
import { ProductionService } from "./production.service.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get("production-orders/kanban")
  kanban(@CurrentUser() user: RequestUser) {
    return this.productionService.getKanbanOrders(user);
  }

  @Get("production-orders/schedule")
  schedule(@CurrentUser() user: RequestUser) {
    return this.productionService.getSchedule(user);
  }

  @Get("production-orders")
  orders(@CurrentUser() user: RequestUser) {
    return this.productionService.getOrders(user);
  }

  @Post("production-orders")
  createOrder(@CurrentUser() user: RequestUser, @Body() dto: CreateProductionOrderDto) {
    return this.productionService.createOrder(user, dto);
  }

  @Patch("production-orders/:id")
  updateOrder(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdateProductionOrderDto) {
    return this.productionService.updateOrder(user, id, dto);
  }

  @Delete("production-orders/:id")
  deleteOrder(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.productionService.deleteOrder(user, id);
  }

  @Patch("production-orders/:id/reschedule")
  rescheduleOrder(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: RescheduleOrderDto) {
    return this.productionService.rescheduleOrder(user, id, dto);
  }

  @Post("production-orders/:id/release")
  release(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.productionService.releaseOrder(user, id);
  }

  @Post("operations/:id/report")
  report(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: ReportOperationDto) {
    return this.productionService.reportOperation(user, id, dto);
  }

  @Post("mrp/runs")
  runMrp(@CurrentUser() user: RequestUser) {
    return this.productionService.runMrp(user);
  }

  @Get("mrp/runs/:id/result")
  mrpResult(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.productionService.getMrpResult(user, id);
  }
}
