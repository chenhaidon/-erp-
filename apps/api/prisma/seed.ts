import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  AiInteractionType,
  DataScope,
  EquipmentStatus,
  InspectionStatus,
  InspectionType,
  IntegrationJobStatus,
  IntegrationSystem,
  InventoryTransactionType,
  MaterialType,
  OperationReportType,
  PrismaClient,
  ProductionOrderStatus,
  PurchaseOrderStatus
} from "@prisma/client";

const prisma = new PrismaClient();

function toAmount(value: number) {
  return Number(value.toFixed(2));
}

function calculateProductionCost(
  quantity: number,
  bomItems: Array<{ quantity: number; lossRate: number; unitCost: number }>,
  operations: Array<{ standardMinutes: number; hourlyRate: number }>
) {
  const materialCost = bomItems.reduce(
    (sum, item) => sum + item.quantity * (1 + item.lossRate / 100) * quantity * item.unitCost,
    0
  );
  const laborCost = operations.reduce(
    (sum, operation) => sum + (operation.standardMinutes / 60) * operation.hourlyRate * quantity,
    0
  );
  const overheadCost = materialCost * 0.1;

  return {
    materialCost: toAmount(materialCost),
    laborCost: toAmount(laborCost),
    overheadCost: toAmount(overheadCost),
    totalCost: toAmount(materialCost + laborCost + overheadCost)
  };
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.aiInteraction.deleteMany();
  await prisma.integrationMapping.deleteMany();
  await prisma.integrationJob.deleteMany();
  await prisma.maintenanceOrder.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.mrpRun.deleteMany();
  await prisma.productionCost.deleteMany();
  await prisma.operationReport.deleteMany();
  await prisma.productionOrder.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.inventoryBalance.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.routingOperation.deleteMany();
  await prisma.routingHeader.deleteMany();
  await prisma.workCenter.deleteMany();
  await prisma.bomItem.deleteMany();
  await prisma.bomHeader.deleteMany();
  await prisma.material.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userFactoryScope.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.factory.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: { code: "TENANT-001", name: "智造集团" }
  });

  const organization = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      code: "ORG-001",
      name: "华东制造中心"
    }
  });

  const factoryA = await prisma.factory.create({
    data: {
      tenantId: tenant.id,
      organizationId: organization.id,
      code: "FAC-SH",
      name: "上海一厂"
    }
  });

  const factoryB = await prisma.factory.create({
    data: {
      tenantId: tenant.id,
      organizationId: organization.id,
      code: "FAC-SZ",
      name: "苏州二厂"
    }
  });

  const department = await prisma.department.create({
    data: {
      tenantId: tenant.id,
      organizationId: organization.id,
      code: "DPT-PLAN",
      name: "计划部"
    }
  });

  const roleDefinitions = [
    {
      code: "ERP_ADMIN",
      name: "ERP 管理员",
      dataScope: DataScope.TENANT,
      permissions: [
        { code: "dashboard:view", name: "查看驾驶舱" },
        { code: "master-data:manage", name: "管理主数据" },
        { code: "production:manage", name: "管理工单与报工" },
        { code: "inventory:manage", name: "管理库存与采购" },
        { code: "inventory:purchase:submit", name: "提交采购审批" },
        { code: "inventory:purchase:approve", name: "审批采购单" },
        { code: "quality:manage", name: "管理质量" },
        { code: "equipment:manage", name: "管理设备" },
        { code: "costs:view", name: "查看成本" },
        { code: "reports:view", name: "查看报表" },
        { code: "integration:manage", name: "管理集成" },
        { code: "ai:use", name: "使用 AI 助手" },
        { code: "users:manage", name: "管理用户" }
      ]
    },
    {
      code: "PLAN_MANAGER",
      name: "计划经理",
      dataScope: DataScope.FACTORY,
      permissions: [
        { code: "dashboard:view", name: "查看驾驶舱" },
        { code: "master-data:manage", name: "管理主数据" },
        { code: "production:manage", name: "管理工单与报工" },
        { code: "inventory:manage", name: "管理库存与采购" },
        { code: "inventory:purchase:submit", name: "提交采购审批" },
        { code: "reports:view", name: "查看报表" },
        { code: "ai:use", name: "使用 AI 助手" }
      ]
    },
    {
      code: "WAREHOUSE_MANAGER",
      name: "仓储主管",
      dataScope: DataScope.FACTORY,
      permissions: [
        { code: "dashboard:view", name: "查看驾驶舱" },
        { code: "inventory:manage", name: "管理库存与采购" },
        { code: "inventory:purchase:submit", name: "提交采购审批" },
        { code: "reports:view", name: "查看报表" }
      ]
    },
    {
      code: "QUALITY_MANAGER",
      name: "质量经理",
      dataScope: DataScope.FACTORY,
      permissions: [
        { code: "dashboard:view", name: "查看驾驶舱" },
        { code: "quality:manage", name: "管理质量" },
        { code: "reports:view", name: "查看报表" },
        { code: "ai:use", name: "使用 AI 助手" }
      ]
    },
    {
      code: "MAINT_MANAGER",
      name: "设备经理",
      dataScope: DataScope.FACTORY,
      permissions: [
        { code: "dashboard:view", name: "查看驾驶舱" },
        { code: "equipment:manage", name: "管理设备" },
        { code: "reports:view", name: "查看报表" }
      ]
    },
    {
      code: "FINANCE_ANALYST",
      name: "成本分析员",
      dataScope: DataScope.FACTORY,
      permissions: [
        { code: "dashboard:view", name: "查看驾驶舱" },
        { code: "costs:view", name: "查看成本" },
        { code: "reports:view", name: "查看报表" }
      ]
    }
  ];

  const roles = await Promise.all(
    roleDefinitions.map((role) =>
      prisma.role.create({
        data: {
          tenantId: tenant.id,
          code: role.code,
          name: role.name,
          dataScope: role.dataScope,
          permissions: {
            create: role.permissions
          }
        }
      })
    )
  );

  const roleByCode = Object.fromEntries(roles.map((item) => [item.code, item]));

  const passwordHash = await bcrypt.hash("Admin@123", 10);
  const demoPasswordHash = await bcrypt.hash("Demo@123", 10);
  const demoUsers = [
    {
      username: "admin",
      displayName: "系统管理员",
      passwordHash,
      defaultFactoryId: factoryA.id,
      roleCodes: ["ERP_ADMIN"],
      factoryIds: [factoryA.id, factoryB.id]
    },
    {
      username: "planner",
      displayName: "周晓岚",
      passwordHash: demoPasswordHash,
      defaultFactoryId: factoryA.id,
      roleCodes: ["PLAN_MANAGER"],
      factoryIds: [factoryA.id]
    },
    {
      username: "warehouse",
      displayName: "陈立仓",
      passwordHash: demoPasswordHash,
      defaultFactoryId: factoryA.id,
      roleCodes: ["WAREHOUSE_MANAGER"],
      factoryIds: [factoryA.id]
    },
    {
      username: "quality",
      displayName: "赵敏质检",
      passwordHash: demoPasswordHash,
      defaultFactoryId: factoryA.id,
      roleCodes: ["QUALITY_MANAGER"],
      factoryIds: [factoryA.id]
    },
    {
      username: "equipment",
      displayName: "孙维保",
      passwordHash: demoPasswordHash,
      defaultFactoryId: factoryA.id,
      roleCodes: ["MAINT_MANAGER"],
      factoryIds: [factoryA.id]
    },
    {
      username: "finance",
      displayName: "林成本",
      passwordHash: demoPasswordHash,
      defaultFactoryId: factoryA.id,
      roleCodes: ["FINANCE_ANALYST"],
      factoryIds: [factoryA.id]
    }
  ] as const;

  const [admin] = await Promise.all(
    demoUsers.map((demoUser) =>
      prisma.user.create({
        data: {
          tenantId: tenant.id,
          organizationId: organization.id,
          departmentId: department.id,
          username: demoUser.username,
          passwordHash: demoUser.passwordHash,
          displayName: demoUser.displayName,
          defaultFactoryId: demoUser.defaultFactoryId,
          roleAssignments: {
            create: demoUser.roleCodes.map((roleCode) => ({ roleId: roleByCode[roleCode].id }))
          },
          factoryScopes: {
            create: demoUser.factoryIds.map((factoryId) => ({ factoryId }))
          }
        }
      })
    )
  );

  const workCenters = await Promise.all([
    prisma.workCenter.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "WC-MACH",
        name: "机加工中心",
        hourlyRate: 120
      }
    }),
    prisma.workCenter.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "WC-ASM",
        name: "装配中心",
        hourlyRate: 95
      }
    }),
    prisma.workCenter.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "WC-TEST",
        name: "测试中心",
        hourlyRate: 110
      }
    }),
    prisma.workCenter.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "WC-PACK",
        name: "包装中心",
        hourlyRate: 70
      }
    }),
    prisma.workCenter.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryB.id,
        code: "WC-SZ-ASM",
        name: "苏州装配线",
        hourlyRate: 92
      }
    })
  ]);

  const workCenterByCode = Object.fromEntries(workCenters.map((item) => [item.code, item]));

  const materials = await Promise.all([
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "FG-SERVO-01",
        name: "伺服模组",
        specification: "标准版",
        type: MaterialType.FINISHED,
        unit: "套",
        safetyStock: 20,
        leadTimeDays: 3,
        unitCost: 780
      }
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "FG-PANEL-02",
        name: "控制面板组件",
        specification: "工业触控版",
        type: MaterialType.FINISHED,
        unit: "套",
        safetyStock: 15,
        leadTimeDays: 4,
        unitCost: 520
      }
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "RM-BEAR-A12",
        name: "轴承 A12",
        specification: "高转速轴承件",
        type: MaterialType.RAW,
        unit: "件",
        safetyStock: 500,
        leadTimeDays: 5,
        unitCost: 28
      }
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "RM-HARNESS-H21",
        name: "线束 H21",
        specification: "线束组件",
        type: MaterialType.RAW,
        unit: "套",
        safetyStock: 700,
        leadTimeDays: 4,
        unitCost: 46
      }
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "SM-CASE-C10",
        name: "连接底座",
        specification: "铝合金底座",
        type: MaterialType.SEMI_FINISHED,
        unit: "件",
        safetyStock: 150,
        leadTimeDays: 2,
        unitCost: 62
      }
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "RM-PCB-P88",
        name: "控制板 P88",
        specification: "主控 PCB",
        type: MaterialType.RAW,
        unit: "件",
        safetyStock: 240,
        leadTimeDays: 6,
        unitCost: 88
      }
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "RM-SENSOR-S05",
        name: "扭矩传感器 S05",
        specification: "扭矩检测单元",
        type: MaterialType.RAW,
        unit: "件",
        safetyStock: 380,
        leadTimeDays: 7,
        unitCost: 36
      }
    }),
    prisma.material.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryB.id,
        code: "FG-DRIVE-SZ-01",
        name: "驱动器总成",
        specification: "苏州演示款",
        type: MaterialType.FINISHED,
        unit: "套",
        safetyStock: 12,
        leadTimeDays: 3,
        unitCost: 660
      }
    })
  ]);

  const materialByCode = Object.fromEntries(materials.map((item) => [item.code, item]));

  const servoBom = await prisma.bomHeader.create({
    data: {
      tenantId: tenant.id,
      factoryId: factoryA.id,
      code: "BOM-SERVO-01",
      materialId: materialByCode["FG-SERVO-01"].id,
      version: "A.01",
      status: "ACTIVE",
      effectiveFrom: new Date("2026-05-01T00:00:00.000Z"),
      items: {
        create: [
          { componentMaterialId: materialByCode["RM-BEAR-A12"].id, quantity: 2, lossRate: 2 },
          { componentMaterialId: materialByCode["RM-HARNESS-H21"].id, quantity: 1, lossRate: 1 },
          { componentMaterialId: materialByCode["SM-CASE-C10"].id, quantity: 1, lossRate: 0.5 }
        ]
      }
    }
  });

  const panelBom = await prisma.bomHeader.create({
    data: {
      tenantId: tenant.id,
      factoryId: factoryA.id,
      code: "BOM-PANEL-02",
      materialId: materialByCode["FG-PANEL-02"].id,
      version: "B.03",
      status: "ACTIVE",
      effectiveFrom: new Date("2026-05-08T00:00:00.000Z"),
      items: {
        create: [
          { componentMaterialId: materialByCode["RM-PCB-P88"].id, quantity: 1, lossRate: 1 },
          { componentMaterialId: materialByCode["RM-HARNESS-H21"].id, quantity: 1, lossRate: 1 },
          { componentMaterialId: materialByCode["RM-SENSOR-S05"].id, quantity: 2, lossRate: 0.5 }
        ]
      }
    }
  });

  const servoRouting = await prisma.routingHeader.create({
    data: {
      tenantId: tenant.id,
      factoryId: factoryA.id,
      code: "RT-SERVO-01",
      materialId: materialByCode["FG-SERVO-01"].id,
      version: "A.01",
      status: "ACTIVE",
      operations: {
        create: [
          {
            sequence: 10,
            operationCode: "OP-MACH",
            operationName: "机加工",
            workCenterId: workCenterByCode["WC-MACH"].id,
            standardMinutes: 25
          },
          {
            sequence: 20,
            operationCode: "OP-ASM",
            operationName: "装配",
            workCenterId: workCenterByCode["WC-ASM"].id,
            standardMinutes: 18
          },
          {
            sequence: 30,
            operationCode: "OP-TEST",
            operationName: "整机测试",
            workCenterId: workCenterByCode["WC-TEST"].id,
            standardMinutes: 12
          }
        ]
      }
    }
  });

  const panelRouting = await prisma.routingHeader.create({
    data: {
      tenantId: tenant.id,
      factoryId: factoryA.id,
      code: "RT-PANEL-02",
      materialId: materialByCode["FG-PANEL-02"].id,
      version: "B.03",
      status: "ACTIVE",
      operations: {
        create: [
          {
            sequence: 10,
            operationCode: "OP-PANEL-ASM",
            operationName: "面板装配",
            workCenterId: workCenterByCode["WC-ASM"].id,
            standardMinutes: 22
          },
          {
            sequence: 20,
            operationCode: "OP-PANEL-TEST",
            operationName: "面板测试",
            workCenterId: workCenterByCode["WC-TEST"].id,
            standardMinutes: 15
          },
          {
            sequence: 30,
            operationCode: "OP-PACK",
            operationName: "包装入库",
            workCenterId: workCenterByCode["WC-PACK"].id,
            standardMinutes: 8
          }
        ]
      }
    }
  });

  const routingOperations = await prisma.routingOperation.findMany({
    where: { routingHeaderId: { in: [servoRouting.id, panelRouting.id] } },
    orderBy: [{ routingHeaderId: "asc" }, { sequence: "asc" }]
  });

  const operationsByCode = Object.fromEntries(routingOperations.map((item) => [item.operationCode, item]));

  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "WH-RAW",
        name: "原料仓"
      }
    }),
    prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "WH-WIP",
        name: "在制品仓"
      }
    }),
    prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "WH-FG",
        name: "成品仓"
      }
    }),
    prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryB.id,
        code: "WH-SZ-FG",
        name: "苏州成品仓"
      }
    })
  ]);

  const warehouseByCode = Object.fromEntries(warehouses.map((item) => [item.code, item]));

  await prisma.inventoryBalance.createMany({
    data: [
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-RAW"].id,
        materialId: materialByCode["RM-BEAR-A12"].id,
        onHandQty: 180,
        reservedQty: 150,
        inTransitQty: 80
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-RAW"].id,
        materialId: materialByCode["RM-HARNESS-H21"].id,
        onHandQty: 760,
        reservedQty: 120,
        inTransitQty: 100
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-WIP"].id,
        materialId: materialByCode["SM-CASE-C10"].id,
        onHandQty: 20,
        reservedQty: 45,
        inTransitQty: 10
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-RAW"].id,
        materialId: materialByCode["RM-PCB-P88"].id,
        onHandQty: 210,
        reservedQty: 150,
        inTransitQty: 40
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-RAW"].id,
        materialId: materialByCode["RM-SENSOR-S05"].id,
        onHandQty: 60,
        reservedQty: 90,
        inTransitQty: 120
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-FG"].id,
        materialId: materialByCode["FG-SERVO-01"].id,
        onHandQty: 48,
        reservedQty: 16,
        inTransitQty: 0
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-FG"].id,
        materialId: materialByCode["FG-PANEL-02"].id,
        onHandQty: 22,
        reservedQty: 4,
        inTransitQty: 0
      },
      {
        tenantId: tenant.id,
        factoryId: factoryB.id,
        warehouseId: warehouseByCode["WH-SZ-FG"].id,
        materialId: materialByCode["FG-DRIVE-SZ-01"].id,
        onHandQty: 18,
        reservedQty: 3,
        inTransitQty: 5
      }
    ]
  });

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: { tenantId: tenant.id, code: "SUP-001", name: "华东精工" }
    }),
    prisma.supplier.create({
      data: { tenantId: tenant.id, code: "SUP-002", name: "苏州智联电子" }
    })
  ]);

  const customers = await Promise.all([
    prisma.customer.create({
      data: { tenantId: tenant.id, code: "CUS-001", name: "星海自动化" }
    }),
    prisma.customer.create({
      data: { tenantId: tenant.id, code: "CUS-002", name: "锐虎机电" }
    })
  ]);

  const supplierByCode = Object.fromEntries(suppliers.map((item) => [item.code, item]));
  const customerByCode = Object.fromEntries(customers.map((item) => [item.code, item]));

  await prisma.salesOrder.createMany({
    data: [
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "SO-20260618-01",
        customerId: customerByCode["CUS-001"].id,
        dueDate: new Date("2026-06-20T00:00:00.000Z"),
        demandQty: 150,
        productId: materialByCode["FG-SERVO-01"].id
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "SO-20260616-02",
        customerId: customerByCode["CUS-002"].id,
        dueDate: new Date("2026-06-22T00:00:00.000Z"),
        demandQty: 90,
        productId: materialByCode["FG-PANEL-02"].id
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "SO-20260609-03",
        customerId: customerByCode["CUS-001"].id,
        dueDate: new Date("2026-06-13T00:00:00.000Z"),
        demandQty: 95,
        productId: materialByCode["FG-SERVO-01"].id
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "SO-20260520-04",
        customerId: customerByCode["CUS-002"].id,
        dueDate: new Date("2026-05-24T00:00:00.000Z"),
        demandQty: 75,
        productId: materialByCode["FG-PANEL-02"].id
      }
    ]
  });

  const orderInputs = [
    {
      orderNo: "WO-20260618-01",
      productCode: "FG-SERVO-01",
      routingHeaderId: servoRouting.id,
      quantity: 80,
      plannedStartDate: new Date("2026-06-18T08:00:00.000Z"),
      plannedEndDate: new Date("2026-06-24T18:00:00.000Z"),
      status: ProductionOrderStatus.DRAFT,
      progress: 0,
      priority: 4
    },
    {
      orderNo: "WO-20260617-02",
      productCode: "FG-PANEL-02",
      routingHeaderId: panelRouting.id,
      quantity: 60,
      plannedStartDate: new Date("2026-06-17T08:00:00.000Z"),
      plannedEndDate: new Date("2026-06-21T18:00:00.000Z"),
      status: ProductionOrderStatus.RELEASED,
      progress: 0,
      priority: 2
    },
    {
      orderNo: "WO-20260615-03",
      productCode: "FG-SERVO-01",
      routingHeaderId: servoRouting.id,
      quantity: 120,
      plannedStartDate: new Date("2026-06-15T08:00:00.000Z"),
      plannedEndDate: new Date("2026-06-20T18:00:00.000Z"),
      status: ProductionOrderStatus.IN_PROGRESS,
      progress: 68,
      priority: 1
    },
    {
      orderNo: "WO-20260614-04",
      productCode: "FG-PANEL-02",
      routingHeaderId: panelRouting.id,
      quantity: 90,
      plannedStartDate: new Date("2026-06-14T08:00:00.000Z"),
      plannedEndDate: new Date("2026-06-19T18:00:00.000Z"),
      status: ProductionOrderStatus.IN_PROGRESS,
      progress: 35,
      priority: 2
    },
    {
      orderNo: "WO-20260613-05",
      productCode: "FG-SERVO-01",
      routingHeaderId: servoRouting.id,
      quantity: 150,
      plannedStartDate: new Date("2026-06-13T08:00:00.000Z"),
      plannedEndDate: new Date("2026-06-18T18:00:00.000Z"),
      status: ProductionOrderStatus.IN_PROGRESS,
      progress: 82,
      priority: 1
    },
    {
      orderNo: "WO-20260612-06",
      productCode: "FG-SERVO-01",
      routingHeaderId: servoRouting.id,
      quantity: 70,
      plannedStartDate: new Date("2026-06-12T08:00:00.000Z"),
      plannedEndDate: new Date("2026-06-17T18:00:00.000Z"),
      status: ProductionOrderStatus.PAUSED,
      progress: 40,
      priority: 3
    },
    {
      orderNo: "WO-20260610-07",
      productCode: "FG-PANEL-02",
      routingHeaderId: panelRouting.id,
      quantity: 110,
      plannedStartDate: new Date("2026-06-10T08:00:00.000Z"),
      plannedEndDate: new Date("2026-06-14T18:00:00.000Z"),
      status: ProductionOrderStatus.COMPLETED,
      progress: 100,
      priority: 2
    },
    {
      orderNo: "WO-20260603-08",
      productCode: "FG-SERVO-01",
      routingHeaderId: servoRouting.id,
      quantity: 95,
      plannedStartDate: new Date("2026-06-03T08:00:00.000Z"),
      plannedEndDate: new Date("2026-06-08T18:00:00.000Z"),
      status: ProductionOrderStatus.CLOSED,
      progress: 100,
      priority: 5
    },
    {
      orderNo: "WO-20260520-09",
      productCode: "FG-PANEL-02",
      routingHeaderId: panelRouting.id,
      quantity: 75,
      plannedStartDate: new Date("2026-05-20T08:00:00.000Z"),
      plannedEndDate: new Date("2026-05-25T18:00:00.000Z"),
      status: ProductionOrderStatus.COMPLETED,
      progress: 100,
      priority: 4
    }
  ];

  const productionOrders = await Promise.all(
    orderInputs.map((item) =>
      prisma.productionOrder.create({
        data: {
          tenantId: tenant.id,
          factoryId: factoryA.id,
          orderNo: item.orderNo,
          productId: materialByCode[item.productCode].id,
          routingHeaderId: item.routingHeaderId,
          quantity: item.quantity,
          plannedStartDate: item.plannedStartDate,
          plannedEndDate: item.plannedEndDate,
          status: item.status,
          progress: item.progress,
          priority: item.priority
        }
      })
    )
  );

  const orderByNo = Object.fromEntries(productionOrders.map((item) => [item.orderNo, item]));

  await prisma.operationReport.createMany({
    data: [
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260520-09"].id,
        routingOperationId: operationsByCode["OP-PANEL-ASM"].id,
        reportType: OperationReportType.START,
        reportedQty: 0,
        scrapQty: 0,
        operatorName: admin.displayName,
        reportTime: new Date("2026-05-20T08:30:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260520-09"].id,
        routingOperationId: operationsByCode["OP-PACK"].id,
        reportType: OperationReportType.COMPLETE,
        reportedQty: 75,
        scrapQty: 2,
        operatorName: admin.displayName,
        reportTime: new Date("2026-05-22T15:20:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260603-08"].id,
        routingOperationId: operationsByCode["OP-MACH"].id,
        reportType: OperationReportType.START,
        reportedQty: 0,
        scrapQty: 0,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-03T08:20:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260603-08"].id,
        routingOperationId: operationsByCode["OP-TEST"].id,
        reportType: OperationReportType.COMPLETE,
        reportedQty: 95,
        scrapQty: 1,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-05T17:15:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260610-07"].id,
        routingOperationId: operationsByCode["OP-PANEL-ASM"].id,
        reportType: OperationReportType.START,
        reportedQty: 0,
        scrapQty: 0,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-10T08:10:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260610-07"].id,
        routingOperationId: operationsByCode["OP-PACK"].id,
        reportType: OperationReportType.COMPLETE,
        reportedQty: 110,
        scrapQty: 2,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-11T16:40:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260612-06"].id,
        routingOperationId: operationsByCode["OP-MACH"].id,
        reportType: OperationReportType.START,
        reportedQty: 0,
        scrapQty: 0,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-12T08:05:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260612-06"].id,
        routingOperationId: operationsByCode["OP-ASM"].id,
        reportType: OperationReportType.COMPLETE,
        reportedQty: 28,
        scrapQty: 1,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-12T11:40:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260612-06"].id,
        routingOperationId: operationsByCode["OP-ASM"].id,
        reportType: OperationReportType.PAUSE,
        reportedQty: 0,
        scrapQty: 0,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-12T12:00:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260613-05"].id,
        routingOperationId: operationsByCode["OP-MACH"].id,
        reportType: OperationReportType.START,
        reportedQty: 0,
        scrapQty: 0,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-13T08:10:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260613-05"].id,
        routingOperationId: operationsByCode["OP-ASM"].id,
        reportType: OperationReportType.COMPLETE,
        reportedQty: 120,
        scrapQty: 4,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-13T18:10:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260614-04"].id,
        routingOperationId: operationsByCode["OP-PANEL-ASM"].id,
        reportType: OperationReportType.START,
        reportedQty: 0,
        scrapQty: 0,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-14T09:00:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260614-04"].id,
        routingOperationId: operationsByCode["OP-PANEL-TEST"].id,
        reportType: OperationReportType.COMPLETE,
        reportedQty: 30,
        scrapQty: 3,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-14T16:10:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260615-03"].id,
        routingOperationId: operationsByCode["OP-MACH"].id,
        reportType: OperationReportType.START,
        reportedQty: 0,
        scrapQty: 0,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-15T08:20:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260615-03"].id,
        routingOperationId: operationsByCode["OP-TEST"].id,
        reportType: OperationReportType.COMPLETE,
        reportedQty: 80,
        scrapQty: 2,
        operatorName: admin.displayName,
        reportTime: new Date("2026-06-15T14:00:00.000Z")
      }
    ]
  });

  await Promise.all([
    prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "PO-20260612-01",
        supplierId: supplierByCode["SUP-001"].id,
        materialId: materialByCode["RM-BEAR-A12"].id,
        quantity: 400,
        unitPrice: 28,
        totalAmount: 11200,
        dueDate: new Date("2026-06-12T00:00:00.000Z"),
        status: PurchaseOrderStatus.DRAFT
      }
    }),
    prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "PO-20260611-02",
        supplierId: supplierByCode["SUP-002"].id,
        materialId: materialByCode["RM-PCB-P88"].id,
        quantity: 180,
        unitPrice: 86,
        totalAmount: 15480,
        dueDate: new Date("2026-06-13T00:00:00.000Z"),
        status: PurchaseOrderStatus.APPROVED
      }
    }),
    prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "PO-20260610-03",
        supplierId: supplierByCode["SUP-001"].id,
        materialId: materialByCode["RM-HARNESS-H21"].id,
        quantity: 300,
        unitPrice: 45,
        totalAmount: 13500,
        dueDate: new Date("2026-06-16T00:00:00.000Z"),
        status: PurchaseOrderStatus.SENT
      }
    }),
    prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "PO-20260608-04",
        supplierId: supplierByCode["SUP-002"].id,
        materialId: materialByCode["RM-SENSOR-S05"].id,
        quantity: 220,
        unitPrice: 34,
        totalAmount: 7480,
        dueDate: new Date("2026-06-10T00:00:00.000Z"),
        status: PurchaseOrderStatus.PARTIAL_RECEIVED
      }
    }),
    prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "PO-20260605-05",
        supplierId: supplierByCode["SUP-001"].id,
        materialId: materialByCode["SM-CASE-C10"].id,
        quantity: 260,
        unitPrice: 58,
        totalAmount: 15080,
        dueDate: new Date("2026-06-07T00:00:00.000Z"),
        status: PurchaseOrderStatus.RECEIVED
      }
    })
  ]);

  await prisma.inventoryTransaction.createMany({
    data: [
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-RAW"].id,
        materialId: materialByCode["RM-HARNESS-H21"].id,
        transactionType: InventoryTransactionType.RECEIPT,
        quantity: 300,
        transactionTime: new Date("2026-06-10T11:00:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-RAW"].id,
        materialId: materialByCode["RM-BEAR-A12"].id,
        transactionType: InventoryTransactionType.ISSUE,
        quantity: 120,
        transactionTime: new Date("2026-06-11T09:20:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-WIP"].id,
        materialId: materialByCode["SM-CASE-C10"].id,
        transactionType: InventoryTransactionType.TRANSFER,
        quantity: 40,
        transactionTime: new Date("2026-06-11T14:10:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-RAW"].id,
        materialId: materialByCode["RM-SENSOR-S05"].id,
        transactionType: InventoryTransactionType.ADJUSTMENT,
        quantity: 12,
        transactionTime: new Date("2026-06-12T10:00:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-RAW"].id,
        materialId: materialByCode["RM-PCB-P88"].id,
        transactionType: InventoryTransactionType.RETURN,
        quantity: 8,
        transactionTime: new Date("2026-06-12T16:45:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-FG"].id,
        materialId: materialByCode["FG-PANEL-02"].id,
        transactionType: InventoryTransactionType.RECEIPT,
        quantity: 45,
        transactionTime: new Date("2026-06-13T17:30:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-FG"].id,
        materialId: materialByCode["FG-SERVO-01"].id,
        transactionType: InventoryTransactionType.ISSUE,
        quantity: 30,
        transactionTime: new Date("2026-06-14T18:20:00.000Z")
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        warehouseId: warehouseByCode["WH-FG"].id,
        materialId: materialByCode["FG-SERVO-01"].id,
        transactionType: InventoryTransactionType.SUPPLEMENT,
        quantity: 6,
        transactionTime: new Date("2026-06-15T09:10:00.000Z")
      }
    ]
  });

  await prisma.inspection.createMany({
    data: [
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        inspectionNo: "IQC-20260612-01",
        type: InspectionType.IQC,
        sourceNo: "PO-20260612-01",
        materialId: materialByCode["RM-BEAR-A12"].id,
        status: InspectionStatus.PENDING,
        inspector: "赵质检"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        inspectionNo: "IQC-20260610-02",
        type: InspectionType.IQC,
        sourceNo: "PO-20260610-03",
        materialId: materialByCode["RM-HARNESS-H21"].id,
        status: InspectionStatus.FAIL,
        inspector: "赵质检"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        inspectionNo: "IQC-20260606-03",
        type: InspectionType.IQC,
        sourceNo: "PO-20260605-05",
        materialId: materialByCode["SM-CASE-C10"].id,
        status: InspectionStatus.PASS,
        inspector: "张来料"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        inspectionNo: "IPQC-20260615-01",
        type: InspectionType.IPQC,
        sourceNo: "WO-20260615-03",
        materialId: materialByCode["FG-SERVO-01"].id,
        status: InspectionStatus.PASS,
        inspector: "李过程"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        inspectionNo: "IPQC-20260614-02",
        type: InspectionType.IPQC,
        sourceNo: "WO-20260614-04",
        materialId: materialByCode["FG-PANEL-02"].id,
        status: InspectionStatus.FAIL,
        inspector: "李过程"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        inspectionNo: "FQC-20260611-01",
        type: InspectionType.FQC,
        sourceNo: "WO-20260610-07",
        materialId: materialByCode["FG-PANEL-02"].id,
        status: InspectionStatus.PASS,
        inspector: "周终检"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        inspectionNo: "FQC-20260604-02",
        type: InspectionType.FQC,
        sourceNo: "WO-20260603-08",
        materialId: materialByCode["FG-SERVO-01"].id,
        status: InspectionStatus.PASS,
        inspector: "周终检"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        inspectionNo: "FQC-20260617-03",
        type: InspectionType.FQC,
        sourceNo: "WO-20260617-02",
        materialId: materialByCode["FG-PANEL-02"].id,
        status: InspectionStatus.PENDING,
        inspector: "王终检"
      }
    ]
  });

  const equipmentList = await Promise.all([
    prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "LASER-03",
        name: "激光切割机 03",
        workCenterId: workCenterByCode["WC-MACH"].id,
        healthScore: 58,
        oee: 67,
        status: EquipmentStatus.STOPPED
      }
    }),
    prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "CNC-05",
        name: "数控加工中心 05",
        workCenterId: workCenterByCode["WC-MACH"].id,
        healthScore: 91,
        oee: 85,
        status: EquipmentStatus.RUNNING
      }
    }),
    prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "ASM-ROBOT-02",
        name: "装配机器人 02",
        workCenterId: workCenterByCode["WC-ASM"].id,
        healthScore: 88,
        oee: 91,
        status: EquipmentStatus.RUNNING
      }
    }),
    prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "TEST-BENCH-01",
        name: "测试台 01",
        workCenterId: workCenterByCode["WC-TEST"].id,
        healthScore: 73,
        oee: 62,
        status: EquipmentStatus.MAINTENANCE
      }
    }),
    prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        code: "PACK-LINE-01",
        name: "包装线 01",
        workCenterId: workCenterByCode["WC-PACK"].id,
        healthScore: 82,
        oee: 71,
        status: EquipmentStatus.IDLE
      }
    }),
    prisma.equipment.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryB.id,
        code: "SZ-ASM-01",
        name: "苏州装配线 01",
        workCenterId: workCenterByCode["WC-SZ-ASM"].id,
        healthScore: 86,
        oee: 79,
        status: EquipmentStatus.RUNNING
      }
    })
  ]);

  const equipmentByCode = Object.fromEntries(equipmentList.map((item) => [item.code, item]));

  await prisma.maintenanceOrder.createMany({
    data: [
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "MO-20260612-01",
        equipmentId: equipmentByCode["LASER-03"].id,
        description: "光路偏移校准",
        status: "PENDING"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "MO-20260609-02",
        equipmentId: equipmentByCode["TEST-BENCH-01"].id,
        description: "测试治具更换",
        status: "IN_PROGRESS"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "MO-20260605-03",
        equipmentId: equipmentByCode["PACK-LINE-01"].id,
        description: "皮带张力复检",
        status: "COMPLETED"
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        orderNo: "MO-20260604-04",
        equipmentId: equipmentByCode["CNC-05"].id,
        description: "主轴保养点检",
        status: "PLANNED"
      }
    ]
  });

  const servoBomItems = [
    { quantity: 2, lossRate: 2, unitCost: materialByCode["RM-BEAR-A12"].unitCost },
    { quantity: 1, lossRate: 1, unitCost: materialByCode["RM-HARNESS-H21"].unitCost },
    { quantity: 1, lossRate: 0.5, unitCost: materialByCode["SM-CASE-C10"].unitCost }
  ];
  const panelBomItems = [
    { quantity: 1, lossRate: 1, unitCost: materialByCode["RM-PCB-P88"].unitCost },
    { quantity: 1, lossRate: 1, unitCost: materialByCode["RM-HARNESS-H21"].unitCost },
    { quantity: 2, lossRate: 0.5, unitCost: materialByCode["RM-SENSOR-S05"].unitCost }
  ];
  const servoOperations = [
    { standardMinutes: 25, hourlyRate: workCenterByCode["WC-MACH"].hourlyRate },
    { standardMinutes: 18, hourlyRate: workCenterByCode["WC-ASM"].hourlyRate },
    { standardMinutes: 12, hourlyRate: workCenterByCode["WC-TEST"].hourlyRate }
  ];
  const panelOperations = [
    { standardMinutes: 22, hourlyRate: workCenterByCode["WC-ASM"].hourlyRate },
    { standardMinutes: 15, hourlyRate: workCenterByCode["WC-TEST"].hourlyRate },
    { standardMinutes: 8, hourlyRate: workCenterByCode["WC-PACK"].hourlyRate }
  ];

  await Promise.all([
    prisma.productionCost.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260610-07"].id,
        ...calculateProductionCost(110, panelBomItems, panelOperations)
      }
    }),
    prisma.productionCost.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260603-08"].id,
        ...calculateProductionCost(95, servoBomItems, servoOperations)
      }
    }),
    prisma.productionCost.create({
      data: {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        productionOrderId: orderByNo["WO-20260520-09"].id,
        ...calculateProductionCost(75, panelBomItems, panelOperations)
      }
    })
  ]);

  await prisma.integrationJob.createMany({
    data: [
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        system: IntegrationSystem.MES,
        direction: "ERP->MES",
        status: IntegrationJobStatus.SUCCESS,
        message: "工单 WO-20260617-02 已下发 MES",
        payload: { orderNo: "WO-20260617-02" }
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        system: IntegrationSystem.WMS,
        direction: "WMS->ERP",
        status: IntegrationJobStatus.RUNNING,
        message: "库存余额同步中",
        payload: { warehouses: ["WH-RAW", "WH-WIP", "WH-FG"] }
      },
      {
        tenantId: tenant.id,
        factoryId: factoryA.id,
        system: IntegrationSystem.QMS,
        direction: "QMS->ERP",
        status: IntegrationJobStatus.FAILED,
        message: "检验结果回传失败，待重试",
        payload: { inspectionNo: "IQC-20260610-02" }
      }
    ]
  });

  await prisma.integrationMapping.createMany({
    data: [
      { tenantId: tenant.id, system: IntegrationSystem.MES, entityName: "ProductionOrder", fieldName: "orderNo", sourceField: "work_order_no" },
      { tenantId: tenant.id, system: IntegrationSystem.WMS, entityName: "InventoryBalance", fieldName: "onHandQty", sourceField: "qty_on_hand" },
      { tenantId: tenant.id, system: IntegrationSystem.QMS, entityName: "Inspection", fieldName: "status", sourceField: "inspection_result" }
    ]
  });

  await prisma.aiInteraction.create({
    data: {
      tenantId: tenant.id,
      factoryId: factoryA.id,
      type: AiInteractionType.SUMMARY,
      prompt: "生成今日经营摘要",
      result: "上海一厂当前有 3 张工单处于在制，轴承 A12、连接底座和控制板存在补料压力，LASER-03 与 TEST-BENCH-01 需要重点关注，建议优先保障 WO-20260615-03 与 WO-20260613-05 的物料齐套。",
      evidence: [
        "WO-20260615-03",
        "WO-20260613-05",
        "PO-20260612-01",
        "IQC-20260610-02",
        "LASER-03"
      ]
    }
  });

  console.log("Demo seed ready:", {
    tenant: tenant.code,
    defaultFactory: factoryA.code,
    user: admin.username,
    demoUsers: ["admin", "planner", "warehouse", "quality", "equipment", "finance"],
    demoPassword: "Demo@123",
    materials: 7,
    orders: productionOrders.length
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
