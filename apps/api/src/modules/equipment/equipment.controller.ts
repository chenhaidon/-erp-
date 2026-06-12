import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { EquipmentService, UpdateEquipmentStatusDto } from "./equipment.service.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get("equipment")
  equipment(@CurrentUser() user: RequestUser) {
    return this.equipmentService.getEquipment(user);
  }

  @Patch("equipment/:id")
  updateEquipmentStatus(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdateEquipmentStatusDto) {
    return this.equipmentService.updateEquipmentStatus(user, id, dto);
  }

  @Get("maintenance-orders")
  maintenanceOrders(@CurrentUser() user: RequestUser) {
    return this.equipmentService.getMaintenanceOrders(user);
  }
}
