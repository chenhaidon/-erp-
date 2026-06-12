import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import { MasterDataService } from "./master-data.service.js";
import { CreateMaterialDto } from "./dto/create-material.dto.js";
import { UpdateMaterialDto } from "./dto/update-material.dto.js";
import { CreateSupplierDto } from "./dto/create-supplier.dto.js";
import { UpdateSupplierDto } from "./dto/update-supplier.dto.js";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto.js";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto.js";

@Controller()
@UseGuards(JwtAuthGuard)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get("materials")
  materials(@CurrentUser() user: RequestUser) {
    return this.masterDataService.getMaterials(user);
  }

  @Post("materials")
  createMaterial(@CurrentUser() user: RequestUser, @Body() dto: CreateMaterialDto) {
    return this.masterDataService.createMaterial(user, dto);
  }

  @Patch("materials/:id")
  updateMaterial(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdateMaterialDto) {
    return this.masterDataService.updateMaterial(user, id, dto);
  }

  @Delete("materials/:id")
  deleteMaterial(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.masterDataService.deleteMaterial(user, id);
  }

  @Get("boms")
  boms(@CurrentUser() user: RequestUser) {
    return this.masterDataService.getBoms(user);
  }

  @Get("routings")
  routings(@CurrentUser() user: RequestUser) {
    return this.masterDataService.getRoutings(user);
  }

  @Get("work-centers")
  workCenters(@CurrentUser() user: RequestUser) {
    return this.masterDataService.getWorkCenters(user);
  }

  @Get("suppliers")
  suppliers(@CurrentUser() user: RequestUser) {
    return this.masterDataService.getSuppliers(user);
  }

  @Post("suppliers")
  createSupplier(@CurrentUser() user: RequestUser, @Body() dto: CreateSupplierDto) {
    return this.masterDataService.createSupplier(user, dto);
  }

  @Patch("suppliers/:id")
  updateSupplier(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdateSupplierDto) {
    return this.masterDataService.updateSupplier(user, id, dto);
  }

  @Delete("suppliers/:id")
  deleteSupplier(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.masterDataService.deleteSupplier(user, id);
  }

  @Get("warehouses")
  warehouses(@CurrentUser() user: RequestUser) {
    return this.masterDataService.getWarehouses(user);
  }

  @Post("warehouses")
  createWarehouse(@CurrentUser() user: RequestUser, @Body() dto: CreateWarehouseDto) {
    return this.masterDataService.createWarehouse(user, dto);
  }

  @Patch("warehouses/:id")
  updateWarehouse(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() dto: UpdateWarehouseDto) {
    return this.masterDataService.updateWarehouse(user, id, dto);
  }

  @Delete("warehouses/:id")
  deleteWarehouse(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.masterDataService.deleteWarehouse(user, id);
  }
}
