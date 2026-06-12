import type { CurrentUserProfile } from "@smart-erp/shared";
import { getAccessibleNavigation, getNavigationItemByPath } from "@smart-erp/shared";
import { Layout, Menu, Select, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useApiBootstrap } from "../hooks/use-api";
import { useRealtimeConnection } from "../hooks/use-realtime";
import { useSessionStore } from "../state/session-store";

const { Header, Sider, Content } = Layout;

type AuthProfile = CurrentUserProfile;

function sameRoles(left: CurrentUserProfile["roles"], right: CurrentUserProfile["roles"]) {
  return (
    left.length === right.length &&
    left.every(
      (role, index) =>
        role.code === right[index]?.code && role.name === right[index]?.name && role.dataScope === right[index]?.dataScope
    )
  );
}

function samePermissions(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((permission, index) => permission === right[index]);
}

export function AppShell({ children }: { children: ReactNode }) {
  useApiBootstrap();
  const location = useLocation();
  const navigate = useNavigate();
  const factoryId = useSessionStore((state) => state.factoryId);
  const permissions = useSessionStore((state) => state.permissions);
  const setFactoryId = useSessionStore((state) => state.setFactoryId);
  const syncProfile = useSessionStore((state) => state.syncProfile);
  const accessToken = useSessionStore((state) => state.accessToken);
  const username = useSessionStore((state) => state.username);
  const displayName = useSessionStore((state) => state.displayName);
  const roles = useSessionStore((state) => state.roles);
  useRealtimeConnection(accessToken, factoryId);

  const navigationItems = useMemo(() => getAccessibleNavigation(permissions), [permissions]);

  const { data: factories } = useQuery({
    queryKey: ["factories"],
    queryFn: async () => (await api.get("/me/factories")).data as Array<{ id: string; name: string; code: string }>
  });

  const { data: profile } = useQuery({
    queryKey: ["auth-profile", factoryId],
    queryFn: async () => (await api.get("/auth/me")).data as AuthProfile,
    enabled: Boolean(accessToken),
    staleTime: 60_000
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    if (
      profile.username === username &&
      profile.displayName === displayName &&
      samePermissions(profile.permissions, permissions) &&
      sameRoles(profile.roles, roles)
    ) {
      return;
    }

    syncProfile({
      username: profile.username,
      displayName: profile.displayName,
      permissions: profile.permissions,
      roles: profile.roles
    });
  }, [displayName, permissions, profile, roles, syncProfile, username]);

  useEffect(() => {
    if (!factories?.length) {
      return;
    }

    if (!factoryId || !factories.some((item) => item.id === factoryId)) {
      setFactoryId(factories[0].id);
    }
  }, [factories, factoryId, setFactoryId]);

  useEffect(() => {
    if (!navigationItems.length) {
      return;
    }

    const current = getNavigationItemByPath(location.pathname);
    if (!current || !navigationItems.some((item) => item.path === current.path)) {
      navigate(navigationItems[0].path, { replace: true });
    }
  }, [location.pathname, navigate, navigationItems]);

  const selectedKeys = useMemo(() => {
    const current = navigationItems.find((item) => item.path === location.pathname);
    return current ? [current.key] : navigationItems[0] ? [navigationItems[0].key] : [];
  }, [location.pathname, navigationItems]);

  return (
    <Layout className="app-layout">
      <Sider width={260} className="app-sider">
        <div className="brand-block">
          <Typography.Text className="brand-caption">Smart Manufacturing ERP</Typography.Text>
          <Typography.Title level={3} className="brand-title">智造云枢</Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={navigationItems.map((item) => ({ key: item.key, label: item.label }))}
          onClick={(event) => {
            const target = navigationItems.find((item) => item.key === event.key);
            if (target) {
              navigate(target.path);
            }
          }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div>
            <Typography.Text type="secondary">一期系统</Typography.Text>
            <Typography.Title level={4} className="header-title">制造运营一体化控制台</Typography.Title>
          </div>
          <Select
            className="factory-switch"
            value={factoryId}
            options={(factories ?? []).map((item) => ({ value: item.id, label: `${item.name} (${item.code})` }))}
            onChange={async (value) => {
              await api.post("/me/switch-factory", { factoryId: value });
              setFactoryId(value);
            }}
          />
        </Header>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
