import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import dayjs from "dayjs";
import { api } from "../../lib/api";

type ProductionOrder = {
  id: string; orderNo: string; productCode: string; productName: string;
  quantity: number; plannedStartDate: string; plannedEndDate: string;
  status: string; progress: number; priority: number;
};
type Material = { id: string; code: string; name: string };
type RoutingHeader = { id: string; code: string; materialCode: string };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿", RELEASED: "已下发", IN_PROGRESS: "生产中",
  PAUSED: "暂停", COMPLETED: "完成", CLOSED: "关闭"
};

export function ProductionPage() {
  const qc = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ["production-orders"], queryFn: async () => (await api.get("/production-orders")).data as ProductionOrder[] });
  const materialsQuery = useQuery({ queryKey: ["materials"], queryFn: async () => (await api.get("/materials")).data as Material[] });
  const routingsQuery = useQuery({ queryKey: ["routings"], queryFn: async () => (await api.get("/routings")).data as RoutingHeader[] });

  const [modal, setModal] = useState<{ open: boolean; record?: ProductionOrder }>({ open: false });
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/production-orders", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["production-orders"] })
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & object) => api.patch(`/production-orders/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["production-orders"] })
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/production-orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["production-orders"] })
  });
  const releaseMutation = useMutation({
    mutationFn: (id: string) => api.post(`/production-orders/${id}/release`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["production-orders"] })
  });
  const reportMutation = useMutation({
    mutationFn: (id: string) => api.post(`/operations/${id}/report`, { reportType: "COMPLETE", reportedQty: 10, scrapQty: 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["production-orders"] })
  });

  function openModal(record?: ProductionOrder) {
    setModal({ open: true, record });
    form.setFieldsValue(record ? {
      ...record,
      productId: materialsQuery.data?.find(m => m.code === record.productCode)?.id,
      plannedStartDate: dayjs(record.plannedStartDate),
      plannedEndDate: dayjs(record.plannedEndDate)
    } : {});
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = {
      ...values,
      plannedStartDate: (values.plannedStartDate as dayjs.Dayjs).format("YYYY-MM-DD"),
      plannedEndDate: (values.plannedEndDate as dayjs.Dayjs).format("YYYY-MM-DD")
    };
    if (modal.record) await updateMutation.mutateAsync({ id: modal.record.id, ...payload });
    else await createMutation.mutateAsync(payload);
    setModal({ open: false });
    form.resetFields();
  }

  return (
    <>
      <Card title="工单与报工" extra={<Button type="primary" onClick={() => openModal()}>新建工单</Button>}>
        <Table rowKey="id" dataSource={ordersQuery.data ?? []} size="small"
          columns={[
            { title: "工单", dataIndex: "orderNo" },
            { title: "产品", dataIndex: "productName" },
            { title: "数量", dataIndex: "quantity" },
            { title: "进度", dataIndex: "progress", render: (v: number) => `${v}%` },
            { title: "状态", dataIndex: "status", render: (v: string) => STATUS_LABELS[v] ?? v },
            {
              title: "操作",
              render: (_: unknown, record: ProductionOrder) => (
                <Space>
                  {record.status === "DRAFT" && (
                    <>
                      <Button size="small" onClick={() => openModal(record)}>编辑</Button>
                      <Button size="small" onClick={() => releaseMutation.mutate(record.id)}>下发</Button>
                      <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
                        <Button size="small" danger>删除</Button>
                      </Popconfirm>
                    </>
                  )}
                  {record.status === "RELEASED" && (
                    <Button size="small" type="primary" onClick={() => reportMutation.mutate(record.id)}>报工</Button>
                  )}
                  {record.status === "IN_PROGRESS" && (
                    <Button size="small" type="primary" onClick={() => reportMutation.mutate(record.id)}>报工</Button>
                  )}
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal title={modal.record ? "编辑工单" : "新建工单"} open={modal.open}
        onOk={() => form.submit()} onCancel={() => { setModal({ open: false }); form.resetFields(); }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="orderNo" label="工单号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="productId" label="产品" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              options={(materialsQuery.data ?? []).filter(m => ["FINISHED", "SEMI_FINISHED"].includes((m as unknown as { type: string }).type)).map(m => ({ value: m.id, label: `${m.code} ${m.name}` }))}
            />
          </Form.Item>
          <Form.Item name="routingHeaderId" label="工艺路线">
            <Select allowClear options={(routingsQuery.data ?? []).map(r => ({ value: r.id, label: r.code }))} />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="plannedStartDate" label="计划开始" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="plannedEndDate" label="计划完成" rules={[{ required: true }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="priority" label="优先级"><InputNumber min={1} max={5} style={{ width: "100%" }} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
