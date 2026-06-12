import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";

type Inspection = { id: string; inspectionNo: string; type: string; sourceNo: string; materialCode: string; status: string; inspector: string };
type Material = { id: string; code: string; name: string };

const INSPECTION_TYPES = [
  { value: "IQC", label: "来料检验" },
  { value: "IPQC", label: "过程检验" },
  { value: "FQC", label: "成品检验" }
];
const STATUS_COLORS: Record<string, string> = { PENDING: "orange", PASS: "green", FAIL: "red" };
const STATUS_LABELS: Record<string, string> = { PENDING: "待检", PASS: "通过", FAIL: "不通过" };

export function QualityPage() {
  const qc = useQueryClient();
  const inspectionsQuery = useQuery({ queryKey: ["inspections"], queryFn: async () => (await api.get("/inspections")).data as Inspection[] });
  const capaQuery = useQuery({ queryKey: ["capa"], queryFn: async () => (await api.get("/capa")).data });
  const materialsQuery = useQuery({ queryKey: ["materials"], queryFn: async () => (await api.get("/materials")).data as Material[] });

  const [modal, setModal] = useState(false);
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/inspections", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inspections"] })
  });
  const judgeMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/inspections/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inspections"] }); qc.invalidateQueries({ queryKey: ["capa"] }); }
  });

  async function handleSubmit(values: object) {
    await createMutation.mutateAsync(values);
    setModal(false);
    form.resetFields();
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="检验记录" extra={<Button type="primary" size="small" onClick={() => setModal(true)}>新建检验单</Button>}>
            <Table rowKey="id" size="small" dataSource={inspectionsQuery.data ?? []}
              columns={[
                { title: "检验单", dataIndex: "inspectionNo" },
                { title: "类型", dataIndex: "type", render: (v: string) => INSPECTION_TYPES.find(t => t.value === v)?.label ?? v },
                { title: "来源", dataIndex: "sourceNo" },
                { title: "物料", dataIndex: "materialCode" },
                { title: "检验员", dataIndex: "inspector" },
                {
                  title: "状态", dataIndex: "status",
                  render: (v: string) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v] ?? v}</Tag>
                },
                {
                  title: "操作",
                  render: (_: unknown, record: Inspection) => record.status === "PENDING" ? (
                    <Space>
                      <Button size="small" type="primary" onClick={() => judgeMutation.mutate({ id: record.id, status: "PASS" })}>通过</Button>
                      <Button size="small" danger onClick={() => judgeMutation.mutate({ id: record.id, status: "FAIL" })}>不通过</Button>
                    </Space>
                  ) : null
                }
              ]}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="CAPA">
            <Table rowKey="id" size="small" pagination={false} dataSource={capaQuery.data ?? []}
              columns={[
                { title: "主题", dataIndex: "title" },
                { title: "责任人", dataIndex: "owner" },
                { title: "状态", dataIndex: "status" }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal title="新建检验单" open={modal}
        onOk={() => form.submit()} onCancel={() => { setModal(false); form.resetFields(); }}
        confirmLoading={createMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="inspectionNo" label="检验单号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="检验类型" rules={[{ required: true }]}><Select options={INSPECTION_TYPES} /></Form.Item>
          <Form.Item name="sourceNo" label="来源单号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="materialId" label="物料" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              options={(materialsQuery.data ?? []).map(m => ({ value: m.id, label: `${m.code} ${m.name}` }))}
            />
          </Form.Item>
          <Form.Item name="inspector" label="检验员" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
