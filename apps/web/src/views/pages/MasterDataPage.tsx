import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Table } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";

const MATERIAL_TYPES = [
  { value: "FINISHED", label: "成品" },
  { value: "SEMI_FINISHED", label: "半成品" },
  { value: "RAW", label: "原材料" },
  { value: "CONSUMABLE", label: "耗材" }
];

type Material = { id: string; code: string; name: string; specification: string; type: string; unit: string; safetyStock: number; leadTimeDays: number };
type Supplier = { id: string; code: string; name: string };
type Warehouse = { id: string; code: string; name: string };

function useCrud<T extends { id: string }>(queryKey: string, path: string) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: [queryKey], queryFn: async () => (await api.get(`/${path}`)).data as T[] });
  const create = useMutation({ mutationFn: (data: object) => api.post(`/${path}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }) });
  const update = useMutation({ mutationFn: ({ id, ...data }: { id: string } & object) => api.patch(`/${path}/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }) });
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/${path}/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }) });
  return { query, create, update, remove };
}

export function MasterDataPage() {
  const materials = useCrud<Material>("materials", "materials");
  const suppliers = useCrud<Supplier>("suppliers", "suppliers");
  const warehouses = useCrud<Warehouse>("warehouses", "warehouses");

  const [matModal, setMatModal] = useState<{ open: boolean; record?: Material }>({ open: false });
  const [supModal, setSupModal] = useState<{ open: boolean; record?: Supplier }>({ open: false });
  const [whModal, setWhModal] = useState<{ open: boolean; record?: Warehouse }>({ open: false });
  const [matForm] = Form.useForm();
  const [supForm] = Form.useForm();
  const [whForm] = Form.useForm();

  function openMat(record?: Material) { setMatModal({ open: true, record }); matForm.setFieldsValue(record ?? {}); }
  function openSup(record?: Supplier) { setSupModal({ open: true, record }); supForm.setFieldsValue(record ?? {}); }
  function openWh(record?: Warehouse) { setWhModal({ open: true, record }); whForm.setFieldsValue(record ?? {}); }

  async function submitMat(values: object) {
    if (matModal.record) await materials.update.mutateAsync({ id: matModal.record.id, ...values });
    else await materials.create.mutateAsync(values);
    setMatModal({ open: false }); matForm.resetFields();
  }
  async function submitSup(values: object) {
    if (supModal.record) await suppliers.update.mutateAsync({ id: supModal.record.id, ...values });
    else await suppliers.create.mutateAsync(values);
    setSupModal({ open: false }); supForm.resetFields();
  }
  async function submitWh(values: object) {
    if (whModal.record) await warehouses.update.mutateAsync({ id: whModal.record.id, ...values });
    else await warehouses.create.mutateAsync(values);
    setWhModal({ open: false }); whForm.resetFields();
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="物料主数据" extra={<Button type="primary" size="small" onClick={() => openMat()}>新建物料</Button>}>
            <Table rowKey="id" dataSource={materials.query.data ?? []} size="small"
              columns={[
                { title: "编码", dataIndex: "code" },
                { title: "名称", dataIndex: "name" },
                { title: "规格", dataIndex: "specification" },
                { title: "类型", dataIndex: "type", render: (v: string) => MATERIAL_TYPES.find(t => t.value === v)?.label ?? v },
                { title: "单位", dataIndex: "unit" },
                { title: "安全库存", dataIndex: "safetyStock" },
                {
                  title: "操作", render: (_: unknown, record: Material) => (
                    <Space>
                      <Button size="small" onClick={() => openMat(record)}>编辑</Button>
                      <Popconfirm title="确认删除？" onConfirm={() => materials.remove.mutate(record.id)}>
                        <Button size="small" danger>删除</Button>
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="供应商" extra={<Button type="primary" size="small" onClick={() => openSup()}>新建供应商</Button>}>
            <Table rowKey="id" dataSource={suppliers.query.data ?? []} size="small" pagination={false}
              columns={[
                { title: "编码", dataIndex: "code" },
                { title: "名称", dataIndex: "name" },
                {
                  title: "操作", render: (_: unknown, record: Supplier) => (
                    <Space>
                      <Button size="small" onClick={() => openSup(record)}>编辑</Button>
                      <Popconfirm title="确认删除？" onConfirm={() => suppliers.remove.mutate(record.id)}>
                        <Button size="small" danger>删除</Button>
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="仓库" extra={<Button type="primary" size="small" onClick={() => openWh()}>新建仓库</Button>}>
            <Table rowKey="id" dataSource={warehouses.query.data ?? []} size="small" pagination={false}
              columns={[
                { title: "编码", dataIndex: "code" },
                { title: "名称", dataIndex: "name" },
                {
                  title: "操作", render: (_: unknown, record: Warehouse) => (
                    <Space>
                      <Button size="small" onClick={() => openWh(record)}>编辑</Button>
                      <Popconfirm title="确认删除？" onConfirm={() => warehouses.remove.mutate(record.id)}>
                        <Button size="small" danger>删除</Button>
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal title={matModal.record ? "编辑物料" : "新建物料"} open={matModal.open}
        onOk={() => matForm.submit()} onCancel={() => { setMatModal({ open: false }); matForm.resetFields(); }}
        confirmLoading={materials.create.isPending || materials.update.isPending}>
        <Form form={matForm} layout="vertical" onFinish={submitMat}>
          <Form.Item name="code" label="编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="specification" label="规格"><Input /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}><Select options={MATERIAL_TYPES} /></Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="safetyStock" label="安全库存" rules={[{ required: true }]}><Input type="number" /></Form.Item>
          <Form.Item name="leadTimeDays" label="提前期(天)" rules={[{ required: true }]}><Input type="number" /></Form.Item>
        </Form>
      </Modal>

      <Modal title={supModal.record ? "编辑供应商" : "新建供应商"} open={supModal.open}
        onOk={() => supForm.submit()} onCancel={() => { setSupModal({ open: false }); supForm.resetFields(); }}
        confirmLoading={suppliers.create.isPending || suppliers.update.isPending}>
        <Form form={supForm} layout="vertical" onFinish={submitSup}>
          <Form.Item name="code" label="编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title={whModal.record ? "编辑仓库" : "新建仓库"} open={whModal.open}
        onOk={() => whForm.submit()} onCancel={() => { setWhModal({ open: false }); whForm.resetFields(); }}
        confirmLoading={warehouses.create.isPending || warehouses.update.isPending}>
        <Form form={whForm} layout="vertical" onFinish={submitWh}>
          <Form.Item name="code" label="编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
