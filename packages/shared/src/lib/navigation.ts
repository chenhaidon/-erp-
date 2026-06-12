export const appNavigation = [
  { key: "dashboard", label: "运营驾驶舱", path: "/", permissions: ["dashboard:view"] },
  { key: "kanban", label: "生产看板", path: "/kanban", permissions: ["production:manage"] },
  { key: "master-data", label: "主数据中心", path: "/master-data", permissions: ["master-data:manage"] },
  { key: "bom", label: "BOM 管理", path: "/bom", permissions: ["master-data:manage"] },
  { key: "routings", label: "工艺路线", path: "/routings", permissions: ["master-data:manage"] },
  { key: "mrp", label: "MRP 运算", path: "/mrp", permissions: ["production:manage"] },
  { key: "production", label: "工单与报工", path: "/production", permissions: ["production:manage"] },
  { key: "schedule", label: "排程管理", path: "/schedule", permissions: ["production:manage"] },
  { key: "inventory", label: "库存与采购", path: "/inventory", permissions: ["inventory:manage"] },
  { key: "quality", label: "质量中心", path: "/quality", permissions: ["quality:manage"] },
  { key: "equipment", label: "设备中心", path: "/equipment", permissions: ["equipment:manage"] },
  { key: "costs", label: "成本管理", path: "/costs", permissions: ["costs:view"] },
  { key: "integrations", label: "集成监控", path: "/integrations", permissions: ["integration:manage"] },
  { key: "reports", label: "报表与导出", path: "/reports", permissions: ["reports:view"] },
  { key: "ai", label: "AI 助手", path: "/ai", permissions: ["ai:use"] },
  { key: "users", label: "用户管理", path: "/users", permissions: ["users:manage"] }
] as const;

export type AppNavigationItem = (typeof appNavigation)[number];

export function hasPermission(userPermissions: readonly string[], requiredPermissions: readonly string[]) {
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

export function getNavigationItemByPath(path: string) {
  return appNavigation.find((item) => item.path === path);
}

export function canAccessPath(path: string, permissions: readonly string[]) {
  const item = getNavigationItemByPath(path);
  return item ? hasPermission(permissions, item.permissions) : false;
}

export function getAccessibleNavigation(permissions: readonly string[]) {
  return appNavigation.filter((item) => hasPermission(permissions, item.permissions));
}
