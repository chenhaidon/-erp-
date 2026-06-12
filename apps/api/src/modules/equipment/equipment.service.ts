import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { EventsGateway } from "../events/events.gateway.js";
import type { RequestUser } from "../auth/interfaces/request-user.interface.js";

export class UpdateEquipmentStatusDto {
  status?: string;
  healthScore?: number;
  oee?: number;
}

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway
  ) {}

  getEquipment(user: RequestUser) {
    return this.prisma.equipment.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { workCenter: true },
      orderBy: { code: "asc" }
    });
  }

  async updateEquipmentStatus(user: RequestUser, id: string, dto: UpdateEquipmentStatusDto) {
    const equipment = await this.prisma.equipment.update({
      where: { id },
      data: dto as never
    });
    this.events.emit(
      `tenant:${user.tenantId}:factory:${user.factoryId}`,
      "equipment:updated",
      { id, status: equipment.status, healthScore: equipment.healthScore, oee: equipment.oee }
    );
    return equipment;
  }

  async getMaintenanceOrders(user: RequestUser) {
    const records = await this.prisma.maintenanceOrder.findMany({
      where: { tenantId: user.tenantId, factoryId: user.factoryId },
      include: { equipment: true },
      orderBy: { createdAt: "desc" }
    });

    return records.map((record) => ({
      id: record.id,
      orderNo: record.orderNo,
      equipmentCode: record.equipment.code,
      description: record.description,
      status: record.status,
      createdAt: record.createdAt
    }));
  }
}
