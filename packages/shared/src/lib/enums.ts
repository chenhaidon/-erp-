export enum DataScope {
  TENANT = "TENANT",
  ORGANIZATION = "ORGANIZATION",
  FACTORY = "FACTORY",
  DEPARTMENT = "DEPARTMENT",
  SELF = "SELF"
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}

export enum MaterialType {
  FINISHED = "FINISHED",
  SEMI_FINISHED = "SEMI_FINISHED",
  RAW = "RAW",
  CONSUMABLE = "CONSUMABLE"
}

export enum ProductionOrderStatus {
  DRAFT = "DRAFT",
  RELEASED = "RELEASED",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED"
}

export enum OperationReportType {
  START = "START",
  PAUSE = "PAUSE",
  COMPLETE = "COMPLETE",
  SCRAP = "SCRAP",
  REWORK = "REWORK",
  RECEIPT_CONFIRM = "RECEIPT_CONFIRM"
}

export enum InventoryTransactionType {
  RECEIPT = "RECEIPT",
  ISSUE = "ISSUE",
  TRANSFER = "TRANSFER",
  COUNT = "COUNT",
  ADJUSTMENT = "ADJUSTMENT",
  RETURN = "RETURN",
  SUPPLEMENT = "SUPPLEMENT"
}

export enum PurchaseOrderStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SENT = "SENT",
  PARTIAL_RECEIVED = "PARTIAL_RECEIVED",
  RECEIVED = "RECEIVED"
}

export enum InspectionType {
  IQC = "IQC",
  IPQC = "IPQC",
  FQC = "FQC"
}

export enum InspectionStatus {
  PENDING = "PENDING",
  PASS = "PASS",
  FAIL = "FAIL"
}

export enum EquipmentStatus {
  RUNNING = "RUNNING",
  IDLE = "IDLE",
  STOPPED = "STOPPED",
  MAINTENANCE = "MAINTENANCE"
}

export enum IntegrationSystem {
  MES = "MES",
  WMS = "WMS",
  QMS = "QMS",
  EAM = "EAM",
  SRM = "SRM"
}

export enum IntegrationJobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED"
}

export enum AiInteractionType {
  ASK_SCHEDULE = "ASK_SCHEDULE",
  ROOT_CAUSE = "ROOT_CAUSE",
  SUMMARY = "SUMMARY"
}
