import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";
import type { CreateMaterialDto } from "./dto/create-material.dto.js";
import type { UpdateMaterialDto } from "./dto/update-material.dto.js";
import type { CreateSupplierDto } from "./dto/create-supplier.dto.js";
import type { UpdateSupplierDto } from "./dto/update-supplier.dto.js";
import type { CreateWarehouseDto } from "./dto/create-warehouse.dto.js";
import type { UpdateWarehouseDto } from "./dto/update-warehouse.dto.js";

@Injectable()
export class MasterDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  getMaterials(user: RequestUser) {
    return this.prisma.material.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      orderBy: { code: "asc" }
    });
  }

  async createMaterial(user: RequestUser, dto: CreateMaterialDto) {
    const material = await this.prisma.material.create({
      data: {
        tenantId: user.tenantId,
        factoryId: user.factoryId,
        code: dto.code,
        name: dto.name,
        specification: dto.specification ?? "",
        type: dto.type,
        unit: dto.unit,
        safetyStock: dto.safetyStock,
        leadTimeDays: dto.leadTimeDays
      }
    });
    await this.auditService.log(user.tenantId, "CREATE_MATERIAL", "Material", material.id, dto, user.userId);
    return material;
  }

  async updateMaterial(user: RequestUser, id: string, dto: UpdateMaterialDto) {
    const existing = await this.prisma.material.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) throw new NotFoundException("物料不存在");
    const material = await this.prisma.material.update({ where: { id }, data: dto });
    await this.auditService.log(user.tenantId, "UPDATE_MATERIAL", "Material", id, dto, user.userId);
    return material;
  }

  async deleteMaterial(user: RequestUser, id: string) {
    const existing = await this.prisma.material.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) throw new NotFoundException("物料不存在");
    await this.prisma.material.delete({ where: { id } });
    await this.auditService.log(user.tenantId, "DELETE_MATERIAL", "Material", id, {}, user.userId);
  }

  async getBoms(user: RequestUser) {
    const records = await this.prisma.bomHeader.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: {
        material: true,
        items: {
          include: {
            componentMaterial: true,
            substituteMaterial: true
          }
        }
      }
    });

    return records.map((record) => ({
      id: record.id,
      code: record.code,
      materialCode: record.material.code,
      version: record.version,
      effectiveFrom: record.effectiveFrom,
      effectiveTo: record.effectiveTo,
      status: record.status,
      items: record.items.map((item) => ({
        materialCode: item.componentMaterial.code,
        quantity: item.quantity,
        lossRate: item.lossRate,
        substituteMaterialCode: item.substituteMaterial?.code
      }))
    }));
  }

  async getRoutings(user: RequestUser) {
    const records = await this.prisma.routingHeader.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: {
        material: true,
        operations: {
          include: {
            workCenter: true
          },
          orderBy: { sequence: "asc" }
        }
      }
    });

    return records.map((record) => ({
      id: record.id,
      code: record.code,
      materialCode: record.material.code,
      version: record.version,
      status: record.status,
      operations: record.operations.map((operation) => ({
        sequence: operation.sequence,
        operationCode: operation.operationCode,
        operationName: operation.operationName,
        workCenterCode: operation.workCenter.code,
        standardMinutes: operation.standardMinutes
      }))
    }));
  }

  getWorkCenters(user: RequestUser) {
    return this.prisma.workCenter.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      orderBy: { code: "asc" }
    });
  }

  getSuppliers(user: RequestUser) {
    return this.prisma.supplier.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { code: "asc" }
    });
  }

  async createSupplier(user: RequestUser, dto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: { ...dto, tenantId: user.tenantId }
    });
    await this.auditService.log(user.tenantId, "CREATE_SUPPLIER", "Supplier", supplier.id, dto, user.userId);
    return supplier;
  }

  async updateSupplier(user: RequestUser, id: string, dto: UpdateSupplierDto) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) throw new NotFoundException("供应商不存在");
    const supplier = await this.prisma.supplier.update({ where: { id }, data: dto });
    await this.auditService.log(user.tenantId, "UPDATE_SUPPLIER", "Supplier", id, dto, user.userId);
    return supplier;
  }

  async deleteSupplier(user: RequestUser, id: string) {
    const existing = await this.prisma.supplier.findFirst({
      where: { id, tenantId: user.tenantId }
    });
    if (!existing) throw new NotFoundException("供应商不存在");
    await this.prisma.supplier.delete({ where: { id } });
    await this.auditService.log(user.tenantId, "DELETE_SUPPLIER", "Supplier", id, {}, user.userId);
  }

  getWarehouses(user: RequestUser) {
    return this.prisma.warehouse.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      orderBy: { code: "asc" }
    });
  }

  async createWarehouse(user: RequestUser, dto: CreateWarehouseDto) {
    const warehouse = await this.prisma.warehouse.create({
      data: { ...dto, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    await this.auditService.log(user.tenantId, "CREATE_WAREHOUSE", "Warehouse", warehouse.id, dto, user.userId);
    return warehouse;
  }

  async updateWarehouse(user: RequestUser, id: string, dto: UpdateWarehouseDto) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) throw new NotFoundException("仓库不存在");
    const warehouse = await this.prisma.warehouse.update({ where: { id }, data: dto });
    await this.auditService.log(user.tenantId, "UPDATE_WAREHOUSE", "Warehouse", id, dto, user.userId);
    return warehouse;
  }

  async deleteWarehouse(user: RequestUser, id: string) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { id, tenantId: user.tenantId, factoryId: user.factoryId }
    });
    if (!existing) throw new NotFoundException("仓库不存在");
    await this.prisma.warehouse.delete({ where: { id } });
    await this.auditService.log(user.tenantId, "DELETE_WAREHOUSE", "Warehouse", id, {}, user.userId);
  }
}
