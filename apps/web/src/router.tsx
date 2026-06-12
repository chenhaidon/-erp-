import { canAccessPath } from "@smart-erp/shared";
import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { LoginPage } from "./views/LoginPage";
import { AiPage } from "./views/pages/AiPage";
import { BomPage } from "./views/pages/BomPage";
import { DashboardPage } from "./views/pages/DashboardPage";
import { EquipmentPage } from "./views/pages/EquipmentPage";
import { IntegrationsPage } from "./views/pages/IntegrationsPage";
import { InventoryPage } from "./views/pages/InventoryPage";
import { KanbanPage } from "./views/pages/KanbanPage";
import { MasterDataPage } from "./views/pages/MasterDataPage";
import { MrpPage } from "./views/pages/MrpPage";
import { ProductionPage } from "./views/pages/ProductionPage";
import { QualityPage } from "./views/pages/QualityPage";
import { ReportsPage } from "./views/pages/ReportsPage";
import { RoutingsPage } from "./views/pages/RoutingsPage";
import { SchedulePage } from "./views/pages/SchedulePage";
import { UsersPage } from "./views/pages/UsersPage";
import { CostPage } from "./views/pages/CostPage";
import { useSessionStore } from "./state/session-store";

function GuardedPage({ path, children }: { path: string; children: ReactNode }) {
  const permissions = useSessionStore((state) => state.permissions);

  if (!permissions.length) {
    return <>{children}</>;
  }

  if (!canAccessPath(path, permissions)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ProtectedRoutes() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const permissions = useSessionStore((state) => state.permissions);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (permissions.length && !canAccessPath(location.pathname, permissions)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<GuardedPage path="/"><DashboardPage /></GuardedPage>} />
        <Route path="/kanban" element={<GuardedPage path="/kanban"><KanbanPage /></GuardedPage>} />
        <Route path="/master-data" element={<GuardedPage path="/master-data"><MasterDataPage /></GuardedPage>} />
        <Route path="/bom" element={<GuardedPage path="/bom"><BomPage /></GuardedPage>} />
        <Route path="/routings" element={<GuardedPage path="/routings"><RoutingsPage /></GuardedPage>} />
        <Route path="/mrp" element={<GuardedPage path="/mrp"><MrpPage /></GuardedPage>} />
        <Route path="/production" element={<GuardedPage path="/production"><ProductionPage /></GuardedPage>} />
        <Route path="/schedule" element={<GuardedPage path="/schedule"><SchedulePage /></GuardedPage>} />
        <Route path="/inventory" element={<GuardedPage path="/inventory"><InventoryPage /></GuardedPage>} />
        <Route path="/quality" element={<GuardedPage path="/quality"><QualityPage /></GuardedPage>} />
        <Route path="/equipment" element={<GuardedPage path="/equipment"><EquipmentPage /></GuardedPage>} />
        <Route path="/costs" element={<GuardedPage path="/costs"><CostPage /></GuardedPage>} />
        <Route path="/integrations" element={<GuardedPage path="/integrations"><IntegrationsPage /></GuardedPage>} />
        <Route path="/reports" element={<GuardedPage path="/reports"><ReportsPage /></GuardedPage>} />
        <Route path="/ai" element={<GuardedPage path="/ai"><AiPage /></GuardedPage>} />
        <Route path="/users" element={<GuardedPage path="/users"><UsersPage /></GuardedPage>} />
      </Routes>
    </AppShell>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}
