import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hasPermission, type CurrentUserProfile } from "@smart-erp/shared";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { api } from "../../lib/api";
import { useSessionStore } from "../../state/session-store";

type PurchaseOrder = {
  id: string;
  orderNo: string;
  supplierName: string;
  materialCode: string;
  quantity: number;
  dueDate: string;
  status: string;
  approvalRemark?: string | null;
};
type Supplier = { id: string; code: string; name: string };
type Material = { id: string; code: string; name: string };
type SessionRole = CurrentUserProfile["roles"][number];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  SUBMITTED: "gold",
  APPROVED: "blue",
  REJECTED: "red",
  SENT: "orange",
  PARTIAL_RECEIVED: "cyan",
  RECEIVED: "green"
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  SUBMITTED: "待审批",
  APPROVED: "已审批",
  REJECTED: "已驳回",
  SENT: "已发出",
  PARTIAL_RECEIVED: "部分到货",
  RECEIVED: "已到货"
};

export function InventoryPage() {
  const qc = useQueryClient();
  const permissions = useSessionStore((state) => state.permissions);
  const roles = useSessionStore((state) => state.roles) as SessionRole[];
  const transactionsQuery = useQuery({ queryKey: ["inventory-transactions"], queryFn: async () => (await api.get("/inventory-transactions")).data });
  const purchaseOrdersQuery = useQuery({ queryKey: ["purchase-orders"], queryFn: async () => (await api.get("/purchase-orders")).data as PurchaseOrder[] });
  const suppliersQuery = useQuery({ queryKey: ["suppliers"], queryFn: async () => (await api.get("/suppliers")).data as Supplier[] });
  const materialsQuery = useQuery({ queryKey: ["materials"], queryFn: async () => (await api.get("/materials")).data as Material[] });

  const [modal, setModal] = useState<{ open: boolean; record?: PurchaseOrder }>({ open: false });
  const [rejectingOrder, setRejectingOrder] = useState<PurchaseOrder | null>(null);
  const [form] = Form.useForm();

  const canManageInventory = hasPermission(permissions, ["inventory:manage"]);
  const canSubmitPurchase = hasPermission(permissions, ["inventory:purchase:submit"]);
  const canApprovePurchase = hasPermission(permissions, ["inventory:purchase:approve"]);
  const roleSummary = useMemo(() => roles.map((role) => role.name).join("、"), [roles]);

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/purchase-orders", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & object) => api.patch(`/purchase-orders/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] })
  });
  const submitMutation = useMutation({
    mutationFn: (id: string) => api.post(`/purchase-orders/${id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] })
  });
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/purchase-orders/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] })
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, remark }: { id: string; remark?: string }) => api.post(`/purchase-orders/${id}/reject`, { remark }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] })
  });

  function openModal(record?: PurchaseOrder) {
    setModal({ open: true, record });
    form.setFieldsValue(record ? {
      ...record,
      supplierId: suppliersQuery.data?.find((s) => s.name === record.supplierName)?.id,
      materialId: materialsQuery.data?.find((m) => m.code === record.materialCode)?.id,
      dueDate: dayjs(record.dueDate)
    } : {});
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = { ...values, dueDate: (values.dueDate as dayjs.Dayjs).format("YYYY-MM-DD") };
    if (modal.record) await updateMutation.mutateAsync({ id: modal.record.id, ...payload });
    else await createMutation.mutateAsync(payload);
    setModal({ open: false });
    form.resetFields();
  }

  async function handleReject() {
    const values = await form.validateFields(["rejectRemark"]);
    if (!rejectingOrder) {
      return;
    }
    await rejectMutation.mutateAsync({ id: rejectingOrder.id, remark: values.rejectRemark });
    setRejectingOrder(null);
    form.resetFields(["rejectRemark"]);
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card title="库存事务">
            <Table rowKey="id" size="small" dataSource={transactionsQuery.data ?? []}
              columns={[
                { title: "物料", dataIndex: "materialCode" },
                { title: "名称", dataIndex: "materialName" },
                { title: "类型", dataIndex: "transactionType" },
                { title: "数量", dataIndex: "quantity" },
                { title: "仓库", dataIndex: "warehouseName" }
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title="采购单"
            extra={canManageInventory ? <Button type="primary" size="small" onClick={() => openModal()}>新建采购单</Button> : undefined}
          >
            <div style={{ marginBottom: 12, color: "#64748b", fontSize: 12 }}>
              当前角色：{roleSummary || "未配置"}
            </div>
            <Table rowKey="id" size="small" pagination={false} dataSource={purchaseOrdersQuery.data ?? []}
              columns={[
                { title: "单号", dataIndex: "orderNo" },
                { title: "供应商", dataIndex: "supplierName" },
                { title: "物料", dataIndex: "materialCode" },
                { title: "状态", dataIndex: "status", render: (v: string) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v] ?? v}</Tag> },
                {
                  title: "说明",
                  render: (_: unknown, record: PurchaseOrder) => record.approvalRemark ? <span>{record.approvalRemark}</span> : <span style={{ color: "#94a3b8" }}>-</span>
                },
                {
                  title: "操作",
                  render: (_: unknown, record: PurchaseOrder) => (
                    <Space wrap>
                      {record.status === "DRAFT" && canManageInventory && (
                        <Button size="small" onClick={() => openModal(record)}>编辑</Button>
                      )}
                      {(record.status === "DRAFT" || record.status === "REJECTED") && canSubmitPurchase && (
                        <Button size="small" type="primary" onClick={() => submitMutation.mutate(record.id)}>提交审批</Button>
                      )}
                      {record.status === "SUBMITTED" && canApprovePurchase && (
                        <>
                          <Button size="small" type="primary" onClick={() => approveMutation.mutate(record.id)}>审批通过</Button>
                          <Button size="small" danger onClick={() => setRejectingOrder(record)}>驳回</Button>
                        </>
                      )}
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal title={modal.record ? "编辑采购单" : "新建采购单"} open={modal.open}
        onOk={() => form.submit()} onCancel={() => { setModal({ open: false }); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="orderNo" label="采购单号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}>
            <select style={{ width: "100%", padding: "4px 8px", border: "1px solid #d9d9d9", borderRadius: 6 }}>
              <option value="">请选择</option>
              {(suppliersQuery.data ?? []).map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Form.Item>
          <Form.Item name="materialId" label="物料" rules={[{ required: true }]}>
            <select style={{ width: "100%", padding: "4px 8px", border: "1px solid #d9d9d9", borderRadius: 6 }}>
              <option value="">请选择</option>
              {(materialsQuery.data ?? []).map((m: Material) => <option key={m.id} value={m.id}>{m.code} {m.name}</option>)}
            </select>
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="dueDate" label="到货日期" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="驳回采购单"
        open={Boolean(rejectingOrder)}
        onOk={handleReject}
        onCancel={() => {
          setRejectingOrder(null);
          form.resetFields(["rejectRemark"]);
        }}
        confirmLoading={rejectMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="rejectRemark" label="驳回原因" rules={[{ required: true, message: "请填写驳回原因" }]}>
            <Input.TextArea rows={4} maxLength={100} showCount placeholder="例如：数量需要调整或交期需重排" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
