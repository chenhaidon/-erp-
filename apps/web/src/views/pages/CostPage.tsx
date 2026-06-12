import { Button, Card, Col, Row, Statistic, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../lib/api";

type ProductionCostRow = {
  id: string; orderNo: string; productName: string; quantity: number; status: string;
  materialCost: number; laborCost: number; overheadCost: number; totalCost: number; calculated: boolean;
};
type PurchaseSummary = {
  grandTotal: number;
  bySupplier: Array<{ supplier: string; totalAmount: number; orderCount: number }>;
  orders: Array<{ id: string; orderNo: string; supplierName: string; materialCode: string; quantity: number; unitPrice: number; totalAmount: number; status: string }>;
};
type Overview = { totalProductionCost: number; totalPurchaseCost: number; estimatedMargin: number; ordersCalculated: number };

const fmt = (v: number) => `¥${v.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`;

export function CostPage() {
  const qc = useQueryClient();
  const overviewQuery = useQuery<Overview>({ queryKey: ["cost-overview"], queryFn: async () => (await api.get("/costs/overview")).data });
  const prodQuery = useQuery<ProductionCostRow[]>({ queryKey: ["cost-production"], queryFn: async () => (await api.get("/costs/production-orders")).data });
  const purchaseQuery = useQuery<PurchaseSummary>({ queryKey: ["cost-purchase"], queryFn: async () => (await api.get("/costs/purchase-summary")).data });

  const calculateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/costs/production-orders/${id}/calculate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cost-production"] });
      qc.invalidateQueries({ queryKey: ["cost-overview"] });
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={8}><Card><Statistic title="工单总成本" value={overviewQuery.data?.totalProductionCost ?? 0} formatter={v => fmt(Number(v))} /></Card></Col>
        <Col span={8}><Card><Statistic title="采购总额" value={overviewQuery.data?.totalPurchaseCost ?? 0} formatter={v => fmt(Number(v))} /></Card></Col>
        <Col span={8}><Card><Statistic title="已核算工单数" value={overviewQuery.data?.ordersCalculated ?? 0} suffix="单" /></Card></Col>
      </Row>

      <Card title="工单成本明细">
        <Table rowKey="id" size="small" dataSource={prodQuery.data ?? []}
          columns={[
            { title: "工单号", dataIndex: "orderNo" },
            { title: "产品", dataIndex: "productName" },
            { title: "数量", dataIndex: "quantity" },
            { title: "状态", dataIndex: "status" },
            { title: "料工费", dataIndex: "materialCost", render: fmt },
            { title: "人工费", dataIndex: "laborCost", render: fmt },
            { title: "制造费", dataIndex: "overheadCost", render: fmt },
            { title: "合计", dataIndex: "totalCost", render: (v: number) => <strong>{fmt(v)}</strong> },
            {
              title: "操作",
              render: (_: unknown, record: ProductionCostRow) => (
                <Button size="small" type={record.calculated ? "default" : "primary"}
                  loading={calculateMutation.isPending}
                  onClick={() => calculateMutation.mutate(record.id)}>
                  {record.calculated ? "重新核算" : "核算"}
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="采购成本（按供应商）">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={purchaseQuery.data?.bySupplier ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `¥${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                <Legend />
                <Bar dataKey="totalAmount" name="采购金额" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="采购单明细">
            <Table rowKey="id" size="small" pagination={{ pageSize: 6 }} dataSource={purchaseQuery.data?.orders ?? []}
              columns={[
                { title: "单号", dataIndex: "orderNo" },
                { title: "供应商", dataIndex: "supplierName" },
                { title: "物料", dataIndex: "materialCode" },
                { title: "数量", dataIndex: "quantity" },
                { title: "单价", dataIndex: "unitPrice", render: fmt },
                { title: "金额", dataIndex: "totalAmount", render: fmt },
                { title: "状态", dataIndex: "status", render: (v: string) => <Tag>{v}</Tag> }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
