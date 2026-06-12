import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { InventoryService } from "./inventory.service.js";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto.js";
import { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("inventory-transactions")
  transactions(@CurrentUser() user: RequestUser) {
    return this.inventoryService.getTransactions(user);
  }

  @Get("purchase-orders")
  purchaseOrders(@CurrentUser() user: RequestUser) {
    return this.inventoryService.getPurchaseOrders(user);
  }

  @Post("purchase-orders")
  createPurchaseOrder(@CurrentUser() user: RequestUser, @Body() dto: CreatePurchaseOrderDto) {
    return this.inventoryService.createPurchaseOrder(user, dto);
  }

  @Patch("purchase-orders/:id")
  updatePurchaseOrder(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.inventoryService.updatePurchaseOrder(user, id, dto);
  }

  @Post("purchase-orders/:id/submit")
  submitPurchaseOrder(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.inventoryService.submitPurchaseOrder(user, id);
  }

  @Post("purchase-orders/:id/approve")
  approvePurchaseOrder(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.inventoryService.approvePurchaseOrder(user, id);
  }

  @Post("purchase-orders/:id/reject")
  rejectPurchaseOrder(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: { remark?: string }) {
    return this.inventoryService.rejectPurchaseOrder(user, id, dto.remark);
  }

  @Get("receipts")
  receipts(@CurrentUser() user: RequestUser) {
    return this.inventoryService.getReceipts(user);
  }
}
