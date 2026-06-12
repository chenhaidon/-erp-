import type {
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
  ProductionOrderStatus,
  PurchaseOrderStatus
} from "./enums";

export interface ApiListResult<T> {
  items: T[];
  total: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUserProfile {
  id: string;
  username: string;
  displayName: string;
  tenantId: string;
  organizationId: string;
  defaultFactoryId: string;
  roles: Array<{
    code: string;
    name: string;
    dataScope: DataScope;
  }>;
  permissions: string[];
}

export interface FactorySummary {
  id: string;
  code: string;
  name: string;
  organizationId: string;
}

export interface DashboardSummary {
  deliveryRate: number;
  equipmentOee: number;
  riskOrders: number;
  inventoryAccuracy: number;
  openOrders: number;
  pendingInspections: number;
  pendingPurchaseApprovals: number;
  qualityAlerts: number;
  equipmentAlerts: number;
}

export interface MaterialDto {
  id: string;
  code: string;
  name: string;
  specification: string;
  type: MaterialType;
  unit: string;
  safetyStock: number;
  leadTimeDays: number;
}

export interface BomDto {
  id: string;
  code: string;
  materialCode: string;
  version: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: string;
  items: Array<{
    materialCode: string;
    quantity: number;
    lossRate: number;
    substituteMaterialCode?: string;
  }>;
}

export interface RoutingDto {
  id: string;
  code: string;
  materialCode: string;
  version: string;
  status: string;
  operations: Array<{
    sequence: number;
    operationCode: string;
    operationName: string;
    workCenterCode: string;
    standardMinutes: number;
  }>;
}

export interface ProductionOrderDto {
  id: string;
  orderNo: string;
  productCode: string;
  productName: string;
  quantity: number;
  plannedStartDate: string;
  plannedEndDate: string;
  status: ProductionOrderStatus;
  progress: number;
  priority: number;
}

export interface OperationReportDto {
  id: string;
  productionOrderNo: string;
  operationCode: string;
  reportType: OperationReportType;
  reportedQty: number;
  scrapQty: number;
  reportTime: string;
  operatorName: string;
}

export interface InventoryTransactionDto {
  id: string;
  materialCode: string;
  materialName: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  warehouseName: string;
  transactionTime: string;
}

export interface PurchaseOrderDto {
  id: string;
  orderNo: string;
  supplierName: string;
  materialCode: string;
  quantity: number;
  dueDate: string;
  status: PurchaseOrderStatus;
}

export interface InspectionDto {
  id: string;
  inspectionNo: string;
  type: InspectionType;
  sourceNo: string;
  materialCode: string;
  status: InspectionStatus;
  inspector: string;
}

export interface EquipmentDto {
  id: string;
  code: string;
  name: string;
  workCenterCode: string;
  healthScore: number;
  oee: number;
  status: EquipmentStatus;
}

export interface IntegrationJobDto {
  id: string;
  system: IntegrationSystem;
  direction: string;
  status: IntegrationJobStatus;
  message: string;
  triggeredAt: string;
}

export interface AiInteractionDto {
  id: string;
  type: AiInteractionType;
  prompt: string;
  result: string;
  evidence: string[];
  createdAt: string;
}
