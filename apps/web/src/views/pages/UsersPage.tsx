import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";

type Role = { id: string; code: string; name: string };
type User = { id: string; username: string; displayName: string; status: string; roles: Role[] };

const STATUS_COLORS: Record<string, string> = { ACTIVE: "green", INACTIVE: "default" };
const STATUS_LABELS: Record<string, string> = { ACTIVE: "启用", INACTIVE: "停用" };

export function UsersPage() {
  const qc = useQueryClient();
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/users")).data as User[] });
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: async () => (await api.get("/roles")).data as Role[] });

  const [createModal, setCreateModal] = useState(false);
  const [rolesModal, setRolesModal] = useState<{ open: boolean; userId?: string; current?: string[] }>({ open: false });
  const [createForm] = Form.useForm();
  const [rolesForm] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/users", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setCreateModal(false); createForm.resetFields(); }
  });
  const assignMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) => api.post(`/users/${id}/assign-roles`, { roleIds }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setRolesModal({ open: false }); }
  });
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] })
  });

  function openRolesModal(user: User) {
    setRolesModal({ open: true, userId: user.id, current: user.roles.map(r => r.id) });
    rolesForm.setFieldsValue({ roleIds: user.roles.map(r => r.id) });
  }

  return (
    <>
      <Card title="用户管理" extra={<Button type="primary" onClick={() => setCreateModal(true)}>新建用户</Button>}>
        <Table rowKey="id" dataSource={usersQuery.data ?? []} size="small"
          columns={[
            { title: "用户名", dataIndex: "username" },
            { title: "显示名", dataIndex: "displayName" },
            {
              title: "状态", dataIndex: "status",
              render: (v: string) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v] ?? v}</Tag>
            },
            {
              title: "角色", dataIndex: "roles",
              render: (roles: Role[]) => roles.map(r => <Tag key={r.id}>{r.name}</Tag>)
            },
            {
              title: "操作",
              render: (_: unknown, record: User) => (
                <Space>
                  <Button size="small" onClick={() => openRolesModal(record)}>角色分配</Button>
                  {record.status === "ACTIVE" && (
                    <Popconfirm title="确认停用该用户？" onConfirm={() => deactivateMutation.mutate(record.id)}>
                      <Button size="small" danger>停用</Button>
                    </Popconfirm>
                  )}
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal title="新建用户" open={createModal}
        onOk={() => createForm.submit()} onCancel={() => { setCreateModal(false); createForm.resetFields(); }}
        confirmLoading={createMutation.isPending}>
        <Form form={createForm} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }, { min: 8, message: "至少8位" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="displayName" label="显示名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="organizationId" label="组织 ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select mode="multiple" options={(rolesQuery.data ?? []).map(r => ({ value: r.id, label: r.name }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="角色分配" open={rolesModal.open}
        onOk={() => rolesForm.submit()} onCancel={() => setRolesModal({ open: false })}
        confirmLoading={assignMutation.isPending}>
        <Form form={rolesForm} layout="vertical"
          onFinish={(v) => assignMutation.mutate({ id: rolesModal.userId!, roleIds: v.roleIds ?? [] })}>
          <Form.Item name="roleIds" label="分配角色">
            <Select mode="multiple" options={(rolesQuery.data ?? []).map(r => ({ value: r.id, label: r.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
